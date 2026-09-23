import React, { useState, useEffect, useRef } from 'react';
import { Flame, Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Zap, Coins, RotateCcw } from 'lucide-react';
import type { Category, TriviaQuestion } from '../types/quiz.ts';
import { sounds } from '../utils/soundEffects.ts';

interface ConfidenceSoloProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onStatsUpdate: () => void;
}

export const ConfidenceSolo: React.FC<ConfidenceSoloProps> = ({
  balance,
  onBalanceChange,
  onStatsUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  
  // Wager & Confidence settings
  const [baseStake, setBaseStake] = useState<number>(50);
  const [multiplier, setMultiplier] = useState<number>(2); // 1x, 2x, 3x, 5x
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Question & Timer State
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
    earnedPayout: number;
    netChange: number;
  } | null>(null);

  // Run cumulative score & profit
  const [runStats, setRunStats] = useState<{
    correctCount: number;
    totalProfit: number;
    wagerHistory: { q: string; won: boolean; amount: number; payout: number }[];
  }>({
    correctCount: 0,
    totalProfit: 0,
    wagerHistory: []
  });

  const timerRef = useRef<number | null>(null);
  const totalWager = baseStake * multiplier;

  const startSoloRun = async () => {
    if (balance < baseStake) {
      alert('Insufficient Q-Coins balance! Claim the daily grant in the top bar to continue.');
      return;
    }

    sounds.playChip();
    try {
      const res = await fetch('/api/questions/random?count=5');
      const data = await res.json();
      setQuestions(data.questions);
      setCurrentIdx(0);
      setRunStats({
        correctCount: 0,
        totalProfit: 0,
        wagerHistory: []
      });
      setIsPlaying(true);
      prepareQuestion(data.questions[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const prepareQuestion = (q: TriviaQuestion) => {
    setSelectedOption(null);
    setResult(null);
    setTimeLeft(q.timeLimitSeconds);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        if (prev <= 4) sounds.playTick();
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (isVerifying || result) return;
    submitAnswer(null);
  };

  const submitAnswer = async (optionIdx: number | null) => {
    if (isVerifying || result) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVerifying(true);
    setSelectedOption(optionIdx);

    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    try {
      const res = await fetch('/api/match/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedIndex: optionIdx,
          wagerMultiplier: multiplier,
          baseWager: baseStake,
          timeRemaining: timeLeft
        })
      });

      const data = await res.json();
      setResult(data);
      setIsVerifying(false);
      onBalanceChange(data.newBalance);
      onStatsUpdate();

      if (data.isCorrect) {
        sounds.playCorrect();
        setRunStats(prev => ({
          ...prev,
          correctCount: prev.correctCount + 1,
          totalProfit: prev.totalProfit + data.netChange,
          wagerHistory: [
            ...prev.wagerHistory,
            { q: currentQ.question, won: true, amount: totalWager, payout: data.earnedPayout }
          ]
        }));
      } else {
        sounds.playWrong();
        setRunStats(prev => ({
          ...prev,
          totalProfit: prev.totalProfit - totalWager,
          wagerHistory: [
            ...prev.wagerHistory,
            { q: currentQ.question, won: false, amount: totalWager, payout: 0 }
          ]
        }));
      }
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
    }
  };

  const nextQuestionOrFinish = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      prepareQuestion(questions[nextIdx]);
    } else {
      // Completed Run
      sounds.playWinFanfare();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentQ = questions[currentIdx];

  return (
    <div className="space-y-6">
      {!isPlaying && (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                <span>Confidence Multiplier Mode</span>
                <span aria-hidden="true">·</span>
                <span>Custom Risk Calibration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                High Roller Solo Trivia
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Take on a gauntlet of 5 challenging trivia questions. For each question, 
                adjust your confidence multiplier from 1x to 5x based on your certainty. 
                Answer correctly under pressure to multiply your Q-Coins!
              </p>
            </div>

            {/* Run summary if player just finished a run */}
            {runStats.wagerHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Previous Run: </span>
                    <span className="font-bold text-white">
                      {runStats.correctCount} / {runStats.wagerHistory.length} Correct
                    </span>
                  </div>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <div>
                    <span className="text-slate-400">Net Return: </span>
                    <span className={`font-mono font-bold ${
                      runStats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {runStats.totalProfit >= 0 ? `+${runStats.totalProfit}` : runStats.totalProfit} Q-Coins
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 max-w-2xl mx-auto space-y-6">
            <h3 className="text-base font-bold text-white font-display">Configure Run Ante</h3>

            {/* Base Stake Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Base Stake Per Question
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {baseStake} Q-Coins
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    onClick={() => {
                      sounds.playChip();
                      setBaseStake(amt);
                    }}
                    className={`py-3 px-2 rounded-xl text-center border font-mono font-bold text-sm transition-all cursor-pointer ${
                      baseStake === amt
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplier Tiers Preview */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 uppercase text-[11px]">Multiplier Breakdown:</p>
              <div className="flex justify-between">
                <span>1x (Cautious):</span>
                <span className="font-mono text-slate-200">Stake {baseStake} → Win {baseStake * 2}</span>
              </div>
              <div className="flex justify-between">
                <span>2x (Solid):</span>
                <span className="font-mono text-slate-200">Stake {baseStake * 2} → Win {baseStake * 4}</span>
              </div>
              <div className="flex justify-between">
                <span>3x (High Roller):</span>
                <span className="font-mono text-slate-200">Stake {baseStake * 3} → Win {baseStake * 6}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>5x (ALL-IN):</span>
                <span className="font-mono">Stake {baseStake * 5} → Win {baseStake * 10} (+speed bonus)</span>
              </div>
            </div>

            <button
              onClick={startSoloRun}
              disabled={balance < baseStake}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Begin High Roller Run (5 Questions)
            </button>
          </div>
        </div>
      )}

      {/* Active Playing View */}
      {isPlaying && currentQ && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header Status Bar */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-amber-400">
                Q {currentIdx + 1} of {questions.length}
              </span>
              <span>{currentQ.category}</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-white">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-bold">{balance}</span> Q-Coins
              </div>

              <div className={`flex items-center gap-1 font-mono font-bold ${
                timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Question & Confidence Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white leading-snug">
              {currentQ.question}
            </h2>

            {/* Confidence Multiplier Selector (Only before answering) */}
            {!result && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider">
                    Select Confidence Wager:
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    Risk: {totalWager} Q-Coins → Potential Win: {totalWager * 2}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { m: 1, label: '1x Safe' },
                    { m: 2, label: '2x Solid' },
                    { m: 3, label: '3x High' },
                    { m: 5, label: '5x ALL-IN' }
                  ].map(tier => {
                    const isSelected = multiplier === tier.m;
                    const canAfford = balance >= baseStake * tier.m;
                    return (
                      <button
                        key={tier.m}
                        onClick={() => {
                          sounds.playChip();
                          setMultiplier(tier.m);
                        }}
                        disabled={!canAfford}
                        className={`py-2 px-1 rounded-lg text-center border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                            : canAfford
                            ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                            : 'border-slate-800/40 text-slate-600 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = result && idx === result.correctIndex;
                const isWrong = result && isSelected && !result.isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playChip();
                      submitAnswer(idx);
                    }}
                    disabled={isVerifying || result !== null}
                    className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/10'
                        : isWrong
                        ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                        : isSelected
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-200'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800/80 flex items-center justify-center text-xs font-mono shrink-0 text-slate-400">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {isWrong && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Result Breakdown Card */}
            {result && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className={`font-bold text-sm ${
                      result.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {result.isCorrect ? 'Correct! Payout Earned' : 'Incorrect Answer'}
                    </span>
                  </div>

                  <span className={`font-mono font-bold text-sm ${
                    result.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {result.isCorrect ? `+${result.earnedPayout}` : `-${totalWager}`} Q-Coins
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">Explanation: </span>
                  {result.explanation}
                </p>

                <button
                  onClick={nextQuestionOrFinish}
                  className="w-full mt-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span>
                    {currentIdx + 1 < questions.length ? 'Next Question' : 'Complete Run & Collect Total'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
