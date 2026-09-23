import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, TrendingUp, Users } from 'lucide-react';
import type { LeaderboardEntry } from '../types/quiz.ts';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>High Roller Standings</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Rankings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Arena Hall of Fame
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            The sharpest trivia minds across all wagering formats. Rankings are sorted by cumulative 
            bankroll, win streak longevity, and duel win percentage.
          </p>
        </div>

        {/* Global summary stats */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-slate-200 font-semibold">1,420+ Contenders</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-semibold">4.8M Q-Coins Pot Volume</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6 text-center w-16">Rank</th>
                <th className="py-4 px-6">Contender</th>
                <th className="py-4 px-6 text-right">Bankroll</th>
                <th className="py-4 px-6 text-center">Win Rate</th>
                <th className="py-4 px-6 text-center">Streak</th>
                <th className="py-4 px-6 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaderboard.map(entry => {
                const isUser = entry.username.includes('You');
                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center">
                      {entry.rank === 1 ? (
                        <div className="w-7 h-7 mx-auto rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold font-mono">
                          1
                        </div>
                      ) : entry.rank === 2 ? (
                        <div className="w-7 h-7 mx-auto rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/30 flex items-center justify-center font-bold font-mono">
                          2
                        </div>
                      ) : entry.rank === 3 ? (
                        <div className="w-7 h-7 mx-auto rounded-lg bg-amber-700/20 text-amber-500 border border-amber-700/30 flex items-center justify-center font-bold font-mono">
                          3
                        </div>
                      ) : (
                        <span className="font-mono text-slate-500 font-bold">{entry.rank}</span>
                      )}
                    </td>

                    {/* Contender Name & Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display ${
                          isUser
                            ? 'bg-amber-400 text-slate-950 font-extrabold'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {entry.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-semibold line-clamp-1 ${isUser ? 'text-amber-400' : 'text-slate-100'}`}>
                            {entry.username}
                          </p>
                          {isUser && (
                            <span className="text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">
                              (Your Account)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Bankroll */}
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono font-bold text-white tabular-nums text-base">
                        {entry.balance.toLocaleString()}
                      </span>
                      <span className="text-xs text-amber-400 font-semibold ml-1.5">Q-Coins</span>
                    </td>

                    {/* Win Rate */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                        {entry.winRate}%
                      </span>
                    </td>

                    {/* Win Streak */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{entry.streak}x</span>
                      </div>
                    </td>

                    {/* Badge */}
                    <td className="py-4 px-6 text-right">
                      <span className="text-xs text-slate-400 font-medium">
                        {entry.badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
