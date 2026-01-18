import { GameState, Player, Move, TTTCell, Winner } from '@/types';

// TTT board is a flat array of 9 cells (indices 0-8)
// Index mapping:
// 0 1 2
// 3 4 5
// 6 7 8

const WIN_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // columns
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

export function initTTTState(): GameState {
  return {
    gameType: 'ttt',
    board: Array(9).fill(null) as TTTCell[],
    currentPlayer: 'A',
    moveHistory: [],
    winner: null,
    winLine: null,
    isTerminal: false,
  };
}

export function getTTTLegalMoves(board: TTTCell[]): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

export function applyTTTMove(
  state: GameState,
  move: Move,
  player: Player
): { newState: GameState; valid: boolean; error?: string } {
  const board = state.board as TTTCell[];

  // Validate move
  if (move < 0 || move > 8 || !Number.isInteger(move)) {
    return { newState: state, valid: false, error: 'Move out of bounds (must be 0-8)' };
  }

  if (board[move] !== null) {
    return { newState: state, valid: false, error: 'Cell already occupied' };
  }

  // Apply move
  const newBoard = [...board] as TTTCell[];
  newBoard[move] = player === 'A' ? 'X' : 'O';

  // Check for winner
  const { winner, winLine } = checkTTTWinner(newBoard);

  // Check for draw
  const isDraw = winner === null && newBoard.every(cell => cell !== null);

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: player === 'A' ? 'B' : 'A',
    winner: winner ? (winner === 'X' ? 'A' : 'B') : (isDraw ? 'draw' : null),
    winLine,
    isTerminal: winner !== null || isDraw,
  };

  return { newState, valid: true };
}

export function checkTTTWinner(board: TTTCell[]): { winner: 'X' | 'O' | null; winLine: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winLine: line };
    }
  }
  return { winner: null, winLine: null };
}

export function formatTTTBoard(board: TTTCell[]): string {
  const display = board.map((cell, i) => cell || '_');
  return `${display[0]} | ${display[1]} | ${display[2]}
---------
${display[3]} | ${display[4]} | ${display[5]}
---------
${display[6]} | ${display[7]} | ${display[8]}`;
}

// Find winning moves for a given mark
function findWinningMoves(board: TTTCell[], mark: TTTCell): number[] {
  const winningMoves: number[] = [];
  for (const line of WIN_LINES) {
    const cells = line.map(i => board[i]);
    const markCount = cells.filter(c => c === mark).length;
    const emptyCount = cells.filter(c => c === null).length;

    if (markCount === 2 && emptyCount === 1) {
      const emptyIdx = line.find(i => board[i] === null);
      if (emptyIdx !== undefined && !winningMoves.includes(emptyIdx)) {
        winningMoves.push(emptyIdx);
      }
    }
  }
  return winningMoves;
}

export function getTTTBoardForPrompt(board: TTTCell[], player: Player): string {
  const myMark = player === 'A' ? 'X' : 'O';
  const oppMark = player === 'A' ? 'O' : 'X';
  const legalMoves = getTTTLegalMoves(board);

  // Find strategic information
  const myWinningMoves = findWinningMoves(board, myMark);
  const oppWinningMoves = findWinningMoves(board, oppMark);

  let strategyHint = '';
  if (myWinningMoves.length > 0) {
    strategyHint = `\n\nURGENT: You can WIN immediately by playing: ${myWinningMoves.join(' or ')}`;
  } else if (oppWinningMoves.length > 0) {
    strategyHint = `\n\nURGENT: Opponent can win next turn! BLOCK by playing: ${oppWinningMoves.join(' or ')}`;
  }

  return `You are playing Tic-Tac-Toe. Your mark is "${myMark}". Opponent's mark is "${oppMark}".

GOAL: Get 3 of your marks in a row (horizontal, vertical, or diagonal) to WIN.

Board positions (use these numbers for your move):
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8

Current board state:
${formatTTTBoard(board)}

Win conditions - 3 in a row on any of these lines:
- Rows: [0,1,2], [3,4,5], [6,7,8]
- Columns: [0,3,6], [1,4,7], [2,5,8]
- Diagonals: [0,4,8], [2,4,6]

Available moves: [${legalMoves.join(', ')}]${strategyHint}

STRATEGY PRIORITY:
1. WIN: If you can get 3 in a row, do it!
2. BLOCK: If opponent has 2 in a row with an empty cell, block them!
3. CENTER: Position 4 (center) is strategically valuable
4. CORNERS: Positions 0, 2, 6, 8 are strong

Think carefully and make the BEST move to win.`;
}
