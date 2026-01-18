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
  BSCell,
  Player,
} from '@/types';
import { initTTTState, applyTTTMove, getTTTLegalMoves } from '@/lib/games/tictactoe';
import { initC4State, applyC4Move, getC4LegalMoves } from '@/lib/games/connect4';
import { initBSState, applyBSMove, getBSLegalMoves } from '@/lib/games/battleship';
import { callAgent } from '@/lib/agents';
import { saveMatch } from '@/lib/db';

const VALID_GPT_MODELS: GPTModel[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const VALID_DEEPSEEK_MODELS: DeepSeekModel[] = ['deepseek-chat', 'deepseek-reasoner'];
const VALID_GEMINI_MODELS: GeminiModel[] = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
const MAX_MOVES = 100;

function isValidGameType(val: unknown): val is GameType {
  return val === 'ttt' || val === 'c4' || val === 'bs';
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
        let state = gameType === 'ttt' 
          ? initTTTState() 
          : gameType === 'c4' 
          ? initC4State() 
          : initBSState(Date.now());
        const moves: MoveRecord[] = [];
        const metricsA: AgentMetrics = { 
          invalidJsonCount: 0, 
          illegalMoveCount: 0, 
          retryCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalThinkingTimeMs: 0,
        };
        const metricsB: AgentMetrics = { 
          invalidJsonCount: 0, 
          illegalMoveCount: 0, 
          retryCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalThinkingTimeMs: 0,
        };
        let forfeitedBy: Player | null = null;

        send('start', { gameType, agentA, agentB });

        while (!state.isTerminal && moves.length < MAX_MOVES) {
          const currentPlayer = state.currentPlayer;
          const agent = currentPlayer === 'A' ? agentA : agentB;
          const metrics = currentPlayer === 'A' ? metricsA : metricsB;

          const legalMoves = gameType === 'ttt'
            ? getTTTLegalMoves(state.board as TTTCell[])
            : gameType === 'c4'
            ? getC4LegalMoves(state.board as C4Cell[])
            : getBSLegalMoves(state, currentPlayer);

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
            legalMoves,
            gameType === 'bs' ? state : undefined
          );
          const moveDurationMs = Date.now() - moveStartTime;

          metrics.invalidJsonCount += result.invalidJsonCount;
          metrics.illegalMoveCount += result.illegalMoveCount;
          metrics.retryCount += result.retryCount;
          metrics.totalThinkingTimeMs = (metrics.totalThinkingTimeMs || 0) + moveDurationMs;
          
          if (result.inputTokens !== undefined) {
            metrics.totalInputTokens = (metrics.totalInputTokens || 0) + result.inputTokens;
          }
          if (result.outputTokens !== undefined) {
            metrics.totalOutputTokens = (metrics.totalOutputTokens || 0) + result.outputTokens;
          }

          const moveHadError = result.retryCount > 0 || result.invalidJsonCount > 0 || result.illegalMoveCount > 0;
          const moveRetries = result.retryCount;

          if (result.forfeit) {
            forfeitedBy = currentPlayer;
            send('forfeit', { player: currentPlayer, reason: result.forfeitReason });
            break;
          }

          // Apply move
          let applyResult: { newState: any; valid: boolean; error?: string; outcome?: any };
          if (gameType === 'ttt') {
            applyResult = applyTTTMove(state, result.response!.move, currentPlayer);
          } else if (gameType === 'c4') {
            applyResult = applyC4Move(state, result.response!.move, currentPlayer);
          } else if (gameType === 'bs') {
            applyResult = applyBSMove(state, result.response!.move, currentPlayer);
          } else {
            throw new Error(`Unknown game type: ${gameType}`);
          }

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

          // Add battleship-specific fields
          if (gameType === 'bs' && applyResult.outcome) {
            moveRecord.outcome = applyResult.outcome.outcome;
            moveRecord.sunkShipName = applyResult.outcome.sunkShipName;
          }

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
            // Battleship-specific
            placementsA: gameType === 'bs' ? applyResult.newState.placementsA : undefined,
            placementsB: gameType === 'bs' ? applyResult.newState.placementsB : undefined,
            moveOwnership: gameType === 'bs' ? applyResult.newState.moveOwnership : undefined,
          });

          state = applyResult.newState;
          state.moveHistory = moves;
        }

        const endTime = Date.now();

        // Determine winner
        let winner: 'A' | 'B' | 'draw' = state.winner || 'draw';
        if (forfeitedBy) {
          winner = forfeitedBy === 'A' ? 'B' : 'A';
        } else if (!state.winner) {
          // Battleship should never draw - if no winner and game ended, check ship health
          if (gameType === 'bs') {
            // For battleship, check if all ships are sunk for either player
            const totalHealthA = Object.values(state.shipHealthA || {}).reduce((sum, h) => sum + h, 0);
            const totalHealthB = Object.values(state.shipHealthB || {}).reduce((sum, h) => sum + h, 0);
            if (totalHealthA === 0) winner = 'B';
            else if (totalHealthB === 0) winner = 'A';
            else winner = 'draw'; // Fallback, but shouldn't happen
          } else {
            winner = 'draw';
          }
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
          // Battleship-specific
          placementsA: gameType === 'bs' ? state.placementsA : undefined,
          placementsB: gameType === 'bs' ? state.placementsB : undefined,
          moveOwnership: gameType === 'bs' ? state.moveOwnership : undefined,
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
