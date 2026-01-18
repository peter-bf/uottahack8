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

// Different move limits for different games
const MAX_MOVES_TTT = 10;
const MAX_MOVES_C4 = 42;
const MAX_MOVES_BS = 10000; // Battleship should NEVER end in a draw - only when someone wins

function getMaxMoves(gameType: GameType): number {
  if (gameType === 'ttt') return MAX_MOVES_TTT;
  if (gameType === 'c4') return MAX_MOVES_C4;
  return MAX_MOVES_BS;
}

export async function runMatch(
  gameType: GameType,
  agentA: AgentConfig,
  agentB: AgentConfig
): Promise<MatchResult> {
  const startTime = Date.now();
  const MAX_MOVES = getMaxMoves(gameType);

  // Initialize game state
  let state = gameType === 'ttt' 
    ? initTTTState() 
    : gameType === 'c4' 
    ? initC4State() 
    : initBSState();
  const moves: MoveRecord[] = [];

  const metricsA: AgentMetrics = { invalidJsonCount: 0, illegalMoveCount: 0, retryCount: 0 };
  const metricsB: AgentMetrics = { invalidJsonCount: 0, illegalMoveCount: 0, retryCount: 0 };

  let forfeitedBy: Player | null = null;

  // Run game loop
  while (!state.isTerminal && moves.length < MAX_MOVES) {
    const currentPlayer = state.currentPlayer;
    const agent = currentPlayer === 'A' ? agentA : agentB;
    const metrics = currentPlayer === 'A' ? metricsA : metricsB;

    // Get legal moves based on game type
    // Get legal moves based on game type
    let legalMoves: number[];
    if (gameType === 'ttt') {
      legalMoves = getTTTLegalMoves(state.board as TTTCell[]);
    } else if (gameType === 'c4') {
      legalMoves = getC4LegalMoves(state.board as C4Cell[]);
    } else {
      // Battleship
      legalMoves = getBSLegalMoves(state, currentPlayer);
    }

    if (legalMoves.length === 0) {
      // No legal moves - for Battleship, shouldn't happen. For TTT/C4, it's a draw
      if (gameType !== 'bs') {
        break;
      }
    }

    // Call agent
    const result = await callAgent(
      agent.model,
      agent.modelVariant,
      gameType,
      state.board,
      currentPlayer,
      legalMoves,
      gameType === 'bs' ? state : undefined // Pass full state for battleship
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

    // Apply move based on game type
    let applyResult: any;
    if (gameType === 'ttt') {
      applyResult = applyTTTMove(state, result.response!.move, currentPlayer);
    } else if (gameType === 'c4') {
      applyResult = applyC4Move(state, result.response!.move, currentPlayer);
    } else {
      // Battleship
      applyResult = applyBSMove(state, result.response!.move, currentPlayer);
    }

    if (!applyResult.valid) {
      // This shouldn't happen since we validated, but handle it
      forfeitedBy = currentPlayer;
      break;
    }

    // Record move with outcome info for battleship
    const moveRecord: MoveRecord = {
      player: currentPlayer,
      move: result.response!.move,
      reason: result.response!.reason,
      plan: result.response!.plan,
      timestamp: Date.now(),
    };

    // Add battleship-specific outcome if present
    if (applyResult.outcome) {
      moveRecord.outcome = applyResult.outcome.outcome;
      if (applyResult.outcome.sunkShipName) {
        moveRecord.sunkShipName = applyResult.outcome.sunkShipName;
      }
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
  if (!winner) {
    // If we hit move limit without a winner, it's a draw
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
    // Include battleship placements if available
    ...(gameType === 'bs' && {
      placementsA: state.placementsA,
      placementsB: state.placementsB,
      moveOwnership: state.moveOwnership,
      finalBoardA: state.boardA,
      finalBoardB: state.boardB,
    }),
  };
}
