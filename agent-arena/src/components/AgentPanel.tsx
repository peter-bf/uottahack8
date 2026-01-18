'use client';

import { AgentConfig, MoveRecord, GPTModel, DeepSeekModel } from '@/types';

// Human-readable model names
const MODEL_LABELS: Record<GPTModel | DeepSeekModel, string> = {
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4o': 'GPT-4o',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
};

interface AgentPanelProps {
  label: 'A' | 'B';
  config: AgentConfig;
  lastMove: MoveRecord | null;
  isActive: boolean;
  metrics?: {
    invalidJsonCount: number;
    illegalMoveCount: number;
    retryCount: number;
  };
}

export function AgentPanel({ label, config, lastMove, isActive, metrics }: AgentPanelProps) {
  const providerDisplay = config.model === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const modelDisplay = MODEL_LABELS[config.modelVariant] || config.modelVariant;
  const isDeepSeek = config.model === 'deepseek';
  const colorClass = isDeepSeek ? 'border-blue-500' : 'border-red-500';
  const bgClass = isActive ? (isDeepSeek ? 'bg-blue-500/10' : 'bg-red-500/10') : 'bg-slate-800';
  const badgeClass = isDeepSeek ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300';

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClass} ${bgClass} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">
          {providerDisplay}
          {isActive && (
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
          {label === 'A' ? 'X / Red' : 'O / Yellow'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Model:</span>
          <span className="font-medium">{modelDisplay}</span>
        </div>
      </div>

      {lastMove && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="text-xs text-slate-400 mb-1">Last Move</div>
          <div className="font-mono text-lg text-white">Position: {lastMove.move}</div>
          {lastMove.reason && (
            <p className="text-sm text-slate-300 mt-2 italic">"{lastMove.reason}"</p>
          )}
          {lastMove.plan && lastMove.plan.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-slate-400 mb-1">Plan:</div>
              <ul className="text-xs text-slate-300 list-disc list-inside">
                {lastMove.plan.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {metrics && (
        <div className="mt-4 pt-4 border-t border-slate-600 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-slate-400">Invalid JSON</div>
            <div className={`font-bold ${metrics.invalidJsonCount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {metrics.invalidJsonCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Illegal Moves</div>
            <div className={`font-bold ${metrics.illegalMoveCount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {metrics.illegalMoveCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Retries</div>
            <div className={`font-bold ${metrics.retryCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {metrics.retryCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
