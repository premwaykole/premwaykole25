import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Coins, ArrowUpRight, Zap } from 'lucide-react';
import type { PredictionMarket, UserMarketBet } from '../types/quiz.ts';
import { sounds } from '../utils/soundEffects.ts';

interface PredictionMarketsProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onStatsUpdate: () => void;
}

export const PredictionMarkets: React.FC<PredictionMarketsProps> = ({
  balance,
  onBalanceChange,
  onStatsUpdate
}) => {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [userBets, setUserBets] = useState<UserMarketBet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'markets' | 'my_bets'>('markets');

  // Bet Slip Modal / Selection
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [wagerAmount, setWagerAmount] = useState<number>(100);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [betSuccessMsg, setBetSuccessMsg] = useState<string | null>(null);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/markets');
      const data = await res.json();
      setMarkets(data.markets || []);
      setUserBets(data.userBets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const handleOpenBetSlip = (market: PredictionMarket, optionId: string) => {
    sounds.playChip();
    setSelectedMarket(market);
    setSelectedOptionId(optionId);
    setWagerAmount(100);
    setBetSuccessMsg(null);
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket || !selectedOptionId) return;
    if (balance < wagerAmount) {
      alert('Insufficient Q-Coins balance!');
      return;
    }

    setIsPlacingBet(true);
    sounds.playChip();

    try {
      const res = await fetch('/api/markets/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket.id,
          optionId: selectedOptionId,
          amount: wagerAmount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to place bet');
        setIsPlacingBet(false);
        return;
      }

      onBalanceChange(data.newBalance);
      onStatsUpdate();
      setBetSuccessMsg(`Bet of ${wagerAmount} Q-Coins placed successfully!`);
      sounds.playCorrect();

      // Refresh list
      fetchMarkets();

      setTimeout(() => {
        setSelectedMarket(null);
        setIsPlacingBet(false);
        setActiveTab('my_bets');
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsPlacingBet(false);
    }
  };

  const handleResolveMarket = async (marketId: string, winningOptionId: string) => {
    sounds.playChip();
    try {
      const res = await fetch('/api/markets/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, winningOptionId })
      });

      const data = await res.json();
      if (data.totalWinningsClaimed > 0) {
        sounds.playWinFanfare();
      }
      onBalanceChange(data.newBalance);
      onStatsUpdate();
      fetchMarkets();
    } catch (err) {
      console.error(err);
    }
  };

  const selectedOption = selectedMarket?.options.find(o => o.id === selectedOptionId);
  const potentialPayout = selectedOption ? Math.round(wagerAmount * selectedOption.odds) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Prediction Markets</span>
            <span aria-hidden="true">·</span>
            <span>Sportsbook Odds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Trivia Futures & Event Markets
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Wager on high-profile trivia tournaments, AI showdown records, and rapid question challenges.
            Liquidity pools determine real-time decimal odds.
          </p>
        </div>

        {/* View Segmented Tabs */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'markets'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Live Markets ({markets.filter(m => !m.resolved).length})
          </button>

          <button
            onClick={() => setActiveTab('my_bets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'my_bets'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            My Wagers ({userBets.length})
          </button>
        </div>
      </div>

      {/* Markets List */}
      {activeTab === 'markets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {markets.map(mkt => (
            <div
              key={mkt.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                mkt.resolved
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                  : 'bg-[#0f172a] border-slate-800/80 hover:border-slate-700 shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>{mkt.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-amber-400">
                    {mkt.totalPool.toLocaleString()} Q-Coins Pool
                  </span>
                </div>

                <h3 className="text-base font-bold font-display text-white">{mkt.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mkt.description}</p>

                {/* Outcome Betting Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {mkt.options.map(opt => {
                    const isWinning = mkt.resolved && mkt.winningOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        disabled={mkt.resolved}
                        onClick={() => handleOpenBetSlip(mkt, opt.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-default flex flex-col justify-between ${
                          isWinning
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-800 bg-slate-900/80 hover:border-amber-400/60 hover:bg-slate-900 text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-semibold line-clamp-1">{opt.label}</span>
                        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-800/60">
                          <span className="text-[11px] text-slate-400">Odds</span>
                          <span className="font-mono font-extrabold text-amber-400 text-sm tabular-nums">
                            {opt.odds.toFixed(2)}x
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Market Status & Simulated Resolution Tool */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {mkt.resolved ? 'Event Settled' : 'Closes in 48h'}
                </span>

                {!mkt.resolved ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Simulate Settle:</span>
                    {mkt.options.map((opt, i) => (
                      <button
                        key={opt.id}
                        onClick={() => handleResolveMarket(mkt.id, opt.id)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                        title={`Settle market with ${opt.label} winning`}
                      >
                        Pick #{i + 1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-400 font-semibold">Resolved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Bets View */}
      {activeTab === 'my_bets' && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Your Active Wagers & Settled Slips
          </h3>

          {userBets.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No active market wagers yet. Browse live markets and place your first prediction!
            </p>
          ) : (
            <div className="space-y-3">
              {userBets.map(bet => (
                <div
                  key={bet.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(bet.placedAt).toLocaleDateString()} · {bet.odds}x Fixed Odds
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{bet.marketTitle}</h4>
                    <p className="text-xs text-amber-400 font-semibold mt-1">
                      Pick: {bet.optionLabel}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:text-right gap-4 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    <div>
                      <p className="text-xs text-slate-400">Wager Amount</p>
                      <p className="text-sm font-bold font-mono text-white">
                        {bet.wagerAmount} Q-Coins
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        {bet.resolved ? 'Final Payout' : 'Potential Return'}
                      </p>
                      <p className={`text-sm font-extrabold font-mono tabular-nums ${
                        bet.resolved && bet.won
                          ? 'text-emerald-400'
                          : bet.resolved && !bet.won
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}>
                        {bet.resolved
                          ? bet.won
                            ? `+${bet.payout} Q-Coins`
                            : '0 Q-Coins'
                          : `${Math.round(bet.wagerAmount * bet.odds)} Q-Coins`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bet Slip Modal */}
      {selectedMarket && selectedOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Place Prediction Wager
                </span>
                <h3 className="text-base font-bold font-display text-white mt-0.5 line-clamp-2">
                  {selectedMarket.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMarket(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selection badge */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Selected Pick:</span>
                <p className="text-sm font-bold text-amber-300">{selectedOption.label}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Multiplier</span>
                <p className="font-mono font-bold text-amber-400">{selectedOption.odds.toFixed(2)}x</p>
              </div>
            </div>

            {/* Amount input & presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Stake Amount (Q-Coins)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => {
                      sounds.playChip();
                      setWagerAmount(amt);
                    }}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      wagerAmount === amt
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Payout */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Estimated Payout on Win:</span>
              <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                {potentialPayout} Q-Coins
              </span>
            </div>

            {betSuccessMsg ? (
              <p className="text-xs text-emerald-400 font-bold text-center">{betSuccessMsg}</p>
            ) : (
              <button
                onClick={handlePlaceBet}
                disabled={isPlacingBet || balance < wagerAmount}
                className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Coins className="w-4 h-4" />
                Confirm Wager ({wagerAmount} Q-Coins)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
