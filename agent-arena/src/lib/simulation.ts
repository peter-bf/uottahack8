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
  BSCell,
} from '@/types';
import { initTTTState, applyTTTMove, getTTTLegalMoves } from './games/tictactoe';
import { initC4State, applyC4Move, getC4LegalMoves } from './games/connect4';
import { initBSState, applyBSMove, getBSLegalMoves } from './games/battleship';
import { callAgent } from './agents';

const MAX_MOVES = 100; // Safety limit

export async function runMatch(
  gameType: GameType,
  agentA: AgentConfig,
  agentB: AgentConfig,
  matchId?: string
): Promise<MatchResult> {
  const startTime = Date.now();

  // Initialize game state
  let state: GameState;
  if (gameType === 'ttt') {
    state = initTTTState();
  } else if (gameType === 'c4') {
    state = initC4State();
  } else if (gameType === 'bs') {
    state = initBSState(matchId || Date.now());
  } else {
    throw new Error(`Unknown game type: ${gameType}`);
  }

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
    let legalMoves: number[];
    if (gameType === 'ttt') {
      legalMoves = getTTTLegalMoves(state.board as TTTCell[]);
    } else if (gameType === 'c4') {
      legalMoves = getC4LegalMoves(state.board as C4Cell[]);
    } else if (gameType === 'bs') {
      legalMoves = getBSLegalMoves(state, currentPlayer);
    } else {
      throw new Error(`Unknown game type: ${gameType}`);
    }

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
      legalMoves,
      gameType === 'bs' ? state : undefined
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
    let applyResult: { newState: GameState; valid: boolean; error?: string; outcome?: any };
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
      // This shouldn't happen since we validated, but handle it
      forfeitedBy = currentPlayer;
      break;
    }

    // Record move
    const moveRecord: MoveRecord = {
      player: currentPlayer,
      move: result.response!.move,
      reason: result.response!.reason,
      plan: result.response!.plan,
      timestamp: Date.now(),
    };

    // Add battleship-specific fields
    if (gameType === 'bs' && applyResult.outcome) {
      moveRecord.outcome = applyResult.outcome.outcome;
      moveRecord.sunkShipName = applyResult.outcome.sunkShipName;
    }

    moves.push(moveRecord);

    state = applyResult.newState;
    state.moveHistory = moves;
  }

  const endTime = Date.now();

  // Determine winner
  let winner = state.winner;
  if (forfeitedBy) {
    winner = forfeitedBy === 'A' ? 'B' : 'A';
  }
  // Battleship should never draw - if no winner and game ended, it's an error state
  if (!winner && gameType !== 'bs') {
    winner = 'draw';
  } else if (!winner && gameType === 'bs') {
    // For battleship, if we reach here without a winner, something went wrong
    // Check if all ships are sunk for either player
    if (gameType === 'bs') {
      const totalHealthA = Object.values(state.shipHealthA || {}).reduce((sum, h) => sum + h, 0);
      const totalHealthB = Object.values(state.shipHealthB || {}).reduce((sum, h) => sum + h, 0);
      if (totalHealthA === 0) winner = 'B';
      else if (totalHealthB === 0) winner = 'A';
      else winner = 'draw'; // Fallback, but shouldn't happen
    }
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
    // Battleship-specific
    placementsA: gameType === 'bs' ? state.placementsA : undefined,
    placementsB: gameType === 'bs' ? state.placementsB : undefined,
    moveOwnership: gameType === 'bs' ? state.moveOwnership : undefined,
  };
}
