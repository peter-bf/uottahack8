'use client';

import { GlobalStats as GlobalStatsType, MatchResult } from '@/types';
import { Trophy, Zap } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const MODEL_COLORS: Record<string, string> = {
  gpt: 'text-emerald-400',
  deepseek: 'text-sky-400',
  gemini: 'text-amber-400',
};

const MODEL_NAMES: Record<string, string> = {
  gpt: 'OpenAI',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
};

const GAME_ICONS: Record<string, string> = {
  ttt: '⭕',
  c4: '🔴',
  bs: '🚢',
};

const GAME_NAMES: Record<string, string> = {
  ttt: 'Tic-Tac-Toe',
  c4: 'Connect Four',
  bs: 'Battleship',
};

interface GlobalStatsProps {
  stats: GlobalStatsType;
}

export function GlobalStats({ stats }: GlobalStatsProps) {
  const [recentMatches, setRecentMatches] = useState<MatchResult[]>([]);
  const [newMatchIds, setNewMatchIds] = useState<Set<string>>(new Set());
  const [allMatches, setAllMatches] = useState<MatchResult[]>([]);
  const [displayCount, setDisplayCount] = useState(2);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent matches from data
    const loadMatches = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Store all matches for infinite scroll
        setAllMatches(data.recentMatches);
        
        const recentData = data.recentMatches.slice(0, 8);
        
        // Track new matches for animation
        const newIds = new Set<string>();
        recentData.forEach((match: MatchResult) => {
          if (!recentMatches.find(m => m.id === match.id)) {
            newIds.add(match.id);
          }
        });
        
        setRecentMatches(recentData);
        if (newIds.size > 0) {
          setNewMatchIds(newIds);
          // Clear animation class after animation completes
          setTimeout(() => setNewMatchIds(new Set()), 600);
        }
      } catch (error) {
        console.error('Failed to load matches:', error);
      }
    };

    // Load immediately
    loadMatches();
    
    // Poll for new matches every 2 seconds
    const interval = setInterval(loadMatches, 2000);
    return () => clearInterval(interval);
  }, [recentMatches]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // When scrolled near bottom, load more
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setDisplayCount(prev => Math.min(prev + 5, allMatches.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [allMatches.length]);

  const totals = {
    matches: stats.ttt.matchesPlayed + stats.c4.matchesPlayed + stats.bs.matchesPlayed,
    gptWins: stats.ttt.winsByModel.gpt + stats.c4.winsByModel.gpt + stats.bs.winsByModel.gpt,
    deepseekWins: stats.ttt.winsByModel.deepseek + stats.c4.winsByModel.deepseek + stats.bs.winsByModel.deepseek,
    geminiWins: stats.ttt.winsByModel.gemini + stats.c4.winsByModel.gemini + stats.bs.winsByModel.gemini,
    draws: stats.ttt.draws + stats.c4.draws + stats.bs.draws,
  };

  // Calculate games played per model (not wins, but total games)
  const gamesPlayedByModel = {
    gpt: 0,
    deepseek: 0,
    gemini: 0,
  };

  [stats.ttt, stats.c4, stats.bs].forEach((gameStat) => {
    // Each game involves 2 models, so total games for a model is wins + losses
    // We can derive this from the leaderboard data
    gameStat.matchesPlayed && Object.entries(gameStat.winsByModel).forEach(([model, wins]) => {
      gamesPlayedByModel[model as keyof typeof gamesPlayedByModel] += gameStat.matchesPlayed;
    });
  });

  const getWinrateForGame = (gameStats: any, model: string) => {
    const wins = gameStats.winsByModel[model];
    const totalGames = gameStats.matchesPlayed;
    const draws = gameStats.draws;
    
    if (totalGames === 0) return 0;
    
    // Games where this model participated (excluding draws for the calculation base)
    // Each game has 2 players, so each model plays in every game
    // Winrate = wins / (totalGames - draws) * 100
    // Because draws don't count towards winrate
    const gamesWithWinners = totalGames - draws;
    if (gamesWithWinners === 0) return 0;
    
    return (wins / gamesWithWinners) * 100;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const match = new Date(timestamp);
    const diffMs = now.getTime() - match.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return match.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Leaderboard */}
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

          {/* Per-game breakdown - centered */}
          {totals.matches > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-3 gap-6 text-xs">
                {/* Tic-Tac-Toe */}
                <div className="flex flex-col items-center">
                  <div className="text-muted-foreground mb-3 font-medium">Tic-Tac-Toe</div>
                  {stats.ttt.matchesPlayed > 0 ? (
                    <div className="space-y-3 w-full">
                      {/* Wins centered */}
                      <div className="flex gap-2 items-center justify-center">
                        <span className="text-emerald-400 font-semibold">{stats.ttt.winsByModel.gpt}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sky-400 font-semibold">{stats.ttt.winsByModel.deepseek}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-amber-400 font-semibold">{stats.ttt.winsByModel.gemini}</span>
                      </div>
                      {/* Winrates centered */}
                      <div className="flex gap-2 items-center justify-center text-muted-foreground/70">
                        <span className="text-emerald-400/70 font-medium">
                          {getWinrateForGame(stats.ttt, 'gpt').toFixed(0)}%
                        </span>
                        <span>/</span>
                        <span className="text-sky-400/70 font-medium">
                          {getWinrateForGame(stats.ttt, 'deepseek').toFixed(0)}%
                        </span>
                        <span>/</span>
                        <span className="text-amber-400/70 font-medium">
                          {getWinrateForGame(stats.ttt, 'gemini').toFixed(0)}%
                        </span>
                      </div>
                      {/* Draws */}
                      <div className="flex justify-center text-muted-foreground/60 font-medium">
                        {stats.ttt.draws} draw{stats.ttt.draws !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground/50">No matches</div>
                  )}
                </div>

                {/* Connect Four */}
                <div className="flex flex-col items-center">
                  <div className="text-muted-foreground mb-3 font-medium">Connect Four</div>
                  {stats.c4.matchesPlayed > 0 ? (
                    <div className="space-y-3 w-full">
                      <div className="flex gap-2 items-center justify-center">
                        <span className="text-emerald-400 font-semibold">{stats.c4.winsByModel.gpt}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sky-400 font-semibold">{stats.c4.winsByModel.deepseek}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-amber-400 font-semibold">{stats.c4.winsByModel.gemini}</span>
                      </div>
                      <div className="flex gap-2 items-center justify-center text-muted-foreground/70">
                        <span className="text-emerald-400/70 font-medium">
                          {getWinrateForGame(stats.c4, 'gpt').toFixed(0)}%
                        </span>
                        <span>/</span>
                        <span className="text-sky-400/70 font-medium">
                          {getWinrateForGame(stats.c4, 'deepseek').toFixed(0)}%
                        </span>
                        <span>/</span>
                        <span className="text-amber-400/70 font-medium">
                          {getWinrateForGame(stats.c4, 'gemini').toFixed(0)}%
                        </span>
                      </div>
                      {/* Draws */}
                      <div className="flex justify-center text-muted-foreground/60 font-medium">
                        {stats.c4.draws} draw{stats.c4.draws !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground/50">No matches</div>
                  )}
                </div>

                {/* Battleship */}
                <div className="flex flex-col items-center">
                  <div className="text-muted-foreground mb-3 font-medium">Battleship</div>
                  {stats.bs.matchesPlayed > 0 ? (
                    <div className="space-y-3 w-full">
                      <div className="flex gap-2 items-center justify-center">
                        <span className="text-emerald-400 font-semibold">{stats.bs.winsByModel.gpt}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sky-400 font-semibold">{stats.bs.winsByModel.deepseek}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-amber-400 font-semibold">{stats.bs.winsByModel.gemini}</span>
                      </div>
                      <div className="flex gap-2 items-center justify-center text-muted-foreground/70">
                        <span className="text-emerald-400/70 font-medium">
                          {getWinrateForGame(stats.bs, 'gpt').toFixed(0)}%
                        </span>
                        <span>/</span>
                        <span className="text-sky-400/70 font-medium">
                          {getWinrateForGame(stats.bs, 'deepseek').toFixed(0)}%
                        </span>
                        <span>/</span>
                        <span className="text-amber-400/70 font-medium">
                          {getWinrateForGame(stats.bs, 'gemini').toFixed(0)}%
                        </span>
                      </div>
                      {/* Draws */}
                      <div className="flex justify-center text-muted-foreground/60 font-medium">
                        {stats.bs.draws} draw{stats.bs.draws !== 1 ? 's' : ''}
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

      {/* Battle Log */}
      {recentMatches.length > 0 && (
        <div className="bg-card rounded-lg border border-border flex flex-col max-h-64">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Battle Log
            </h2>
          </div>

          <div
            ref={scrollContainerRef}
            className="divide-y divide-border overflow-y-auto flex-1"
          >
            {allMatches.slice(0, displayCount).map((match) => {
              const gameIcon = GAME_ICONS[match.gameType];
              const gameName = GAME_NAMES[match.gameType];
              const isNewMatch = newMatchIds.has(match.id);

              if (match.winner === 'draw') {
                // Handle draw case
                const model1 = MODEL_NAMES[match.agentA.model];
                const model2 = MODEL_NAMES[match.agentB.model];
                const color1 = MODEL_COLORS[match.agentA.model];
                const color2 = MODEL_COLORS[match.agentB.model];

                return (
                  <div
                    key={match.id}
                    className={`p-3 flex items-center justify-between hover:bg-muted/50 transition ${
                      isNewMatch ? 'animate-in fade-in slide-in-from-top-2 duration-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{gameIcon}</span>
                      <div className="truncate text-sm">
                        <span className={`font-semibold ${color1}`}>{model1}</span>
                        <span className="text-muted-foreground mx-1">drew with</span>
                        <span className={`font-semibold ${color2}`}>{model2}</span>
                        <span className="text-muted-foreground ml-1">at {gameName}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatTimeAgo(match.createdAt)}
                    </div>
                  </div>
                );
              } else {
                // Handle win case
                const winnerColor = MODEL_COLORS[match.winnerModel || ''] || 'text-muted-foreground';
                const winnerName = MODEL_NAMES[match.winnerModel || ''] || 'Unknown';
                const loserModel = match.agentA.model === match.winnerModel ? match.agentB.model : match.agentA.model;
                const loserName = MODEL_NAMES[loserModel];

                return (
                  <div
                    key={match.id}
                    className={`p-3 flex items-center justify-between hover:bg-muted/50 transition ${
                      isNewMatch ? 'animate-in fade-in slide-in-from-top-2 duration-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{gameIcon}</span>
                      <div className="truncate text-sm">
                        <span className={`font-semibold ${winnerColor}`}>{winnerName}</span>
                        <span className="text-muted-foreground mx-1">won against</span>
                        <span className={`font-semibold ${MODEL_COLORS[loserModel]}`}>{loserName}</span>
                        <span className="text-muted-foreground ml-1">at {gameName}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatTimeAgo(match.createdAt)}
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* Loading indicator */}
          {displayCount < allMatches.length && (
            <div className="p-2 text-center text-xs text-muted-foreground/50 border-t border-border">
              Scroll down for more matches
            </div>
          )}
        </div>
      )}
    </div>
  );
}
