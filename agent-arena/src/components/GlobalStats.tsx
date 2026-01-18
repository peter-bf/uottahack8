'use client';

import { GlobalStats as GlobalStatsType } from '@/types';

interface GlobalStatsProps {
  stats: GlobalStatsType;
}

export function GlobalStats({ stats }: GlobalStatsProps) {
  const games = [
    { key: 'ttt' as const, name: 'Tic-Tac-Toe', data: stats.ttt },
    { key: 'c4' as const, name: 'Connect-4', data: stats.c4 },
  ];

  const totals = {
    matches: stats.ttt.matchesPlayed + stats.c4.matchesPlayed,
    gptWins: stats.ttt.winsByModel.gpt + stats.c4.winsByModel.gpt,
    deepseekWins: stats.ttt.winsByModel.deepseek + stats.c4.winsByModel.deepseek,
    draws: stats.ttt.draws + stats.c4.draws,
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🏆</span> Global Leaderboard
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{totals.matches}</div>
          <div className="text-xs text-slate-400">Total Matches</div>
        </div>
        <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">{totals.gptWins}</div>
          <div className="text-xs text-slate-400">OpenAI Wins</div>
        </div>
        <div className="bg-blue-500/20 rounded-lg p-3 text-center border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{totals.deepseekWins}</div>
          <div className="text-xs text-slate-400">DeepSeek Wins</div>
        </div>
        <div className="bg-yellow-500/20 rounded-lg p-3 text-center border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">{totals.draws}</div>
          <div className="text-xs text-slate-400">Draws</div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-2 px-3 text-slate-400">Game</th>
              <th className="text-center py-2 px-3 text-slate-400">Matches</th>
              <th className="text-center py-2 px-3 text-red-400">OpenAI Wins</th>
              <th className="text-center py-2 px-3 text-blue-400">DeepSeek Wins</th>
              <th className="text-center py-2 px-3 text-yellow-400">Draws</th>
            </tr>
          </thead>
          <tbody>
            {games.map(game => (
              <tr key={game.key} className="border-b border-slate-700">
                <td className="py-3 px-3 font-medium">{game.name}</td>
                <td className="py-3 px-3 text-center">{game.data.matchesPlayed}</td>
                <td className="py-3 px-3 text-center text-red-400">{game.data.winsByModel.gpt}</td>
                <td className="py-3 px-3 text-center text-blue-400">{game.data.winsByModel.deepseek}</td>
                <td className="py-3 px-3 text-center text-yellow-400">{game.data.draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totals.matches === 0 && (
        <p className="text-center text-slate-500 mt-4">No matches played yet. Start a match to see stats!</p>
      )}
    </div>
  );
}
