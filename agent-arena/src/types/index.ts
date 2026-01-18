// Game types
export type GameType = 'ttt' | 'c4';
export type ModelType = 'gpt' | 'deepseek' | 'gemini';
export type Player = 'A' | 'B';
export type Winner = 'A' | 'B' | 'draw';

// Model variants
export type GPTModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

// Tic-Tac-Toe: 0-8 index, Connect-4: 0-6 column
export type Move = number;

// Cell values
export type TTTCell = 'X' | 'O' | null;
export type C4Cell = 'R' | 'Y' | null; // Red, Yellow

export interface AgentConfig {
  model: ModelType;
  modelVariant: GPTModel | DeepSeekModel | GeminiModel;
}

export interface GameState {
  gameType: GameType;
  board: (TTTCell | C4Cell)[];
  currentPlayer: Player;
  moveHistory: MoveRecord[];
  winner: Winner | null;
  winLine: number[] | null;
  isTerminal: boolean;
}

export interface MoveRecord {
  player: Player;
  move: Move;
  reason?: string;
  plan?: string[];
  timestamp: number;
  durationMs?: number;
  retries?: number;
  hadError?: boolean;
}

export interface AgentMetrics {
  invalidJsonCount: number;
  illegalMoveCount: number;
  retryCount: number;
}

export interface MatchResult {
  id: string;
  createdAt: string;
  gameType: GameType;
  agentA: AgentConfig;
  agentB: AgentConfig;
  winner: Winner;
  winnerModel: ModelType | null;
  moves: MoveRecord[];
  metrics: {
    totalMoves: number;
    durationMs: number;
    agentA: AgentMetrics;
    agentB: AgentMetrics;
  };
  winLine: number[] | null;
  finalBoard: (TTTCell | C4Cell)[];
}

export interface GlobalStats {
  ttt: GameStats;
  c4: GameStats;
}

export interface GameStats {
  matchesPlayed: number;
  draws: number;
  winsByModel: {
    gpt: number;
    deepseek: number;
    gemini: number;
  };
}

export interface PlayRequest {
  gameType: GameType;
  agentA: AgentConfig;
  agentB: AgentConfig;
}

export interface AgentResponse {
  move: Move;
  reason?: string;
  plan?: string[];
}
