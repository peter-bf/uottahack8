'use client';

import { GlobalStats as GlobalStatsType } from '@/types';
import { Trophy } from 'lucide-react';

interface GlobalStatsProps {
  stats: GlobalStatsType;
}

export function GlobalStats({ stats }: GlobalStatsProps) {
  const totals = {
    matches: stats.ttt.matchesPlayed + stats.c4.matchesPlayed,
    gptWins: stats.ttt.winsByModel.gpt + stats.c4.winsByModel.gpt,
    deepseekWins: stats.ttt.winsByModel.deepseek + stats.c4.winsByModel.deepseek,
    geminiWins: stats.ttt.winsByModel.gemini + stats.c4.winsByModel.gemini,
    draws: stats.ttt.draws + stats.c4.draws,
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Leaderboard
        </h2>
      </div>

      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2">
            <div className="text-lg font-semibold font-mono">{totals.matches}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-semibold font-mono text-emerald-400">{totals.gptWins}</div>
            <div className="text-xs text-muted-foreground">OpenAI</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-semibold font-mono text-sky-400">{totals.deepseekWins}</div>
            <div className="text-xs text-muted-foreground">DeepSeek</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-semibold font-mono text-amber-400">{totals.geminiWins}</div>
            <div className="text-xs text-muted-foreground">Gemini</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-semibold font-mono text-muted-foreground">{totals.draws}</div>
            <div className="text-xs text-muted-foreground">Draws</div>
          </div>
        </div>

        {/* Per-game breakdown */}
        {totals.matches > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground mb-2">Tic-Tac-Toe</div>
                <div className="flex gap-2">
                  <span className="text-emerald-400">{stats.ttt.winsByModel.gpt}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sky-400">{stats.ttt.winsByModel.deepseek}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-amber-400">{stats.ttt.winsByModel.gemini}</span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Connect Four</div>
                <div className="flex gap-2">
                  <span className="text-emerald-400">{stats.c4.winsByModel.gpt}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sky-400">{stats.c4.winsByModel.deepseek}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-amber-400">{stats.c4.winsByModel.gemini}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {totals.matches === 0 && (
          <p className="text-center text-muted-foreground text-xs mt-4">
            No matches yet
          </p>
        )}
      </div>
    </div>
  );
}
