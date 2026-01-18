'use client';

import { MoveRecord } from '@/types';

interface ReplayControlsProps {
  moves: MoveRecord[];
  currentMoveIndex: number;
  onMoveSelect: (index: number) => void;
  onAutoPlay: () => void;
  onReset: () => void;
  isAutoPlaying: boolean;
}

export function ReplayControls({
  moves,
  currentMoveIndex,
  onMoveSelect,
  onAutoPlay,
  onReset,
  isAutoPlaying,
}: ReplayControlsProps) {
  if (moves.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Replay</h3>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onAutoPlay}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isAutoPlaying
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isAutoPlaying ? 'Stop' : 'Auto-Play'}
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400 mb-2">
        Move {currentMoveIndex + 1} of {moves.length}
      </div>

      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
        {moves.map((move, index) => (
          <button
            key={index}
            onClick={() => onMoveSelect(index)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              index === currentMoveIndex
                ? 'bg-blue-600 text-white'
                : index < currentMoveIndex
                ? 'bg-slate-600 text-slate-300'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {index + 1}. {move.player} -&gt; {move.move}
          </button>
        ))}
      </div>
    </div>
  );
}
