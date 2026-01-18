'use client';

import { BSCell, ModelType, ShipPlacement, Player } from '@/types';
import { useEffect, useState } from 'react';
import { getPlayerStyles } from '@/lib/ui/providerStyles';

interface BattleshipBoardProps {
  board: BSCell[];
  lastMove: number | null;
  currentPlayer: 'A' | 'B' | null;
  isThinking: boolean;
  agentAModel: ModelType;
  agentBModel: ModelType;
  placementsA?: ShipPlacement[];
  placementsB?: ShipPlacement[];
  moveOwnership?: (Player | null)[];
}

const BOARD_SIZE = 10;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function getRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

export function BattleshipBoard({
  board,
  lastMove,
  currentPlayer,
  isThinking,
  agentAModel,
  agentBModel,
  placementsA = [],
  placementsB = [],
  moveOwnership = [],
}: BattleshipBoardProps) {
  const [animatingCell, setAnimatingCell] = useState<number | null>(null);

  useEffect(() => {
    if (lastMove !== null) {
      setAnimatingCell(lastMove);
      const timer = setTimeout(() => setAnimatingCell(null), 500);
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  const agentAStyle = getPlayerStyles(agentAModel, false);
  const agentBStyle = getPlayerStyles(agentBModel, agentAModel === agentBModel);

  // Check if a cell is part of a ship
  const getShipAtCell = (index: number): { player: Player; ship: ShipPlacement } | null => {
    for (const ship of placementsA) {
      if (ship.cells.includes(index)) {
        return { player: 'A', ship };
      }
    }
    for (const ship of placementsB) {
      if (ship.cells.includes(index)) {
        return { player: 'B', ship };
      }
    }
    return null;
  };

  const getCellDisplay = (cell: BSCell, index: number) => {
    const shipInfo = getShipAtCell(index);
    const moveOwner = moveOwnership[index];
    
    // Determine colors based on move owner
    let moveColorClass = '';
    if (moveOwner === 'A') {
      moveColorClass = agentAStyle.text;
    } else if (moveOwner === 'B') {
      moveColorClass = agentBStyle.text;
    }

    // Determine ship background color
    let shipBgClass = '';
    if (shipInfo) {
      shipBgClass = shipInfo.player === 'A' 
        ? agentAStyle.bg.replace('/15', '/20')
        : agentBStyle.bg.replace('/15', '/20');
    }

    switch (cell) {
      case 'miss':
        return { 
          symbol: '○', 
          className: moveColorClass || 'text-blue-400',
          bgClass: shipBgClass,
        };
      case 'hit':
        return { 
          symbol: '✕', 
          className: moveColorClass || 'text-red-500',
          bgClass: shipBgClass,
        };
      case 'sunk':
        return { 
          symbol: '■', 
          className: moveColorClass || 'text-red-700',
          bgClass: shipBgClass,
        };
      default:
        return { 
          symbol: shipInfo ? '▢' : '·', 
          className: shipInfo 
            ? (shipInfo.player === 'A' ? agentAStyle.text : agentBStyle.text)
            : 'text-muted-foreground/30',
          bgClass: shipBgClass,
        };
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Column headers */}
      <div className="flex gap-1 mb-1">
        <div className="w-6" /> {/* Spacer for row labels */}
        {Array.from({ length: BOARD_SIZE }).map((_, col) => (
          <div key={col} className="w-8 text-center text-xs text-muted-foreground font-mono">
            {col + 1}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-secondary p-2 rounded-lg">
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <div key={row} className="flex gap-1 mb-1">
            {/* Row label */}
            <div className="w-6 text-xs text-muted-foreground font-mono flex items-center justify-center">
              {ROW_LABELS[row]}
            </div>
            {/* Cells */}
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              const index = row * BOARD_SIZE + col;
              const cell = board[index];
              const { symbol, className, bgClass } = getCellDisplay(cell, index);
              const isLastMove = lastMove === index;
              const isAnimating = animatingCell === index;

              return (
                <div
                  key={index}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center
                    text-lg font-bold transition-all duration-200
                    ${bgClass || 'bg-card'}
                    ${isLastMove ? 'ring-2 ring-white/50' : ''}
                    ${isAnimating ? 'animate-pulse' : ''}
                  `}
                >
                  <span className={className}>{symbol}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground/30">·</span>
          <span>Unknown</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400">○</span>
          <span>Miss</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500">✕</span>
          <span>Hit</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-700">■</span>
          <span>Sunk</span>
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

