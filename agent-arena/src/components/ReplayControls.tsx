'use client';

import { MoveRecord } from '@/types';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const canGoBack = currentMoveIndex > -1;
  const canGoForward = currentMoveIndex < moves.length - 1;

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-sm font-medium">Replay</span>
        <span className="text-xs text-muted-foreground font-mono">
          {currentMoveIndex + 1} / {moves.length}
        </span>
      </div>

      <div className="p-4">
        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={onReset}
            className="p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => canGoBack && onMoveSelect(currentMoveIndex - 1)}
            disabled={!canGoBack}
            className="p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onAutoPlay}
            className={`p-2 rounded-md transition-colors ${
              isAutoPlaying
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-foreground text-background hover:bg-foreground/90'
            }`}
            title={isAutoPlaying ? 'Pause' : 'Play'}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => canGoForward && onMoveSelect(currentMoveIndex + 1)}
            disabled={!canGoForward}
            className="p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto">
          {moves.map((move, index) => (
            <button
              key={index}
              onClick={() => onMoveSelect(index)}
              className={`w-6 h-6 rounded text-xs font-mono transition-colors ${
                index === currentMoveIndex
                  ? 'bg-foreground text-background'
                  : index < currentMoveIndex
                  ? 'bg-secondary text-muted-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
