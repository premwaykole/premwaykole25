import React from 'react';
import { Volume2, VolumeX, Plus, Coins, Zap } from 'lucide-react';
import { sounds } from '../utils/soundEffects.ts';

interface NavbarProps {
  activeTab: 'duel' | 'solo' | 'markets' | 'ai' | 'leaderboard';
  setActiveTab: (tab: 'duel' | 'solo' | 'markets' | 'ai' | 'leaderboard') => void;
  balance: number;
  winStreak: number;
  onRefill: () => void;
  isRefilling: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  balance,
  winStreak,
  onRefill,
  isRefilling,
  isMuted,
  onToggleMute,
  onOpenWallet
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single element brand wordmark */}
        <button
          onClick={() => setActiveTab('duel')}
          className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Coins className="w-4 h-4" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-display text-white">
            Quiz<span className="text-amber-400">Bets</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('duel')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'duel'
                ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Arena Duel
          </button>

          <button
            onClick={() => setActiveTab('solo')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'solo'
                ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            High Roller Solo
          </button>

          <button
            onClick={() => setActiveTab('markets')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'markets'
                ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Prediction Markets
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            AI Arena
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Leaderboard
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Bankroll, Faucet, SFX) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Win Streak Indicator */}
          {winStreak > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-mono tabular-nums">{winStreak}x</span>
              <span className="text-[11px] uppercase tracking-wider text-amber-400/80">Streak</span>
            </div>
          )}

          {/* Bankroll Pill (interactive to open wallet ledger) */}
          <button
            onClick={() => {
              sounds.playChip();
              onOpenWallet();
            }}
            title="View Bankroll & History"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/50 transition-colors shadow-sm group"
          >
            <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold font-mono tabular-nums text-slate-100">
              {balance.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-semibold hidden sm:inline">Q-Coins</span>
          </button>

          {/* Quick Refill Faucet */}
          <button
            onClick={() => {
              sounds.playFaucet();
              onRefill();
            }}
            disabled={isRefilling}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Refill</span> +500
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => {
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-[#080d1a] py-1.5 px-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('duel')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'duel' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Duel
        </button>
        <button
          onClick={() => setActiveTab('solo')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'solo' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Solo Wager
        </button>
        <button
          onClick={() => setActiveTab('markets')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'markets' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Markets
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'ai' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          AI Arena
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'leaderboard' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Ranks
        </button>
      </div>
    </header>
  );
};
