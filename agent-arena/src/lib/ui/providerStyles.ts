import { ModelType } from '@/types';

export const PROVIDER_LABELS: Record<ModelType, string> = {
  gpt: 'OpenAI',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
};

interface ProviderStyle {
  text: string;
  textP2: string;
  border: string;
  borderP2: string;
  bg: string;
  bgP2: string;
  badge: string;
  badgeP2: string;
  chip: string;
  chipP2: string;
}

export const PROVIDER_STYLES: Record<ModelType, ProviderStyle> = {
  gpt: {
    text: 'text-emerald-400',
    textP2: 'text-emerald-300',
    border: 'border-emerald-500/50',
    borderP2: 'border-emerald-400/30',
    bg: 'bg-emerald-500/15',
    bgP2: 'bg-emerald-400/10',
    badge: 'bg-emerald-500/20 text-emerald-300',
    badgeP2: 'bg-emerald-400/15 text-emerald-200',
    chip: 'bg-emerald-500',
    chipP2: 'bg-emerald-400',
  },
  deepseek: {
    text: 'text-sky-400',
    textP2: 'text-sky-300',
    border: 'border-sky-500/50',
    borderP2: 'border-sky-400/30',
    bg: 'bg-sky-500/15',
    bgP2: 'bg-sky-400/10',
    badge: 'bg-sky-500/20 text-sky-300',
    badgeP2: 'bg-sky-400/15 text-sky-200',
    chip: 'bg-sky-500',
    chipP2: 'bg-sky-300',
  },
  gemini: {
    text: 'text-amber-400',
    textP2: 'text-amber-300',
    border: 'border-amber-500/50',
    borderP2: 'border-amber-400/30',
    bg: 'bg-amber-500/15',
    bgP2: 'bg-amber-400/10',
    badge: 'bg-amber-500/20 text-amber-300',
    badgeP2: 'bg-amber-400/15 text-amber-200',
    chip: 'bg-amber-500',
    chipP2: 'bg-amber-300',
  },
};

// Helper to get styles based on player position
export function getPlayerStyles(model: ModelType, isP2: boolean) {
  const styles = PROVIDER_STYLES[model];
  return {
    text: isP2 ? styles.textP2 : styles.text,
    border: isP2 ? styles.borderP2 : styles.border,
    bg: isP2 ? styles.bgP2 : styles.bg,
    badge: isP2 ? styles.badgeP2 : styles.badge,
    chip: isP2 ? styles.chipP2 : styles.chip,
  };
}
