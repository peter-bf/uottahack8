'use client';

import { MatchResult } from '@/types';
import { PROVIDER_LABELS, getPlayerStyles } from '@/lib/ui/providerStyles';
import { Clock, Hash, AlertCircle, RotateCcw, Timer } from 'lucide-react';

interface MatchResultCardProps {
  result: MatchResult;
}

export function MatchResultCard({ result }: MatchResultCardProps) {
  const winnerModel = result.winner === 'draw'
    ? null
    : (result.winner === 'A' ? result.agentA.model : result.agentB.model);
  const winnerText = result.winner === 'draw'
    ? 'Draw'
    : `${PROVIDER_LABELS[winnerModel!]} wins`;

  const agentAStyle = getPlayerStyles(result.agentA.model, false);
  const agentBStyle = getPlayerStyles(result.agentB.model, result.agentA.model === result.agentB.model);

  const totalErrors = result.metrics.agentA.invalidJsonCount + result.metrics.agentA.illegalMoveCount +
                      result.metrics.agentB.invalidJsonCount + result.metrics.agentB.illegalMoveCount;
  const totalRetries = result.metrics.agentA.retryCount + result.metrics.agentB.retryCount;
  const avgTimePerMove = result.metrics.totalMoves > 0
    ? result.metrics.durationMs / result.metrics.totalMoves
    : 0;

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <div className="text-center">
          <span className={`text-sm font-semibold ${
            result.winner === 'draw'
              ? 'text-muted-foreground'
              : result.winner === 'A' ? agentAStyle.text : agentBStyle.text
          }`}>
            {winnerText}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Hash className="w-3 h-3" />
            </div>
            <div className="font-mono font-semibold">{result.metrics.totalMoves}</div>
            <div className="text-muted-foreground text-[10px]">moves</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
            </div>
            <div className="font-mono font-semibold">{(result.metrics.durationMs / 1000).toFixed(1)}s</div>
            <div className="text-muted-foreground text-[10px]">total</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Timer className="w-3 h-3" />
            </div>
            <div className="font-mono font-semibold">{(avgTimePerMove / 1000).toFixed(1)}s</div>
            <div className="text-muted-foreground text-[10px]">avg</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <RotateCcw className="w-3 h-3" />
            </div>
            <div className={`font-mono font-semibold ${totalRetries > 0 ? 'text-amber-400' : ''}`}>
              {totalRetries}
            </div>
            <div className="text-muted-foreground text-[10px]">retries</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <AlertCircle className="w-3 h-3" />
            </div>
            <div className={`font-mono font-semibold ${totalErrors > 0 ? 'text-red-400' : ''}`}>
              {totalErrors}
            </div>
            <div className="text-muted-foreground text-[10px]">errors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
