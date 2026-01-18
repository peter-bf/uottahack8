'use client';

import { TTTCell, ModelType } from '@/types';
import { getPlayerStyles } from '@/lib/ui/providerStyles';

interface TicTacToeBoardProps {
  board: TTTCell[];
  winLine: number[] | null;
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
  agentAModel: ModelType;
  agentBModel: ModelType;
}

export function TicTacToeBoard({
  board,
  winLine,
  lastMove,
  currentPlayer,
  isThinking,
  agentAModel,
  agentBModel,
}: TicTacToeBoardProps) {
  const agentAStyle = getPlayerStyles(agentAModel, false);
  const agentBStyle = getPlayerStyles(agentBModel, agentAModel === agentBModel);

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2 bg-secondary p-3 rounded-lg">
        {board.map((cell, index) => {
          const isWinCell = winLine?.includes(index);
          const isLastMove = lastMove === index;

          return (
            <div
              key={index}
              className={`
                w-20 h-20 bg-card rounded-lg flex items-center justify-center
                text-4xl font-bold transition-all duration-200
                ${isWinCell ? 'ring-2 ring-amber-400 bg-amber-400/10' : ''}
                ${isLastMove && !isWinCell ? 'ring-2 ring-white/30' : ''}
              `}
            >
              {cell && (
                <span
                  className={`
                    animate-scale-in
                    ${cell === 'X' ? agentAStyle.text : agentBStyle.text}
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
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Thinking...</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="w-20 text-center font-mono">{i}</div>
        ))}
      </div>
    </div>
  );
}
