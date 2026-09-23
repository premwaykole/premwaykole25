import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ArenaDuel } from './components/ArenaDuel.tsx';
import { ConfidenceSolo } from './components/ConfidenceSolo.tsx';
import { PredictionMarkets } from './components/PredictionMarkets.tsx';
import { AiQuizArena } from './components/AiQuizArena.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import type { PlayerStats, BetTransaction } from './types/quiz.ts';
import { sounds } from './utils/soundEffects.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'duel' | 'solo' | 'markets' | 'ai' | 'leaderboard'>('duel');
  const [balance, setBalance] = useState<number>(1250);
  const [winStreak, setWinStreak] = useState<number>(3);
  const [stats, setStats] = useState<PlayerStats>({
    balance: 1250,
    totalWon: 4200,
    totalLost: 2950,
    matchesPlayed: 18,
    matchesWon: 12,
    winStreak: 3,
    highestPayout: 900
  });
  const [transactions, setTransactions] = useState<BetTransaction[]>([]);
  const [isRefilling, setIsRefilling] = useState<boolean>(false);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setBalance(data.stats.balance);
        setWinStreak(data.stats.winStreak);
        setTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch user state:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleRefill = async () => {
    if (isRefilling) return;
    setIsRefilling(true);

    try {
      const res = await fetch('/api/user/faucet', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        showToast(data.message || '+500 Q-Coins Added!');
        fetchUserData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefilling(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          sounds.playChip();
          setActiveTab(tab);
        }}
        balance={balance}
        winStreak={winStreak}
        onRefill={handleRefill}
        isRefilling={isRefilling}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'duel' && (
          <ArenaDuel
            balance={balance}
            onBalanceChange={newBal => setBalance(newBal)}
            onStatsUpdate={fetchUserData}
          />
        )}

        {activeTab === 'solo' && (
          <ConfidenceSolo
            balance={balance}
            onBalanceChange={newBal => setBalance(newBal)}
            onStatsUpdate={fetchUserData}
          />
        )}

        {activeTab === 'markets' && (
          <PredictionMarkets
            balance={balance}
            onBalanceChange={newBal => setBalance(newBal)}
            onStatsUpdate={fetchUserData}
          />
        )}

        {activeTab === 'ai' && (
          <AiQuizArena
            balance={balance}
            onBalanceChange={newBal => setBalance(newBal)}
            onStatsUpdate={fetchUserData}
          />
        )}

        {activeTab === 'leaderboard' && <Leaderboard />}
      </main>

      {/* Wallet / Bankroll Ledger Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        stats={stats}
        transactions={transactions}
        onRefill={handleRefill}
        isRefilling={isRefilling}
      />

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl shadow-2xl animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Clean Footer (Quiet copyright and site links - no pseudo-telemetry tickers) */}
      <footer className="border-t border-slate-800/80 bg-[#080d1a] py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 QuizBets Arena. Purely simulated virtual coin wagering for trivia enthusiasts.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveTab('duel')} className="hover:text-amber-400 transition-colors">
              Duels
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('solo')} className="hover:text-amber-400 transition-colors">
              High Roller
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('markets')} className="hover:text-amber-400 transition-colors">
              Markets
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('leaderboard')} className="hover:text-amber-400 transition-colors">
              Leaderboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
