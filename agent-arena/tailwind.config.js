/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'drop': 'drop 0.5s ease-in',
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        drop: {
          '0%': { transform: 'translateY(-300px)', opacity: '0' },
          '60%': { transform: 'translateY(10px)', opacity: '1' },
          '80%': { transform: 'translateY(-5px)' },
          '100%': { transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #ffd700, 0 0 10px #ffd700' },
          '100%': { boxShadow: '0 0 20px #ffd700, 0 0 30px #ffd700' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Provider colors - Emerald (GPT/OpenAI)
    'bg-emerald-600',
    'bg-emerald-500',
    'bg-emerald-400',
    'bg-emerald-300',
    'bg-emerald-500/15',
    'bg-emerald-500/20',
    'bg-emerald-500/10',
    'bg-emerald-400/15',
    'bg-emerald-400/10',
    'bg-emerald-400/30',
    'bg-emerald-950/80',
    'text-emerald-400',
    'text-emerald-300',
    'text-emerald-200',
    'border-emerald-500/50',
    'border-emerald-500/20',
    'border-emerald-400/30',
    'border-emerald-700/50',
    
    // Provider colors - Sky (DeepSeek)
    'bg-sky-600',
    'bg-sky-500',
    'bg-sky-400',
    'bg-sky-300',
    'bg-sky-500/15',
    'bg-sky-500/20',
    'bg-sky-400/15',
    'bg-sky-400/10',
    'bg-sky-400/30',
    'bg-sky-950/80',
    'text-sky-400',
    'text-sky-300',
    'text-sky-200',
    'border-sky-500/50',
    'border-sky-400/30',
    'border-sky-700/50',
    
    // Provider colors - Amber (Gemini)
    'bg-amber-600',
    'bg-amber-500',
    'bg-amber-400',
    'bg-amber-300',
    'bg-amber-500/15',
    'bg-amber-500/20',
    'bg-amber-400/15',
    'bg-amber-400/10',
    'bg-amber-400/30',
    'bg-amber-400/10',
    'bg-amber-950/80',
    'text-amber-400',
    'text-amber-300',
    'text-amber-200',
    'text-amber-500',
    'border-amber-500/50',
    'border-amber-400/30',
    'border-amber-600/50',
    'border-amber-700/50',
    'ring-amber-400',
    'shadow-amber-400/50',
    
    // Error/Status colors - Red
    'bg-red-500/20',
    'bg-red-500/30',
    'text-red-400',
    'text-red-500',
    'border-red-500',
    
    // TicTacToe specific
    'ring-white/30',
    
    // Winner colors (text)
    'text-emerald-700',
    'text-sky-700',
    'text-amber-700',
    'text-emerald-950',
    'text-sky-950',
    'text-amber-950',
  ],  
};
