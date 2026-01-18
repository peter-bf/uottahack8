'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameType,
  ModelType,
  MatchResult,
  GlobalStats as GlobalStatsType,
  TTTCell,
  C4Cell,
  BSCell,
  GPTModel,
  DeepSeekModel,
  GeminiModel,
  ShipPlacement,
  Player,
} from '@/types';
import { TicTacToeBoard } from '@/components/TicTacToeBoard';
import { Connect4Board } from '@/components/Connect4Board';
import { BattleshipBoard } from '@/components/BattleshipBoard';
import { AgentPanel } from '@/components/AgentPanel';
import { MatchResultCard } from '@/components/MatchResultCard';
import { GlobalStats } from '@/components/GlobalStats';
import { GameControls } from '@/components/GameControls';
import { ReplayControls } from '@/components/ReplayControls';
import { LiveOutput, LiveMove } from '@/components/LiveOutput';
import { PROVIDER_LABELS, getPlayerStyles } from '@/lib/ui/providerStyles';

const INITIAL_TTT_BOARD: TTTCell[] = Array(9).fill(null);
const INITIAL_C4_BOARD: C4Cell[] = Array(42).fill(null);
const INITIAL_BS_BOARD: BSCell[] = Array(100).fill('unknown');

// State for a single game session
interface GameSession {
  isRunning: boolean;
  matchResult: MatchResult | null;
  liveMoves: LiveMove[];
  currentThinking: 'A' | 'B' | null;
  displayBoard: (TTTCell | C4Cell | BSCell)[];
  currentMoveIndex: number;
  isAutoPlaying: boolean;
  lastMoveIdx: number | null;
  error: string | null;
  agentAModel: ModelType;
  agentAModelVariant: GPTModel | DeepSeekModel | GeminiModel;
  agentBModel: ModelType;
  agentBModelVariant: GPTModel | DeepSeekModel | GeminiModel;
  // Battleship-specific
  placementsA?: ShipPlacement[];
  placementsB?: ShipPlacement[];
  moveOwnership?: (Player | null)[];
}

const createInitialSession = (gameType: GameType): GameSession => ({
  isRunning: false,
  matchResult: null,
  liveMoves: [],
  currentThinking: null,
  displayBoard: gameType === 'ttt' 
    ? [...INITIAL_TTT_BOARD] 
    : gameType === 'c4' 
    ? [...INITIAL_C4_BOARD] 
    : [...INITIAL_BS_BOARD],
  currentMoveIndex: -1,
  isAutoPlaying: false,
  lastMoveIdx: null,
  error: null,
  agentAModel: 'gpt',
  agentAModelVariant: 'gpt-4o-mini',
  agentBModel: 'deepseek',
  agentBModelVariant: 'deepseek-chat',
});

