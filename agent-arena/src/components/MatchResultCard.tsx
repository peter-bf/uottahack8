'use client';

import { MatchResult } from '@/types';

interface MatchResultCardProps {
  result: MatchResult;
}

export function MatchResultCard({ result }: MatchResultCardProps) {
  const winnerModel = result.winner === 'draw'
    ? null
    : (result.winner === 'A' ? result.agentA.model : result.agentB.model);
  const winnerText = result.winner === 'draw'
    ? 'Draw!'
    : `${winnerModel === 'gpt' ? 'OpenAI' : 'DeepSeek'} Wins!`;
  const winnerColor = result.winner === 'draw'
    ? 'text-yellow-400'
    : (winnerModel === 'deepseek' ? 'text-blue-400' : 'text-red-400');
  const agentALabel = result.agentA.model === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const agentBLabel = result.agentB.model === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const agentAColor = result.agentA.model === 'deepseek' ? 'text-blue-400' : 'text-red-400';
  const agentBColor = result.agentB.model === 'deepseek' ? 'text-blue-400' : 'text-red-400';

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="text-center mb-6">
        <h3 className={`text-2xl font-bold ${winnerColor}`}>
          {winnerText}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Total Moves</div>
          <div className="text-xl font-bold">{result.metrics.totalMoves}</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Duration</div>
          <div className="text-xl font-bold">{(result.metrics.durationMs / 1000).toFixed(1)}s</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">{agentALabel} Errors</div>
          <div className={`text-xl font-bold ${agentAColor}`}>
            {result.metrics.agentA.invalidJsonCount + result.metrics.agentA.illegalMoveCount}
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">{agentBLabel} Errors</div>
          <div className={`text-xl font-bold ${agentBColor}`}>
            {result.metrics.agentB.invalidJsonCount + result.metrics.agentB.illegalMoveCount}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 text-center">
        Match ID: {result.id.slice(0, 8)}... | {new Date(result.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
