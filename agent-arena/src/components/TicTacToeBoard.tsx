'use client';

import { TTTCell } from '@/types';

interface TicTacToeBoardProps {
  board: TTTCell[];
  winLine: number[] | null;
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
}

export function TicTacToeBoard({ board, winLine, lastMove, currentPlayer, isThinking }: TicTacToeBoardProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2 bg-slate-700 p-3 rounded-lg">
        {board.map((cell, index) => {
          const isWinCell = winLine?.includes(index);
          const isLastMove = lastMove === index;

          return (
            <div
              key={index}
              className={`
                w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center
                text-4xl font-bold transition-all duration-300
                ${isWinCell ? 'animate-glow ring-2 ring-yellow-400' : ''}
                ${isLastMove ? 'ring-2 ring-blue-400' : ''}
              `}
            >
              {cell && (
                <span
                  className={`
                    animate-scale-in
                    ${cell === 'X' ? 'text-blue-400' : 'text-red-400'}
                  `}
                >
                  {cell}
                </span>
              )}
            </div>
          );
        })}
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

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="w-20 text-center">{i}</div>
        ))}
      </div>
    </div>
  );
}
