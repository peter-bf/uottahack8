import { v4 as uuidv4 } from 'uuid';
import {
  GameType,
  GameState,
  AgentConfig,
  Player,
  MoveRecord,
  MatchResult,
  AgentMetrics,
  TTTCell,
  C4Cell,
} from '@/types';
import { initTTTState, applyTTTMove, getTTTLegalMoves } from './games/tictactoe';
import { initC4State, applyC4Move, getC4LegalMoves } from './games/connect4';
import { callAgent } from './agents';

const MAX_MOVES = 100; // Safety limit

export async function runMatch(
  gameType: GameType,
  agentA: AgentConfig,
  agentB: AgentConfig
): Promise<MatchResult> {
  const startTime = Date.now();

  // Initialize game state
  let state = gameType === 'ttt' ? initTTTState() : initC4State();
  const moves: MoveRecord[] = [];

  const metricsA: AgentMetrics = { invalidJsonCount: 0, illegalMoveCount: 0, retryCount: 0 };
  const metricsB: AgentMetrics = { invalidJsonCount: 0, illegalMoveCount: 0, retryCount: 0 };

  let forfeitedBy: Player | null = null;

  // Run game loop
  while (!state.isTerminal && moves.length < MAX_MOVES) {
    const currentPlayer = state.currentPlayer;
    const agent = currentPlayer === 'A' ? agentA : agentB;
    const metrics = currentPlayer === 'A' ? metricsA : metricsB;

    // Get legal moves
    const legalMoves = gameType === 'ttt'
      ? getTTTLegalMoves(state.board as TTTCell[])
      : getC4LegalMoves(state.board as C4Cell[]);

    if (legalMoves.length === 0) {
      // No legal moves - game should be terminal (draw)
      break;
    }

    // Call agent
    const result = await callAgent(
      agent.model,
      agent.modelVariant,
      gameType,
      state.board,
      currentPlayer,
      legalMoves
    );

    // Update metrics
    metrics.invalidJsonCount += result.invalidJsonCount;
    metrics.illegalMoveCount += result.illegalMoveCount;
    metrics.retryCount += result.retryCount;

    if (result.forfeit) {
      // Agent forfeited - opponent wins
      forfeitedBy = currentPlayer;
      break;
    }

    // Apply move
    const applyResult = gameType === 'ttt'
      ? applyTTTMove(state, result.response!.move, currentPlayer)
      : applyC4Move(state, result.response!.move, currentPlayer);

    if (!applyResult.valid) {
      // This shouldn't happen since we validated, but handle it
      forfeitedBy = currentPlayer;
      break;
    }

    // Record move
    moves.push({
      player: currentPlayer,
      move: result.response!.move,
      reason: result.response!.reason,
      plan: result.response!.plan,
      timestamp: Date.now(),
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

  // Determine winner model
  let winnerModel = null;
  if (winner === 'A') {
    winnerModel = agentA.model;
  } else if (winner === 'B') {
    winnerModel = agentB.model;
  }

  return {
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
}