export default function Home() {
  // Current view - which game we're looking at
  const [activeGameType, setActiveGameType] = useState<GameType>('ttt');

  // Game sessions - isolated state for each game type
  const [sessions, setSessions] = useState<Record<GameType, GameSession>>({
    ttt: createInitialSession('ttt'),
    c4: createInitialSession('c4'),
    bs: createInitialSession('bs'),
  });

  // Global stats
  const [globalStats, setGlobalStats] = useState<GlobalStatsType>({
    ttt: { matchesPlayed: 0, draws: 0, winsByModel: { gpt: 0, deepseek: 0, gemini: 0 } },
    c4: { matchesPlayed: 0, draws: 0, winsByModel: { gpt: 0, deepseek: 0, gemini: 0 } },
    bs: { matchesPlayed: 0, draws: 0, winsByModel: { gpt: 0, deepseek: 0, gemini: 0 } },
  });

  // Abort controllers for each game type
  const abortControllers = useRef<Record<GameType, AbortController | null>>({
    ttt: null,
    c4: null,
    bs: null,
  });

  // Get current session
  const session = sessions[activeGameType];

  // Helper to update a specific session
  const updateSession = useCallback((gameType: GameType, updates: Partial<GameSession>) => {
    setSessions(prev => ({
      ...prev,
      [gameType]: { ...prev[gameType], ...updates },
    }));
  }, []);

  // Player styles
  const agentAStyle = getPlayerStyles(session.agentAModel, false);
  const agentBStyle = getPlayerStyles(session.agentBModel, session.agentAModel === session.agentBModel);

  // Fetch stats on load
  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!session.isAutoPlaying || !session.matchResult) return;

    const timer = setInterval(() => {
      setSessions(prev => {
        const currentSession = prev[activeGameType];
        if (currentSession.currentMoveIndex >= (currentSession.matchResult?.moves.length ?? 0) - 1) {
          return {
            ...prev,
            [activeGameType]: { ...currentSession, isAutoPlaying: false },
          };
        }
        return {
          ...prev,
          [activeGameType]: { ...currentSession, currentMoveIndex: currentSession.currentMoveIndex + 1 },
        };
      });
    }, 500);

    return () => clearInterval(timer);
  }, [session.isAutoPlaying, session.matchResult, activeGameType]);

  // Update display board when move index changes (for replay)
  useEffect(() => {
    if (!session.matchResult || session.isRunning) return;

    if (session.currentMoveIndex < 0) {
      const initialBoard = activeGameType === 'ttt' 
        ? [...INITIAL_TTT_BOARD] 
        : activeGameType === 'c4' 
        ? [...INITIAL_C4_BOARD] 
        : [...INITIAL_BS_BOARD];
      updateSession(activeGameType, { displayBoard: initialBoard });
      return;
    }

    // Reconstruct board state up to current move
    let board: (TTTCell | C4Cell | BSCell)[];
    if (activeGameType === 'ttt') {
      board = [...INITIAL_TTT_BOARD];
    } else if (activeGameType === 'c4') {
      board = [...INITIAL_C4_BOARD];
    } else {
      board = [...INITIAL_BS_BOARD];
    }

    if (activeGameType === 'bs') {
      // For battleship, use the final board since reconstructing knowledge grid
      // from moves would require running the full game logic
      board = session.matchResult.finalBoard as BSCell[];
    } else {
      for (let i = 0; i <= session.currentMoveIndex && i < session.matchResult.moves.length; i++) {
        const moveRecord = session.matchResult.moves[i];
        if (activeGameType === 'ttt') {
          (board as TTTCell[])[moveRecord.move] = moveRecord.player === 'A' ? 'X' : 'O';
        } else if (activeGameType === 'c4') {
          const column: number = moveRecord.move;
          for (let row = 5; row >= 0; row--) {
            const idx = row * 7 + column;
            if (board[idx] === null) {
              (board as C4Cell[])[idx] = moveRecord.player === 'A' ? 'R' : 'Y';
              break;
            }
          }
        }
      }
    }

    updateSession(activeGameType, { displayBoard: board });
  }, [session.currentMoveIndex, session.matchResult, session.isRunning, activeGameType, updateSession]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.stats) {
        setGlobalStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const runMatch = async () => {
    const gameType = activeGameType;
    const currentSession = sessions[gameType];

    // Abort any existing match for this game type
    if (abortControllers.current[gameType]) {
      abortControllers.current[gameType]!.abort();
    }
    abortControllers.current[gameType] = new AbortController();

      const initialBoard = gameType === 'ttt' 
        ? [...INITIAL_TTT_BOARD] 
        : gameType === 'c4' 
        ? [...INITIAL_C4_BOARD] 
        : [...INITIAL_BS_BOARD];
      updateSession(gameType, {
        isRunning: true,
        error: null,
        matchResult: null,
        currentMoveIndex: -1,
        liveMoves: [],
        currentThinking: null,
        displayBoard: initialBoard,
        lastMoveIdx: null,
      });

    try {
      const res = await fetch('/api/play-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType,
          agentA: { model: currentSession.agentAModel, modelVariant: currentSession.agentAModelVariant },
          agentB: { model: currentSession.agentBModel, modelVariant: currentSession.agentBModelVariant },
        }),
        signal: abortControllers.current[gameType]!.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to run match');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            handleStreamEvent(gameType, eventType, data);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        updateSession(gameType, {
          error: err instanceof Error ? err.message : 'An error occurred',
        });
      }
    } finally {
      updateSession(gameType, {
        isRunning: false,
        currentThinking: null,
      });
      await fetchStats();
    }
  };

  const handleStreamEvent = (gameType: GameType, event: string, data: unknown) => {
    switch (event) {
      case 'thinking': {
        const d = data as { player: 'A' | 'B' };
        updateSession(gameType, { currentThinking: d.player });
        break;
      }
      case 'move': {
        const d = data as {
          player: 'A' | 'B';
          move: number;
          reason?: string;
          modelVariant: GPTModel | DeepSeekModel | GeminiModel;
          board: (TTTCell | C4Cell | BSCell)[];
          durationMs?: number;
          retries?: number;
          hadError?: boolean;
          placementsA?: ShipPlacement[];
          placementsB?: ShipPlacement[];
          moveOwnership?: (Player | null)[];
        };

        const newMove: LiveMove = {
          player: d.player,
          move: d.move,
          reason: d.reason,
          modelVariant: d.modelVariant,
          timestamp: Date.now(),
          durationMs: d.durationMs,
          retries: d.retries,
          hadError: d.hadError,
        };

        let lastMoveIdx = d.move;
        if (gameType === 'c4') {
          const col = d.move;
          for (let row = 5; row >= 0; row--) {
            const idx = row * 7 + col;
            if (d.board[idx] !== null) {
              let countAbove = 0;
              for (let r = row - 1; r >= 0; r--) {
                if (d.board[r * 7 + col] !== null) countAbove++;
              }
              if (countAbove === 0 || d.board[(row - 1) * 7 + col] === null) {
                lastMoveIdx = idx;
                break;
              }
            }
          }
        } else if (gameType === 'bs') {
          // For battleship, the move index is the cell index directly
          lastMoveIdx = d.move;
        }

        setSessions(prev => ({
          ...prev,
          [gameType]: {
            ...prev[gameType],
            currentThinking: null,
            liveMoves: [...prev[gameType].liveMoves, newMove],
            displayBoard: d.board,
            lastMoveIdx,
            // Battleship-specific
            placementsA: d.placementsA ?? prev[gameType].placementsA,
            placementsB: d.placementsB ?? prev[gameType].placementsB,
            moveOwnership: d.moveOwnership ?? prev[gameType].moveOwnership,
          },
        }));
        break;
      }
      case 'complete': {
        const result = data as MatchResult;
        updateSession(gameType, {
          matchResult: result,
          currentMoveIndex: result.moves.length - 1,
        });
        break;
      }
      case 'error': {
        const d = data as { message: string };
        updateSession(gameType, { error: d.message });
        break;
      }
      case 'forfeit': {
        const d = data as { player: 'A' | 'B'; reason: string };
        const playerLabel = PROVIDER_LABELS[
          d.player === 'A' ? sessions[gameType].agentAModel : sessions[gameType].agentBModel
        ];
        updateSession(gameType, { error: `${playerLabel} forfeited: ${d.reason}` });
        break;
      }
    }
  };

  const handleMoveSelect = (index: number) => {
    updateSession(activeGameType, {
      currentMoveIndex: index,
      isAutoPlaying: false,
    });
  };

  const handleAutoPlay = () => {
    if (session.isAutoPlaying) {
      updateSession(activeGameType, { isAutoPlaying: false });
    } else {
      if (session.currentMoveIndex >= (session.matchResult?.moves.length ?? 0) - 1) {
        updateSession(activeGameType, { currentMoveIndex: -1 });
      }
      updateSession(activeGameType, { isAutoPlaying: true });
    }
  };

  const handleReset = () => {
    updateSession(activeGameType, {
      currentMoveIndex: -1,
      isAutoPlaying: false,
    });
  };

  const handleAgentAModelChange = (model: ModelType) => {
    const defaultVariant = model === 'gpt' ? 'gpt-4o-mini' : model === 'deepseek' ? 'deepseek-chat' : 'gemini-2.0-flash';
    updateSession(activeGameType, {
      agentAModel: model,
      agentAModelVariant: defaultVariant,
    });
  };

  const handleAgentBModelChange = (model: ModelType) => {
    const defaultVariant = model === 'gpt' ? 'gpt-4o-mini' : model === 'deepseek' ? 'deepseek-chat' : 'gemini-2.0-flash';
    updateSession(activeGameType, {
      agentBModel: model,
      agentBModelVariant: defaultVariant,
    });
  };

  // Get current move info for replay
  const currentMove = session.matchResult && session.currentMoveIndex >= 0
    ? session.matchResult.moves[session.currentMoveIndex]
    : null;

  const lastMoveA = session.matchResult?.moves
    .slice(0, session.currentMoveIndex + 1)
    .filter(m => m.player === 'A')
    .pop() || null;

  const lastMoveB = session.matchResult?.moves
    .slice(0, session.currentMoveIndex + 1)
    .filter(m => m.player === 'B')
    .pop() || null;

  // Get last move board index for highlighting
  const getLastMoveIndex = (): number | null => {
    if (session.isRunning) return session.lastMoveIdx;
    if (!currentMove) return null;
    if (activeGameType === 'ttt') return currentMove.move;
    if (activeGameType === 'bs') return currentMove.move;

    const col = currentMove.move;
    const boardCopy = [...INITIAL_C4_BOARD];

    for (let i = 0; i < session.currentMoveIndex; i++) {
      const move = session.matchResult!.moves[i];
      for (let row = 5; row >= 0; row--) {
        const idx = row * 7 + move.move;
        if (boardCopy[idx] === null) {
          boardCopy[idx] = move.player === 'A' ? 'R' : 'Y';
          break;
        }
      }
    }

    for (let row = 5; row >= 0; row--) {
      const idx = row * 7 + col;
      if (boardCopy[idx] === null) {
        return idx;
      }
    }
    return null;
  };

  const winLine = !session.isRunning && session.currentMoveIndex === (session.matchResult?.moves.length ?? 0) - 1
    ? session.matchResult?.winLine
    : null;

  // Check if any game is running
  const anyGameRunning = sessions.ttt.isRunning || sessions.c4.isRunning || sessions.bs.isRunning;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 py-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Agent Arena
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                LLM Agent Comparison Platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={agentAStyle.text}>{PROVIDER_LABELS[session.agentAModel]}</span>
                <span className="text-muted-foreground">vs</span>
                <span className={agentBStyle.text}>{PROVIDER_LABELS[session.agentBModel]}</span>
              </div>
              {anyGameRunning && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-400">
                    {[sessions.ttt.isRunning && 'TTT', sessions.c4.isRunning && 'C4', sessions.bs.isRunning && 'BS'].filter(Boolean).join(', ') || 'Running'} running
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <GameControls
              gameType={activeGameType}
              agentAModel={session.agentAModel}
              agentAModelVariant={session.agentAModelVariant}
              agentBModel={session.agentBModel}
              agentBModelVariant={session.agentBModelVariant}
              onGameTypeChange={setActiveGameType}
              onAgentAModelChange={handleAgentAModelChange}
              onAgentAModelVariantChange={(v) => updateSession(activeGameType, { agentAModelVariant: v })}
              onAgentBModelChange={handleAgentBModelChange}
              onAgentBModelVariantChange={(v) => updateSession(activeGameType, { agentBModelVariant: v })}
              onRunMatch={runMatch}
              onCancelMatch={() => {
                if (abortControllers.current[activeGameType]) {
                  abortControllers.current[activeGameType]!.abort();
                  abortControllers.current[activeGameType] = null;
                }
                updateSession(activeGameType, {
                  isRunning: false,
                  currentThinking: null,
                });
              }}
              isRunning={session.isRunning}
            />
          </div>

          {/* Center - Game Board */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">
                  {activeGameType === 'ttt' ? 'Tic-Tac-Toe' : activeGameType === 'c4' ? 'Connect Four' : 'Battleship'}
                </h2>
                {session.isRunning && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Live</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                {activeGameType === 'ttt' ? (
                  <TicTacToeBoard
                    board={session.displayBoard as TTTCell[]}
                    winLine={winLine ?? null}
                    lastMove={getLastMoveIndex()}
                    currentPlayer={session.currentThinking}
                    isThinking={session.isRunning && session.currentThinking !== null}
                    agentAModel={session.agentAModel}
                    agentBModel={session.agentBModel}
                  />
                ) : activeGameType === 'c4' ? (
                  <Connect4Board
                    board={session.displayBoard as C4Cell[]}
                    winLine={winLine ?? null}
                    lastMove={getLastMoveIndex()}
                    currentPlayer={session.currentThinking}
                    isThinking={session.isRunning && session.currentThinking !== null}
                    agentAModel={session.agentAModel}
                    agentBModel={session.agentBModel}
                  />
                ) : (
                  <BattleshipBoard
                    board={session.displayBoard as BSCell[]}
                    lastMove={getLastMoveIndex()}
                    currentPlayer={session.currentThinking}
                    isThinking={session.isRunning && session.currentThinking !== null}
                    agentAModel={session.agentAModel}
                    agentBModel={session.agentBModel}
                    placementsA={session.matchResult?.placementsA ?? session.placementsA}
                    placementsB={session.matchResult?.placementsB ?? session.placementsB}
                    moveOwnership={session.matchResult?.moveOwnership ?? session.moveOwnership}
                  />
                )}
              </div>

              {/* Error Display */}
              {session.error && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-red-400">
                  {session.error}
                </div>
              )}
            </div>

            {/* Live Output */}
            <div className="mt-4">
              <LiveOutput
                moves={session.liveMoves}
                agentA={{ model: session.agentAModel, modelVariant: session.agentAModelVariant }}
                agentB={{ model: session.agentBModel, modelVariant: session.agentBModelVariant }}
                isRunning={session.isRunning}
                currentThinking={session.currentThinking}
                gameType={activeGameType}
              />
            </div>

            {/* Replay Controls */}
            {session.matchResult && !session.isRunning && (
              <div className="mt-4">
                <ReplayControls
                  moves={session.matchResult.moves}
                  currentMoveIndex={session.currentMoveIndex}
                  onMoveSelect={handleMoveSelect}
                  onAutoPlay={handleAutoPlay}
                  onReset={handleReset}
                  isAutoPlaying={session.isAutoPlaying}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar - Agent Info & Stats */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Agent Panels */}
            <div className="grid grid-cols-2 gap-4">
              <AgentPanel
                label="A"
                config={{ model: session.agentAModel, modelVariant: session.agentAModelVariant }}
                lastMove={session.isRunning ? (session.liveMoves.filter(m => m.player === 'A').pop() as any) : lastMoveA}
                isActive={session.isRunning && session.currentThinking === 'A'}
                metrics={session.matchResult?.metrics.agentA}
                isP2={false}
                isWinner={!session.isRunning && session.matchResult?.winner === 'A'}
              />
              <AgentPanel
                label="B"
                config={{ model: session.agentBModel, modelVariant: session.agentBModelVariant }}
                lastMove={session.isRunning ? (session.liveMoves.filter(m => m.player === 'B').pop() as any) : lastMoveB}
                isActive={session.isRunning && session.currentThinking === 'B'}
                metrics={session.matchResult?.metrics.agentB}
                isP2={session.agentAModel === session.agentBModel}
                isWinner={!session.isRunning && session.matchResult?.winner === 'B'}
              />
            </div>

            {/* Match Result */}
            {session.matchResult && !session.isRunning && (
              <MatchResultCard result={session.matchResult} />
            )}

            {/* Global Stats */}
            <GlobalStats stats={globalStats} />
          </div>
        </div>

        {/* Footer */}
        <footer className="hidden mt-12 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>uOttaHack 8 - Agentic Compare Challenge</p>
            <p>Compare LLM agents across different games</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
