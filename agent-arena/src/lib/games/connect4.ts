import { GameState, Player, Move, C4Cell, Winner } from '@/types';

// Connect-4 board is 6 rows x 7 columns = 42 cells
// Stored in row-major order (row 0 is top, row 5 is bottom)
// Index = row * 7 + col

const ROWS = 6;
const COLS = 7;

export function initC4State(): GameState {
  return {
    gameType: 'c4',
    board: Array(42).fill(null) as C4Cell[],
    currentPlayer: 'A',
    moveHistory: [],
    winner: null,
    winLine: null,
    isTerminal: false,
  };
}

function getIndex(row: number, col: number): number {
  return row * COLS + col;
}

function getLowestEmptyRow(board: C4Cell[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[getIndex(row, col)] === null) {
      return row;
    }
  }
  return -1; // Column is full
}

export function getC4LegalMoves(board: C4Cell[]): Move[] {
  const moves: Move[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[getIndex(0, col)] === null) {
      moves.push(col);
    }
  }
  return moves;
}

export function applyC4Move(
  state: GameState,
  move: Move,
  player: Player
): { newState: GameState; valid: boolean; error?: string; dropRow?: number } {
  const board = state.board as C4Cell[];

  // Validate move
  if (move < 0 || move > 6 || !Number.isInteger(move)) {
    return { newState: state, valid: false, error: 'Column out of bounds (must be 0-6)' };
  }

  const row = getLowestEmptyRow(board, move);
  if (row === -1) {
    return { newState: state, valid: false, error: 'Column is full' };
  }

  // Apply move
  const newBoard = [...board] as C4Cell[];
  const index = getIndex(row, move);
  newBoard[index] = player === 'A' ? 'R' : 'Y';

  // Check for winner
  const { winner, winLine } = checkC4Winner(newBoard);

  // Check for draw
  const isDraw = winner === null && getC4LegalMoves(newBoard).length === 0;

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: player === 'A' ? 'B' : 'A',
    winner: winner ? (winner === 'R' ? 'A' : 'B') : (isDraw ? 'draw' : null),
    winLine,
    isTerminal: winner !== null || isDraw,
  };

  return { newState, valid: true, dropRow: row };
}

export function checkC4Winner(board: C4Cell[]): { winner: 'R' | 'Y' | null; winLine: number[] | null } {
  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const idx = getIndex(row, col);
      const line = [idx, idx + 1, idx + 2, idx + 3];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col < COLS; col++) {
      const line = [
        getIndex(row, col),
        getIndex(row + 1, col),
        getIndex(row + 2, col),
        getIndex(row + 3, col),
      ];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  // Check diagonal (down-right)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const line = [
        getIndex(row, col),
        getIndex(row + 1, col + 1),
        getIndex(row + 2, col + 2),
        getIndex(row + 3, col + 3),
      ];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  // Check diagonal (down-left)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 3; col < COLS; col++) {
      const line = [
        getIndex(row, col),
        getIndex(row + 1, col - 1),
        getIndex(row + 2, col - 2),
        getIndex(row + 3, col - 3),
      ];
      const cells = line.map(i => board[i]);
      if (cells[0] && cells.every(c => c === cells[0])) {
        return { winner: cells[0], winLine: line };
      }
    }
  }

  return { winner: null, winLine: null };
}

export function formatC4Board(board: C4Cell[]): string {
  const rows: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    const rowCells: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const cell = board[getIndex(row, col)];
      rowCells.push(cell || '_');
    }
    rows.push(`| ${rowCells.join(' | ')} |`);
  }
  return rows.join('\n');
}

// Find columns where dropping a piece would complete 4-in-a-row
function findWinningColumns(board: C4Cell[], mark: C4Cell): number[] {
  const winningCols: number[] = [];
  const legalMoves = getC4LegalMoves(board);

  for (const col of legalMoves) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;

    // Simulate placing the piece
    const testBoard = [...board] as C4Cell[];
    testBoard[getIndex(row, col)] = mark;

    // Check if this creates a win
    const { winner } = checkC4Winner(testBoard);
    if (winner === mark) {
      winningCols.push(col);
    }
  }

  return winningCols;
}

// Find columns that would set up a threat (3-in-a-row with open space)
function findThreateningColumns(board: C4Cell[], mark: C4Cell): number[] {
  const threateningCols: number[] = [];
  const legalMoves = getC4LegalMoves(board);

  for (const col of legalMoves) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;

    // Simulate placing the piece
    const testBoard = [...board] as C4Cell[];
    testBoard[getIndex(row, col)] = mark;

    // Check if this creates a position where we can win next turn
    const futureMoves = getC4LegalMoves(testBoard);
    for (const futureCol of futureMoves) {
      const futureRow = getLowestEmptyRow(testBoard, futureCol);
      if (futureRow === -1) continue;

      const futureBoard = [...testBoard] as C4Cell[];
      futureBoard[getIndex(futureRow, futureCol)] = mark;

      const { winner } = checkC4Winner(futureBoard);
      if (winner === mark && !threateningCols.includes(col)) {
        threateningCols.push(col);
      }
    }
  }

  return threateningCols;
}

export function getC4BoardForPrompt(board: C4Cell[], player: Player): string {
  const myMark = player === 'A' ? 'R' : 'Y';
  const oppMark = player === 'A' ? 'Y' : 'R';
  const myColor = player === 'A' ? 'Red (R)' : 'Yellow (Y)';
  const oppColor = player === 'A' ? 'Yellow (Y)' : 'Red (R)';
  const legalMoves = getC4LegalMoves(board);

  // Find strategic information
  const myWinningCols = findWinningColumns(board, myMark);
  const oppWinningCols = findWinningColumns(board, oppMark);

  let strategyHint = '';
  if (myWinningCols.length > 0) {
    strategyHint = `\n\n*** URGENT: You can WIN immediately by playing column: ${myWinningCols.join(' or ')} ***`;
  } else if (oppWinningCols.length > 0) {
    strategyHint = `\n\n*** URGENT: Opponent can win next turn! BLOCK by playing column: ${oppWinningCols.join(' or ')} ***`;
  }

  return `You are playing Connect-4. Your color is ${myColor}. Opponent is ${oppColor}.

GOAL: Get 4 of your pieces in a row (horizontal, vertical, or diagonal) to WIN.

Board layout (6 rows × 7 columns):
- Row 0 is TOP, Row 5 is BOTTOM
- Pieces drop DOWN to the lowest available row in the chosen column
- Column numbers: 0  1  2  3  4  5  6

Current board state:
| 0 | 1 | 2 | 3 | 4 | 5 | 6 |  <- Column numbers
${formatC4Board(board)}

Available columns to drop into: [${legalMoves.join(', ')}]${strategyHint}

WIN CONDITIONS - Get 4 in a row:
- Horizontal: 4 pieces in same row
- Vertical: 4 pieces in same column
- Diagonal: 4 pieces diagonally (either direction)

STRATEGY PRIORITY:
1. WIN: If you can connect 4 now, do it.
2. BLOCK: If opponent can connect 4 next turn, block it.
3. SAFETY: Avoid moves that give the opponent an immediate winning drop.
4. THREATS: Create double threats (two winning lines at once).
5. POSITION: Favor center columns and moves that increase future connect-4 lines.

Quick tactical checks:
1. After choosing a candidate move, imagine the opponent's best reply.
2. Do not play under an opponent's 3-in-a-row if it gives them a winning drop on top.

Make the BEST move to win.`;
}
