'use client';

import { GameType, ModelType, GPTModel, DeepSeekModel, GeminiModel } from '@/types';
import { PROVIDER_LABELS, getPlayerStyles } from '@/lib/ui/providerStyles';
import { Play, Loader2 } from 'lucide-react';

// Model variant options
const GPT_MODELS: { value: GPTModel; label: string }[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const DEEPSEEK_MODELS: { value: DeepSeekModel; label: string }[] = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
];

const GEMINI_MODELS: { value: GeminiModel; label: string }[] = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

interface GameControlsProps {
  gameType: GameType;
  agentAModel: ModelType;
  agentAModelVariant: GPTModel | DeepSeekModel | GeminiModel;
  agentBModel: ModelType;
  agentBModelVariant: GPTModel | DeepSeekModel | GeminiModel;
  onGameTypeChange: (type: GameType) => void;
  onAgentAModelChange: (model: ModelType) => void;
  onAgentAModelVariantChange: (variant: GPTModel | DeepSeekModel | GeminiModel) => void;
  onAgentBModelChange: (model: ModelType) => void;
  onAgentBModelVariantChange: (variant: GPTModel | DeepSeekModel | GeminiModel) => void;
  onRunMatch: () => void;
  isRunning: boolean;
}

export function GameControls({
  gameType,
  agentAModel,
  agentAModelVariant,
  agentBModel,
  agentBModelVariant,
  onGameTypeChange,
  onAgentAModelChange,
  onAgentAModelVariantChange,
  onAgentBModelChange,
  onAgentBModelVariantChange,
  onRunMatch,
  isRunning,
}: GameControlsProps) {
  const agentAModels = agentAModel === 'gpt'
    ? GPT_MODELS
    : agentAModel === 'deepseek'
    ? DEEPSEEK_MODELS
    : GEMINI_MODELS;
  const agentBModels = agentBModel === 'gpt'
    ? GPT_MODELS
    : agentBModel === 'deepseek'
    ? DEEPSEEK_MODELS
    : GEMINI_MODELS;

  const agentAStyle = getPlayerStyles(agentAModel, false);
  const agentBStyle = getPlayerStyles(agentBModel, agentAModel === agentBModel);

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Game Selection */}
      <div className="p-4 border-b border-border">
        <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-wider">Game</label>
        <div className="flex gap-2">
          <button
            onClick={() => onGameTypeChange('ttt')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              gameType === 'ttt'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            Tic-Tac-Toe
          </button>
          <button
            onClick={() => onGameTypeChange('c4')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              gameType === 'c4'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            Connect Four
          </button>
        </div>
      </div>

      {/* Agent A Configuration */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Player 1</label>
          <span className={`text-xs font-medium ${agentAStyle.text}`}>{PROVIDER_LABELS[agentAModel]}</span>
        </div>
        <div className="space-y-2">
          <select
            value={agentAModel}
            onChange={(e) => {
              const newModel = e.target.value as ModelType;
              onAgentAModelChange(newModel);
              onAgentAModelVariantChange(
                newModel === 'gpt' ? 'gpt-4o-mini' : newModel === 'deepseek' ? 'deepseek-chat' : 'gemini-2.0-flash'
              );
            }}
            className="w-full bg-secondary border-0 rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
          >
            <option value="gpt">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gemini">Gemini</option>
          </select>
          <select
            value={agentAModelVariant}
            onChange={(e) => onAgentAModelVariantChange(e.target.value as GPTModel | DeepSeekModel | GeminiModel)}
            className="w-full bg-secondary border-0 rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
          >
            {agentAModels.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agent B Configuration */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Player 2</label>
          <span className={`text-xs font-medium ${agentBStyle.text}`}>{PROVIDER_LABELS[agentBModel]}</span>
        </div>
        <div className="space-y-2">
          <select
            value={agentBModel}
            onChange={(e) => {
              const newModel = e.target.value as ModelType;
              onAgentBModelChange(newModel);
              onAgentBModelVariantChange(
                newModel === 'gpt' ? 'gpt-4o-mini' : newModel === 'deepseek' ? 'deepseek-chat' : 'gemini-2.0-flash'
              );
            }}
            className="w-full bg-secondary border-0 rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
          >
            <option value="gpt">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gemini">Gemini</option>
          </select>
          <select
            value={agentBModelVariant}
            onChange={(e) => onAgentBModelVariantChange(e.target.value as GPTModel | DeepSeekModel | GeminiModel)}
            className="w-full bg-secondary border-0 rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
          >
            {agentBModels.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Run Button */}
      <div className="p-4">
        <button
          onClick={onRunMatch}
          disabled={isRunning}
          className={`w-full py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            isRunning
              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
              : 'bg-foreground text-background hover:bg-foreground/90'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Match
            </>
          )}
        </button>
      </div>
    </div>
  );
}
