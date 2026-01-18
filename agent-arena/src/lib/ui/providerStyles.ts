import { ModelType } from '@/types';

export const PROVIDER_LABELS: Record<ModelType, string> = {
  gpt: 'OpenAI',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
};

interface ProviderStyle {
  text: string;
  textDark: string;
  border: string;
  borderDark: string;
  bg: string;
  bgDark: string;
  badge: string;
  badgeDark: string;
  chip: string;
  chipDark: string;
}

export const PROVIDER_STYLES: Record<ModelType, ProviderStyle> = {
  gpt: {
    text: 'text-emerald-400',
    textDark: 'text-emerald-600',
    border: 'border-emerald-500/50',
    borderDark: 'border-emerald-700/50',
    bg: 'bg-emerald-500/10',
    bgDark: 'bg-emerald-900/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
    badgeDark: 'bg-emerald-900/30 text-emerald-500',
    chip: 'bg-emerald-500',
    chipDark: 'bg-emerald-700',
  },
  deepseek: {
    text: 'text-sky-400',
    textDark: 'text-sky-600',
    border: 'border-sky-500/50',
    borderDark: 'border-sky-700/50',
    bg: 'bg-sky-500/10',
    bgDark: 'bg-sky-900/20',
    badge: 'bg-sky-500/20 text-sky-300',
    badgeDark: 'bg-sky-900/30 text-sky-500',
    chip: 'bg-sky-500',
    chipDark: 'bg-sky-700',
  },
  gemini: {
    text: 'text-amber-400',
    textDark: 'text-amber-600',
    border: 'border-amber-500/50',
    borderDark: 'border-amber-700/50',
    bg: 'bg-amber-500/10',
    bgDark: 'bg-amber-900/20',
    badge: 'bg-amber-500/20 text-amber-300',
    badgeDark: 'bg-amber-900/30 text-amber-500',
    chip: 'bg-amber-500',
    chipDark: 'bg-amber-700',
  },
};

// Helper to get styles based on player position
export function getPlayerStyles(model: ModelType, isP2: boolean) {
  const styles = PROVIDER_STYLES[model];
  return {
    text: isP2 ? styles.textDark : styles.text,
    border: isP2 ? styles.borderDark : styles.border,
    bg: isP2 ? styles.bgDark : styles.bg,
    badge: isP2 ? styles.badgeDark : styles.badge,
    chip: isP2 ? styles.chipDark : styles.chip,
  };
}
