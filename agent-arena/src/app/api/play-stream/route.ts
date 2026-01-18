import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  GameType,
  ModelType,
  GPTModel,
  DeepSeekModel,
  GeminiModel,
  AgentConfig,
  MoveRecord,
  MatchResult,
  AgentMetrics,
  TTTCell,
  C4Cell,
  Player,
} from '@/types';
import { initTTTState, applyTTTMove, getTTTLegalMoves } from '@/lib/games/tictactoe';
import { initC4State, applyC4Move, getC4LegalMoves } from '@/lib/games/connect4';
import { callAgent } from '@/lib/agents';
import { saveMatch } from '@/lib/db';

const VALID_GPT_MODELS: GPTModel[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const VALID_DEEPSEEK_MODELS: DeepSeekModel[] = ['deepseek-chat', 'deepseek-reasoner'];
const VALID_GEMINI_MODELS: GeminiModel[] = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
const MAX_MOVES = 100;

function isValidGameType(val: unknown): val is GameType {
  return val === 'ttt' || val === 'c4';
}

function isValidModelType(val: unknown): val is ModelType {
  return val === 'gpt' || val === 'deepseek' || val === 'gemini';
}

function isValidModelVariant(model: ModelType, variant: unknown): variant is GPTModel | DeepSeekModel | GeminiModel {
  if (model === 'gpt') {
    return VALID_GPT_MODELS.includes(variant as GPTModel);
  } else if (model === 'deepseek') {
    return VALID_DEEPSEEK_MODELS.includes(variant as DeepSeekModel);
  } else {
    return VALID_GEMINI_MODELS.includes(variant as GeminiModel);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate request
  if (!isValidGameType(body.gameType)) {
    return new Response(JSON.stringify({ error: 'Invalid gameType' }), { status: 400 });
  }

  if (!body.agentA || !isValidModelType(body.agentA.model) ||
      !isValidModelVariant(body.agentA.model, body.agentA.modelVariant)) {
    return new Response(JSON.stringify({ error: 'Invalid agentA configuration' }), { status: 400 });
  }

  if (!body.agentB || !isValidModelType(body.agentB.model) ||
      !isValidModelVariant(body.agentB.model, body.agentB.modelVariant)) {
    return new Response(JSON.stringify({ error: 'Invalid agentB configuration' }), { status: 400 });
  }

  const gameType: GameType = body.gameType;
  const agentA: AgentConfig = {
    model: body.agentA.model,
    modelVariant: body.agentA.modelVariant,
  };
  const agentB: AgentConfig = {
    model: body.agentB.model,
    modelVariant: body.agentB.modelVariant,
  };

  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const startTime = Date.now();
        let state = gameType === 'ttt' ? initTTTState() : initC4State();
        const moves: MoveRecord[] = [];
        const metricsA: AgentMetrics = { invalidJsonCount: 0, illegalMoveCount: 0, retryCount: 0 };
        const metricsB: AgentMetrics = { invalidJsonCount: 0, illegalMoveCount: 0, retryCount: 0 };
        let forfeitedBy: Player | null = null;

        send('start', { gameType, agentA, agentB });

        while (!state.isTerminal && moves.length < MAX_MOVES) {
          const currentPlayer = state.currentPlayer;
          const agent = currentPlayer === 'A' ? agentA : agentB;
          const metrics = currentPlayer === 'A' ? metricsA : metricsB;

          const legalMoves = gameType === 'ttt'
            ? getTTTLegalMoves(state.board as TTTCell[])
            : getC4LegalMoves(state.board as C4Cell[]);

          if (legalMoves.length === 0) break;

          // Send thinking event
          send('thinking', { player: currentPlayer, modelVariant: agent.modelVariant });

          // Call agent and track duration
          const moveStartTime = Date.now();
          const result = await callAgent(
            agent.model,
            agent.modelVariant,
            gameType,
            state.board,
            currentPlayer,
            legalMoves
          );
          const moveDurationMs = Date.now() - moveStartTime;

          metrics.invalidJsonCount += result.invalidJsonCount;
          metrics.illegalMoveCount += result.illegalMoveCount;
          metrics.retryCount += result.retryCount;

          const moveHadError = result.retryCount > 0 || result.invalidJsonCount > 0 || result.illegalMoveCount > 0;
          const moveRetries = result.retryCount;

          if (result.forfeit) {
            forfeitedBy = currentPlayer;
            send('forfeit', { player: currentPlayer, reason: result.forfeitReason });
            break;
          }

          // Apply move
          const applyResult = gameType === 'ttt'
            ? applyTTTMove(state, result.response!.move, currentPlayer)
            : applyC4Move(state, result.response!.move, currentPlayer);

          if (!applyResult.valid) {
            forfeitedBy = currentPlayer;
            break;
          }

          const moveRecord: MoveRecord = {
            player: currentPlayer,
            move: result.response!.move,
            reason: result.response!.reason,
            plan: result.response!.plan,
            timestamp: Date.now(),
            durationMs: moveDurationMs,
            retries: moveRetries,
            hadError: moveHadError,
          };
          moves.push(moveRecord);

          // Send move event
          send('move', {
            player: currentPlayer,
            move: result.response!.move,
            reason: result.response!.reason,
            plan: result.response!.plan,
            modelVariant: agent.modelVariant,
            board: applyResult.newState.board,
            winLine: applyResult.newState.winLine,
            isTerminal: applyResult.newState.isTerminal,
            winner: applyResult.newState.winner,
            durationMs: moveDurationMs,
            retries: moveRetries,
            hadError: moveHadError,
          });

          state = applyResult.newState;
          state.moveHistory = moves;
        }

        const endTime = Date.now();

        // Determine winner
        let winner = state.winner;
        if (forfeitedBy) {
          winner = forfeitedBy === 'A' ? 'B' : 'A';
        }
        if (!winner) {
          winner = 'draw';
        }

        let winnerModel = null;
        if (winner === 'A') {
          winnerModel = agentA.model;
        } else if (winner === 'B') {
          winnerModel = agentB.model;
        }

        const matchResult: MatchResult = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          gameType,
          agentA,
          agentB,
          winner,
          winnerModel,
          moves,
          metrics: {
            totalMoves: moves.length,
            durationMs: endTime - startTime,
            agentA: metricsA,
            agentB: metricsB,
          },
          winLine: state.winLine,
          finalBoard: state.board,
        };

        // Save match
        await saveMatch(matchResult);

        // Send complete event
        send('complete', matchResult);
      } catch (error) {
        send('error', { message: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
