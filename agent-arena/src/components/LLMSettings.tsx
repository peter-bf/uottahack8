'use client';

import { useState, useEffect } from 'react';
import { Settings, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface LLMSettings {
  gpt: { key: string; temperature: number };
  deepseek: { key: string; temperature: number };
  gemini: { key: string; temperature: number };
}

export function LLMSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<LLMSettings>({
    gpt: { key: '', temperature: 0.7 },
    deepseek: { key: '', temperature: 0.7 },
    gemini: { key: '', temperature: 0.7 },
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({
    gpt: false,
    deepseek: false,
    gemini: false,
  });

  // Load settings from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('llmSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Save settings to sessionStorage
  const handleSettingChange = (provider: keyof LLMSettings, field: 'key' | 'temperature', value: string | number) => {
    const newSettings = {
      ...settings,
      [provider]: {
        ...settings[provider],
        [field]: value,
      },
    };
    setSettings(newSettings);
    sessionStorage.setItem('llmSettings', JSON.stringify(newSettings));
  };

  const maskKey = (key: string): string => {
    if (!key || key.length <= 11) return key;
    const visible = key.substring(0, 11);
    const hidden = '*'.repeat(Math.min(key.length - 11, 20));
    return visible + hidden;
  };

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 border-b border-border flex items-center justify-between hover:bg-secondary/50 transition"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <h2 className="text-sm font-medium">LLM Settings</h2>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-6 border-t border-border">
          {/* Disclaimer */}
          <div className="bg-secondary/30 border border-border rounded-md p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">🔒 Privacy Notice</p>
            <p>Your API keys are stored <strong>only locally in this web session</strong> on your machine. They are never sent to any server or stored persistently. Keys are cleared when you close this page.</p>
          </div>

          {/* Settings for each provider */}
          {(['gpt', 'deepseek', 'gemini'] as const).map((provider) => (
            <div key={provider} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium capitalize">{provider}</label>
                <span className="text-xs text-muted-foreground">Temp: {settings[provider].temperature.toFixed(2)}</span>
              </div>

              {/* API Key Input */}
              <div className="relative">
                <input
                  type={visibleKeys[provider] ? 'text' : 'password'}
                  placeholder="Paste API key here"
                  value={settings[provider].key}
                  onChange={(e) => handleSettingChange(provider, 'key', e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility(provider)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {visibleKeys[provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Display masked key hint */}
              {settings[provider].key && (
                <div className="text-xs text-muted-foreground/60 font-mono">
                  {maskKey(settings[provider].key)}
                </div>
              )}

              {/* Temperature Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings[provider].temperature}
                  onChange={(e) => handleSettingChange(provider, 'temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-foreground"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Deterministic</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          ))}

          {/* Info text */}
          <div className="text-xs text-muted-foreground/70 pt-4 border-t border-border/50">
            <p>If no API keys are provided, environment variables will be used: OPENAI_API_KEY, DEEPSEEK_API_KEY, GEMINI_API_KEY</p>
          </div>
        </div>
      )}
    </div>
  );
}
