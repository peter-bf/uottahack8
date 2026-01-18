'use client';

import { C4Cell } from '@/types';
import { useEffect, useState } from 'react';

interface Connect4BoardProps {
  board: C4Cell[];
  winLine: number[] | null;
  lastMove: number | null; // This is the board index, not column
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
}

const ROWS = 6;
const COLS = 7;

function getIndex(row: number, col: number): number {
  return row * COLS + col;
}

export function Connect4Board({ board, winLine, lastMove, currentPlayer, isThinking }: Connect4BoardProps) {
  const [animatingCell, setAnimatingCell] = useState<number | null>(null);

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
          <div key={col} className="w-12 text-center text-slate-400 text-sm">
            {col}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-blue-600 p-2 rounded-lg">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: ROWS }).map((_, row) =>
            Array.from({ length: COLS }).map((_, col) => {
              const index = getIndex(row, col);
              const cell = board[index];
              const isWinCell = winLine?.includes(index);
              const isAnimating = animatingCell === index;

              return (
                <div
                  key={index}
                  className={`
                    w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${isWinCell ? 'ring-4 ring-yellow-400 animate-glow' : ''}
                  `}
                >
                  {cell && (
                    <div
                      className={`
                        w-10 h-10 rounded-full
                        ${cell === 'R' ? 'bg-red-500' : 'bg-yellow-400'}
                        ${isAnimating ? 'animate-drop' : ''}
                        ${isWinCell ? 'shadow-lg' : ''}
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
        <div className="mt-4 flex items-center gap-2 text-slate-400">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}
