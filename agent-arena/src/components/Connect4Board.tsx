'use client';

import { C4Cell, ModelType } from '@/types';
import { useEffect, useState } from 'react';
import { getPlayerStyles } from '@/lib/ui/providerStyles';

interface Connect4BoardProps {
  board: C4Cell[];
  winLine: number[] | null;
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
  agentAModel: ModelType;
  agentBModel: ModelType;
}

const ROWS = 6;
const COLS = 7;

export function Connect4Board({
  board,
  winLine,
  lastMove,
  currentPlayer,
  isThinking,
  agentAModel,
  agentBModel,
}: Connect4BoardProps) {
  const [animatingCell, setAnimatingCell] = useState<number | null>(null);

  const agentAStyle = getPlayerStyles(agentAModel, false);
  const agentBStyle = getPlayerStyles(agentBModel, agentAModel === agentBModel);

  useEffect(() => {
    if (lastMove !== null) {
      setAnimatingCell(lastMove);
      const timer = setTimeout(() => setAnimatingCell(null), 500);
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  return (
    <div className="flex flex-col items-center">
      {/* Column indicators */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: COLS }).map((_, col) => (
          <div key={col} className="w-10 text-center text-muted-foreground text-sm font-mono">
            {col}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-secondary p-2 rounded-lg">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: ROWS }).map((_, row) =>
            Array.from({ length: COLS }).map((_, col) => {
              const index = row * COLS + col;
              const cell = board[index];
              const isWinCell = winLine?.includes(index);
              const isAnimating = animatingCell === index;

              return (
                <div
                  key={index}
                  className={`
                    w-10 h-10 bg-card rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${isWinCell ? 'ring-2 ring-amber-400' : ''}
                  `}
                >
                  {cell && (
                    <div
                      className={`
                        w-8 h-8 rounded-full
                        ${cell === 'R' ? agentAStyle.chip : agentBStyle.chip}
                        ${isAnimating ? 'animate-drop' : ''}
                        ${isWinCell ? 'shadow-lg shadow-amber-400/50' : ''}
                      `}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isThinking && currentPlayer && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Thinking...</span>
        </div>
      )}
    </div>
  );
}
