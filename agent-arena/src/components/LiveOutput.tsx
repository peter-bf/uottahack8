'use client';

import { AgentConfig, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { getPlayerStyles } from '@/lib/ui/providerStyles';
import { Radio, X, RotateCcw } from 'lucide-react';

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

export interface LiveMove {
  player: 'A' | 'B';
  move: number;
  reason?: string;
  modelVariant: GPTModel | DeepSeekModel | GeminiModel;
  timestamp: number;
  durationMs?: number;
  retries?: number;
  hadError?: boolean;
}

interface LiveOutputProps {
  moves: LiveMove[];
  agentA: AgentConfig;
  agentB: AgentConfig;
  isRunning: boolean;
  currentThinking: 'A' | 'B' | null;
  gameType: 'ttt' | 'c4';
}

export function LiveOutput({ moves, agentA, agentB, isRunning, currentThinking, gameType }: LiveOutputProps) {
  const formatMove = (move: number) => {
    if (gameType === 'ttt') {
      return `pos ${move}`;
    }
    return `col ${move}`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const agentAStyle = getPlayerStyles(agentA.model, false);
  const agentBStyle = getPlayerStyles(agentB.model, agentA.model === agentB.model);

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Radio className={`w-4 h-4 ${isRunning ? 'text-emerald-400' : 'text-muted-foreground'}`} />
          Move Log
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {moves.length} moves
        </span>
      </div>

      <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
        {moves.length === 0 && !isRunning && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Start a match to see moves
          </p>
        )}

        {moves.map((move, index) => {
          const isAgentA = move.player === 'A';
          const styles = isAgentA ? agentAStyle : agentBStyle;
          const modelLabel = MODEL_LABELS[move.modelVariant] || move.modelVariant;

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-md text-xs animate-fade-in ${styles.bg} border-l-2 ${move.hadError ? 'border-red-500' : styles.border}`}
            >
              <div className="flex items-center gap-2">
                {move.hadError && (
                  <X className="w-3 h-3 text-red-500" />
                )}
                {move.retries && move.retries > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-500" title={`${move.retries} retries`}>
                    <RotateCcw className="w-3 h-3" />
                    <span>{move.retries}</span>
                  </span>
                )}
                <span className={`font-medium ${styles.text}`}>
                  {modelLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {move.durationMs && (
                  <span className="text-muted-foreground">
                    {formatDuration(move.durationMs)}
                  </span>
                )}
                <span className="text-muted-foreground font-mono">
                  {formatMove(move.move)}
                </span>
              </div>
            </div>
          );
        })}

        {isRunning && currentThinking && (
          <div className={`flex items-center justify-between p-2 rounded-md text-xs ${
            currentThinking === 'A' ? agentAStyle.bg : agentBStyle.bg
          } border-l-2 ${
            currentThinking === 'A' ? agentAStyle.border : agentBStyle.border
          }`}>
            <span className={`font-medium ${
              currentThinking === 'A' ? agentAStyle.text : agentBStyle.text
            }`}>
              {MODEL_LABELS[currentThinking === 'A' ? agentA.modelVariant : agentB.modelVariant]}
            </span>
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
