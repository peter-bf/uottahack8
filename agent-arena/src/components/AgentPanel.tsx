'use client';

import { AgentConfig, MoveRecord, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { PROVIDER_LABELS, getPlayerStyles } from '@/lib/ui/providerStyles';

// Human-readable model names
const MODEL_LABELS: Record<GPTModel | DeepSeekModel | GeminiModel, string> = {
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4o': 'GPT-4o',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
};

interface AgentPanelProps {
  label: 'A' | 'B';
  config: AgentConfig;
  lastMove: MoveRecord | null;
  isActive: boolean;
  isP2: boolean;
  metrics?: {
    invalidJsonCount: number;
    illegalMoveCount: number;
    retryCount: number;
  };
}

export function AgentPanel({ label, config, lastMove, isActive, isP2, metrics }: AgentPanelProps) {
  const providerDisplay = PROVIDER_LABELS[config.model];
  const modelDisplay = MODEL_LABELS[config.modelVariant] || config.modelVariant;
  const styles = getPlayerStyles(config.model, isP2);

  return (
    <div className={`p-4 rounded-lg border ${styles.border} ${isActive ? styles.bg : 'bg-card'} transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${styles.text}`}>
            {providerDisplay}
          </h3>
          {isActive && (
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles.badge}`}>
          {label === 'A' ? 'P1' : 'P2'}
        </span>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        {modelDisplay}
      </div>

      {lastMove && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Last move</span>
            <span className="font-mono text-sm">{lastMove.move}</span>
          </div>
          {lastMove.reason && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {lastMove.reason}
            </p>
          )}
        </div>
      )}

      {metrics && (
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-1 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground mb-1">JSON</div>
            <div className={`font-mono ${metrics.invalidJsonCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {metrics.invalidJsonCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1">Illegal</div>
            <div className={`font-mono ${metrics.illegalMoveCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {metrics.illegalMoveCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1">Retry</div>
            <div className={`font-mono ${metrics.retryCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics.retryCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
