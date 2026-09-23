import React from 'react';
import { X, Coins, ArrowUpRight, ArrowDownRight, RefreshCw, Trophy, Flame } from 'lucide-react';
import type { PlayerStats, BetTransaction } from '../types/quiz.ts';
import { sounds } from '../utils/soundEffects.ts';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  transactions: BetTransaction[];
  onRefill: () => void;
  isRefilling: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  stats,
  transactions,
  onRefill,
  isRefilling
}) => {
  if (!isOpen) return null;

  const winRate = stats.matchesPlayed > 0 
    ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-display text-white">Bankroll & Ledger</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="p-6 bg-gradient-to-b from-slate-900/80 to-[#0f172a] border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Available Balance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                  {stats.balance.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-amber-400">Q-Coins</span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playFaucet();
                onRefill();
              }}
              disabled={isRefilling}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefilling ? 'animate-spin' : ''}`} />
              Claim Daily +500 Q-Coins
            </button>
          </div>

          {/* Stats Metrics (Unboxed text with separators per Zero-Pill discipline) */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Win Rate</p>
              <p className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                {winRate}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.matchesWon} Won / {stats.matchesPlayed} Total
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Current Streak</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-lg font-bold font-mono tabular-nums text-amber-400">
                  {stats.winStreak}x
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Active Run</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Top Payout</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-lg font-bold font-mono tabular-nums text-white">
                  {stats.highestPayout.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Single Round Record</p>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recent Wagering Activity
          </h3>

          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No wager activity yet. Enter an arena duel to begin!</p>
          ) : (
            transactions.map(tx => {
              const isProfit = tx.status === 'WON' && tx.payout > tx.amount;
              const isFaucet = tx.type === 'FAUCET';
              const isLoss = tx.status === 'LOST';

              return (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isProfit || isFaucet
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isLoss
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isProfit || isFaucet ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isLoss ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <Coins className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200 line-clamp-1">{tx.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className="font-mono">{tx.type.replace('_', ' ')}</span>
                        {tx.odds ? ` · ${tx.odds}x Odds` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono tabular-nums ${
                      isProfit || isFaucet
                        ? 'text-emerald-400'
                        : isLoss
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}>
                      {isLoss ? `-${tx.amount}` : `+${tx.payout}`} Q-Coins
                    </p>
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 text-center">
          <p className="text-xs text-slate-500">
            All wagers in QuizBets utilize test Q-Coins. No real currency is at stake.
          </p>
        </div>
      </div>
    </div>
  );
};
