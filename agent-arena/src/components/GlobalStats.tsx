'use client';

import { GlobalStats as GlobalStatsType } from '@/types';
import { Trophy } from 'lucide-react';

interface GlobalStatsProps {
  stats: GlobalStatsType;
}

export function GlobalStats({ stats }: GlobalStatsProps) {
  const totals = {
    matches: stats.ttt.matchesPlayed + stats.c4.matchesPlayed + stats.bs.matchesPlayed,
    gptWins: stats.ttt.winsByModel.gpt + stats.c4.winsByModel.gpt + stats.bs.winsByModel.gpt,
    deepseekWins: stats.ttt.winsByModel.deepseek + stats.c4.winsByModel.deepseek + stats.bs.winsByModel.deepseek,
    geminiWins: stats.ttt.winsByModel.gemini + stats.c4.winsByModel.gemini + stats.bs.winsByModel.gemini,
    draws: stats.ttt.draws + stats.c4.draws + stats.bs.draws,
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
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground mb-2">Tic-Tac-Toe</div>
                {stats.ttt.matchesPlayed > 0 ? (
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-emerald-400">{stats.ttt.winsByModel.gpt}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sky-400">{stats.ttt.winsByModel.deepseek}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-amber-400">{stats.ttt.winsByModel.gemini}</span>
                    </div>
                    <div className="flex gap-2 items-center text-muted-foreground/70">
                      <span className="text-emerald-400/70">
                        {((stats.ttt.winsByModel.gpt / stats.ttt.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                      <span>/</span>
                      <span className="text-sky-400/70">
                        {((stats.ttt.winsByModel.deepseek / stats.ttt.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                      <span>/</span>
                      <span className="text-amber-400/70">
                        {((stats.ttt.winsByModel.gemini / stats.ttt.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground/50">No matches</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Connect Four</div>
                {stats.c4.matchesPlayed > 0 ? (
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-emerald-400">{stats.c4.winsByModel.gpt}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sky-400">{stats.c4.winsByModel.deepseek}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-amber-400">{stats.c4.winsByModel.gemini}</span>
                    </div>
                    <div className="flex gap-2 items-center text-muted-foreground/70">
                      <span className="text-emerald-400/70">
                        {((stats.c4.winsByModel.gpt / stats.c4.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                      <span>/</span>
                      <span className="text-sky-400/70">
                        {((stats.c4.winsByModel.deepseek / stats.c4.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                      <span>/</span>
                      <span className="text-amber-400/70">
                        {((stats.c4.winsByModel.gemini / stats.c4.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground/50">No matches</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Battleship</div>
                {stats.bs.matchesPlayed > 0 ? (
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-emerald-400">{stats.bs.winsByModel.gpt}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sky-400">{stats.bs.winsByModel.deepseek}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-amber-400">{stats.bs.winsByModel.gemini}</span>
                    </div>
                    <div className="flex gap-2 items-center text-muted-foreground/70">
                      <span className="text-emerald-400/70">
                        {((stats.bs.winsByModel.gpt / stats.bs.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                      <span>/</span>
                      <span className="text-sky-400/70">
                        {((stats.bs.winsByModel.deepseek / stats.bs.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                      <span>/</span>
                      <span className="text-amber-400/70">
                        {((stats.bs.winsByModel.gemini / stats.bs.matchesPlayed) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground/50">No matches</div>
                )}
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
