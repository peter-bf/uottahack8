'use client';

import { GameType, ModelType, GPTModel, DeepSeekModel } from '@/types';

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

interface GameControlsProps {
  gameType: GameType;
  agentAModel: ModelType;
  agentAModelVariant: GPTModel | DeepSeekModel;
  agentBModel: ModelType;
  agentBModelVariant: GPTModel | DeepSeekModel;
  onGameTypeChange: (type: GameType) => void;
  onAgentAModelChange: (model: ModelType) => void;
  onAgentAModelVariantChange: (variant: GPTModel | DeepSeekModel) => void;
  onAgentBModelChange: (model: ModelType) => void;
  onAgentBModelVariantChange: (variant: GPTModel | DeepSeekModel) => void;
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
  const agentAModels = agentAModel === 'gpt' ? GPT_MODELS : DEEPSEEK_MODELS;
  const agentBModels = agentBModel === 'gpt' ? GPT_MODELS : DEEPSEEK_MODELS;
  const agentATitle = agentAModel === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const agentBTitle = agentBModel === 'gpt' ? 'OpenAI' : 'DeepSeek';
  const agentABorder = agentAModel === 'deepseek' ? 'border-blue-500' : 'border-red-500';
  const agentBBorder = agentBModel === 'deepseek' ? 'border-blue-500' : 'border-red-500';
  const agentAText = agentAModel === 'deepseek' ? 'text-blue-400' : 'text-red-400';
  const agentBText = agentBModel === 'deepseek' ? 'text-blue-400' : 'text-red-400';

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-lg font-bold mb-4">Match Settings</h2>

      {/* Game Selection */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">Select Game</label>
        <div className="flex gap-2">
          <button
            onClick={() => onGameTypeChange('ttt')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              gameType === 'ttt'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Tic-Tac-Toe
          </button>
          <button
            onClick={() => onGameTypeChange('c4')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              gameType === 'c4'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Connect-4
          </button>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Agent A */}
        <div className={`bg-slate-700/50 rounded-lg p-4 border-l-4 ${agentABorder}`}>
          <h3 className={`font-medium mb-3 ${agentAText}`}>{agentATitle} (X / Red)</h3>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Provider</label>
            <select
              value={agentAModel}
              onChange={(e) => {
                const newModel = e.target.value as ModelType;
                onAgentAModelChange(newModel);
                // Reset to first variant of the new provider
                onAgentAModelVariantChange(newModel === 'gpt' ? 'gpt-4o-mini' : 'deepseek-chat');
              }}
              className="w-full bg-slate-600 rounded px-3 py-2 text-sm"
            >
              <option value="gpt">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Model</label>
            <select
              value={agentAModelVariant}
              onChange={(e) => onAgentAModelVariantChange(e.target.value as GPTModel | DeepSeekModel)}
              className="w-full bg-slate-600 rounded px-3 py-2 text-sm"
            >
              {agentAModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Agent B */}
        <div className={`bg-slate-700/50 rounded-lg p-4 border-l-4 ${agentBBorder}`}>
          <h3 className={`font-medium mb-3 ${agentBText}`}>{agentBTitle} (O / Yellow)</h3>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Provider</label>
            <select
              value={agentBModel}
              onChange={(e) => {
                const newModel = e.target.value as ModelType;
                onAgentBModelChange(newModel);
                // Reset to first variant of the new provider
                onAgentBModelVariantChange(newModel === 'gpt' ? 'gpt-4o-mini' : 'deepseek-chat');
              }}
              className="w-full bg-slate-600 rounded px-3 py-2 text-sm"
            >
              <option value="gpt">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Model</label>
            <select
              value={agentBModelVariant}
              onChange={(e) => onAgentBModelVariantChange(e.target.value as GPTModel | DeepSeekModel)}
              className="w-full bg-slate-600 rounded px-3 py-2 text-sm"
            >
              {agentBModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={onRunMatch}
        disabled={isRunning}
        className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all ${
          isRunning
            ? 'bg-slate-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl'
        }`}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Running Match...
          </span>
        ) : (
          'Run Single Match'
        )}
      </button>
    </div>
  );
}
