'use client';

import { useState, useEffect } from 'react';
import {
  GameType,
  ModelType,
  MatchResult,
  GlobalStats as GlobalStatsType,
  TTTCell,
  C4Cell,
  GPTModel,
  DeepSeekModel,
} from '@/types';
import { TicTacToeBoard } from '@/components/TicTacToeBoard';
import { Connect4Board } from '@/components/Connect4Board';
import { AgentPanel } from '@/components/AgentPanel';
import { MatchResultCard } from '@/components/MatchResultCard';
import { GlobalStats } from '@/components/GlobalStats';
import { GameControls } from '@/components/GameControls';
import { ReplayControls } from '@/components/ReplayControls';
import { LiveOutput, LiveMove } from '@/components/LiveOutput';

const INITIAL_TTT_BOARD: TTTCell[] = Array(9).fill(null);
const INITIAL_C4_BOARD: C4Cell[] = Array(42).fill(null);

export default function Home() {
  const [gameType, setGameType] = useState<GameType>('ttt');
  const [agentAModel, setAgentAModel] = useState<ModelType>('gpt');
  const [agentAModelVariant, setAgentAModelVariant] = useState<GPTModel | DeepSeekModel>('gpt-4o-mini');
  const [agentBModel, setAgentBModel] = useState<ModelType>('deepseek');
  const [agentBModelVariant, setAgentBModelVariant] = useState<GPTModel | DeepSeekModel>('deepseek-chat');
  const agentALabel = agentAModel === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const agentBLabel = agentBModel === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const getLabelForPlayer = (player: 'A' | 'B') => (player === 'A' ? agentALabel : agentBLabel);

  // Match state
  const [isRunning, setIsRunning] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live output state
  const [liveMoves, setLiveMoves] = useState<LiveMove[]>([]);
  const [currentThinking, setCurrentThinking] = useState<'A' | 'B' | null>(null);

  // Replay state
  const [displayBoard, setDisplayBoard] = useState<(TTTCell | C4Cell)[]>(
    gameType === 'ttt' ? INITIAL_TTT_BOARD : INITIAL_C4_BOARD
  );
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [lastMoveIdx, setLastMoveIdx] = useState<number | null>(null);

  // Global stats
  const [globalStats, setGlobalStats] = useState<GlobalStatsType>({
    ttt: { matchesPlayed: 0, draws: 0, winsByModel: { gpt: 0, deepseek: 0 } },
    c4: { matchesPlayed: 0, draws: 0, winsByModel: { gpt: 0, deepseek: 0 } },
  });

  // Fetch stats on load
  useEffect(() => {
    fetchStats();
  }, []);

  // Reset board when game type changes
  useEffect(() => {
    setDisplayBoard(gameType === 'ttt' ? INITIAL_TTT_BOARD : INITIAL_C4_BOARD);
    setMatchResult(null);
    setCurrentMoveIndex(-1);
    setLiveMoves([]);
  }, [gameType]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || !matchResult) return;

    const timer = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        if (prev >= matchResult.moves.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [isAutoPlaying, matchResult]);

  // Update display board when move index changes (for replay)
  useEffect(() => {
    if (!matchResult || isRunning) return;

    if (currentMoveIndex < 0) {
      setDisplayBoard(gameType === 'ttt' ? INITIAL_TTT_BOARD : INITIAL_C4_BOARD);
      return;
    }

    // Reconstruct board state up to current move
    const board = gameType === 'ttt'
      ? [...INITIAL_TTT_BOARD]
      : [...INITIAL_C4_BOARD];

    for (let i = 0; i <= currentMoveIndex && i < matchResult.moves.length; i++) {
      const move = matchResult.moves[i];
      if (gameType === 'ttt') {
        (board as TTTCell[])[move.move] = move.player === 'A' ? 'X' : 'O';
      } else {
        const col = move.move;
        for (let row = 5; row >= 0; row--) {
          const idx = row * 7 + col;
          if (board[idx] === null) {
            (board as C4Cell[])[idx] = move.player === 'A' ? 'R' : 'Y';
            break;
          }
        }
      }
    }

    setDisplayBoard(board);
  }, [currentMoveIndex, matchResult, gameType, isRunning]);

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
    setIsRunning(true);
    setError(null);
    setMatchResult(null);
    setCurrentMoveIndex(-1);
    setLiveMoves([]);
    setCurrentThinking(null);
    setDisplayBoard(gameType === 'ttt' ? INITIAL_TTT_BOARD : INITIAL_C4_BOARD);
    setLastMoveIdx(null);

    try {
      const res = await fetch('/api/play-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType,
          agentA: { model: agentAModel, modelVariant: agentAModelVariant },
          agentB: { model: agentBModel, modelVariant: agentBModelVariant },
        }),
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
            handleStreamEvent(eventType, data);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
      setCurrentThinking(null);
      await fetchStats();
    }
  };

  const handleStreamEvent = (event: string, data: unknown) => {
    switch (event) {
      case 'thinking': {
        const d = data as { player: 'A' | 'B'; modelVariant: GPTModel | DeepSeekModel };
        setCurrentThinking(d.player);
        break;
      }
      case 'move': {
        const d = data as {
          player: 'A' | 'B';
          move: number;
          reason?: string;
          modelVariant: GPTModel | DeepSeekModel;
          board: (TTTCell | C4Cell)[];
          winLine: number[] | null;
        };
        setCurrentThinking(null);
        setLiveMoves(prev => [...prev, {
          player: d.player,
          move: d.move,
          reason: d.reason,
          modelVariant: d.modelVariant,
          timestamp: Date.now(),
        }]);
        setDisplayBoard(d.board);
        // Calculate last move index for highlighting
        if (gameType === 'ttt') {
          setLastMoveIdx(d.move);
        } else {
          // For C4, find where piece landed
          const col = d.move;
          for (let row = 5; row >= 0; row--) {
            const idx = row * 7 + col;
            if (d.board[idx] !== null) {
              // Check if this is the most recently placed piece
              let countAbove = 0;
              for (let r = row - 1; r >= 0; r--) {
                if (d.board[r * 7 + col] !== null) countAbove++;
              }
              if (countAbove === 0 || d.board[(row - 1) * 7 + col] === null) {
                setLastMoveIdx(idx);
                break;
              }
            }
          }
        }
        break;
      }
      case 'complete': {
        const result = data as MatchResult;
        setMatchResult(result);
        setCurrentMoveIndex(result.moves.length - 1);
        break;
      }
      case 'error': {
        const d = data as { message: string };
        setError(d.message);
        break;
      }
      case 'forfeit': {
        const d = data as { player: 'A' | 'B'; reason: string };
        setError(`${getLabelForPlayer(d.player)} forfeited: ${d.reason}`);
        break;
      }
    }
  };

  const handleMoveSelect = (index: number) => {
    setCurrentMoveIndex(index);
    setIsAutoPlaying(false);
  };

  const handleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
    } else {
      if (currentMoveIndex >= (matchResult?.moves.length ?? 0) - 1) {
        setCurrentMoveIndex(-1);
      }
      setIsAutoPlaying(true);
    }
  };

  const handleReset = () => {
    setCurrentMoveIndex(-1);
    setIsAutoPlaying(false);
  };

  // Get current move info for replay
  const currentMove = matchResult && currentMoveIndex >= 0
    ? matchResult.moves[currentMoveIndex]
    : null;

  const lastMoveA = matchResult?.moves
    .slice(0, currentMoveIndex + 1)
    .filter(m => m.player === 'A')
    .pop() || null;

  const lastMoveB = matchResult?.moves
    .slice(0, currentMoveIndex + 1)
    .filter(m => m.player === 'B')
    .pop() || null;

  // Get last move board index for highlighting
  const getLastMoveIndex = (): number | null => {
    if (isRunning) return lastMoveIdx;
    if (!currentMove) return null;
    if (gameType === 'ttt') return currentMove.move;

    // For Connect-4, find the board index
    const col = currentMove.move;
    const boardCopy = [...INITIAL_C4_BOARD];

    for (let i = 0; i < currentMoveIndex; i++) {
      const move = matchResult!.moves[i];
      for (let row = 5; row >= 0; row--) {
        const idx = row * 7 + move.move;
        if (boardCopy[idx] === null) {
          boardCopy[idx] = move.player === 'A' ? 'R' : 'Y';
          break;
        }
      }
    }

    // Find where current move landed
    for (let row = 5; row >= 0; row--) {
      const idx = row * 7 + col;
      if (boardCopy[idx] === null) {
        return idx;
      }
    }
    return null;
  };

  const winLine = !isRunning && currentMoveIndex === (matchResult?.moves.length ?? 0) - 1
    ? matchResult?.winLine
    : null;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Agent Arena
          </h1>
          <p className="text-slate-400 mt-2">Agentic Compare - uOttaHack 7</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold">
            <span className={agentAModel === 'deepseek' ? 'text-blue-400' : 'text-red-400'}>
              {agentALabel}
            </span>
            <span className="text-slate-500">vs</span>
            <span className={agentBModel === 'deepseek' ? 'text-blue-400' : 'text-red-400'}>
              {agentBLabel}
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Controls & Stats */}
          <div className="space-y-6">
            <GameControls
              gameType={gameType}
              agentAModel={agentAModel}
              agentAModelVariant={agentAModelVariant}
              agentBModel={agentBModel}
              agentBModelVariant={agentBModelVariant}
              onGameTypeChange={setGameType}
              onAgentAModelChange={setAgentAModel}
              onAgentAModelVariantChange={setAgentAModelVariant}
              onAgentBModelChange={setAgentBModel}
              onAgentBModelVariantChange={setAgentBModelVariant}
              onRunMatch={runMatch}
              isRunning={isRunning}
            />

            <GlobalStats stats={globalStats} />
          </div>

          {/* Center Column: Game Board */}
          <div className="lg:col-span-1 flex flex-col items-center justify-start">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-center mb-4">
                {gameType === 'ttt' ? 'Tic-Tac-Toe' : 'Connect-4'}
              </h2>

              {gameType === 'ttt' ? (
                <TicTacToeBoard
                  board={displayBoard as TTTCell[]}
                  winLine={winLine ?? null}
                  lastMove={getLastMoveIndex()}
                  currentPlayer={currentThinking}
                  isThinking={isRunning && currentThinking !== null}
                />
              ) : (
                <Connect4Board
                  board={displayBoard as C4Cell[]}
                  winLine={winLine ?? null}
                  lastMove={getLastMoveIndex()}
                  currentPlayer={currentThinking}
                  isThinking={isRunning && currentThinking !== null}
                />
              )}
            </div>

            {/* Live Output - show during and after match */}
            <div className="w-full mt-4">
              <LiveOutput
                moves={liveMoves}
                agentA={{ model: agentAModel, modelVariant: agentAModelVariant }}
                agentB={{ model: agentBModel, modelVariant: agentBModelVariant }}

                isRunning={isRunning}
                currentThinking={currentThinking}
                gameType={gameType}
              />
            </div>

            {/* Replay Controls */}
            {matchResult && !isRunning && (
              <div className="w-full mt-4">
                <ReplayControls
                  moves={matchResult.moves}
                  currentMoveIndex={currentMoveIndex}
                  onMoveSelect={handleMoveSelect}
                  onAutoPlay={handleAutoPlay}
                  onReset={handleReset}
                  isAutoPlaying={isAutoPlaying}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="w-full mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Agent Panels & Results */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <AgentPanel
                label="A"
                config={{ model: agentAModel, modelVariant: agentAModelVariant }}
                lastMove={isRunning ? (liveMoves.filter(m => m.player === 'A').pop() as any) : lastMoveA}
                isActive={isRunning && currentThinking === 'A'}
                metrics={matchResult?.metrics.agentA}
              />
              <AgentPanel
                label="B"
                config={{ model: agentBModel, modelVariant: agentBModelVariant }}
                lastMove={isRunning ? (liveMoves.filter(m => m.player === 'B').pop() as any) : lastMoveB}
                isActive={isRunning && currentThinking === 'B'}
                metrics={matchResult?.metrics.agentB}
              />
            </div>

            {/* Match Result */}
            {matchResult && !isRunning && <MatchResultCard result={matchResult} />}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Built for uOttaHack 7 - IT: Agentic Compare Challenge</p>
          <p className="mt-1">Compare LLM agents across different games and strategies</p>
        </footer>
      </div>
    </main>
  );
}
