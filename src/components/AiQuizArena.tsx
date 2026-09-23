import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Clock, CheckCircle2, XCircle, ArrowRight, Zap, RefreshCw, Trophy } from 'lucide-react';
import type { TriviaQuestion } from '../types/quiz.ts';
import { sounds } from '../utils/soundEffects.ts';

interface AiQuizArenaProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onStatsUpdate: () => void;
}

export const AiQuizArena: React.FC<AiQuizArenaProps> = ({
  balance,
  onBalanceChange,
  onStatsUpdate
}) => {
  const [topic, setTopic] = useState<string>('Quantum Physics & AI Supercomputing');
  const [difficulty, setDifficulty] = useState<'Normal' | 'Hard' | 'Mastermind'>('Hard');
  const [stake, setStake] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active Game State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
    earnedPayout: number;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [totalPotWon, setTotalPotWon] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const TOPIC_PRESETS = [
    'Quantum Physics & AI Supercomputing',
    '80s & 90s Cyberpunk Cinema',
    'Nobel Prize Scientific Discoveries',
    'Global Geopolitics & Ancient Empires',
    'Formula 1 Grand Prix Legends',
    'Cryptographic Protocols & Blockchain'
  ];

  const handleGenerateAndEnter = async () => {
    if (balance < stake) {
      alert('Insufficient Q-Coins balance!');
      return;
    }

    setIsGenerating(true);
    sounds.playChip();

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          stake
        })
      });

      const data = await res.json();
      if (!res.ok || !data.questions || data.questions.length === 0) {
        alert('Failed to generate challenge. Please try again.');
        setIsGenerating(false);
        return;
      }

      setQuestions(data.questions);
      setCurrentIdx(0);
      setScore(0);
      setTotalPotWon(0);
      setIsFinished(false);
      setIsPlaying(true);
      setIsGenerating(false);

      startQuestion(data.questions[0]);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const startQuestion = (q: TriviaQuestion) => {
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
    if (result) return;
    submitAnswer(null);
  };

  const submitAnswer = async (idx: number | null) => {
    if (result) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(idx);
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    try {
      const res = await fetch('/api/match/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedIndex: idx,
          wagerMultiplier: difficulty === 'Mastermind' ? 3 : difficulty === 'Hard' ? 2 : 1,
          baseWager: Math.round(stake / 5),
          timeRemaining: timeLeft
        })
      });

      const data = await res.json();
      setResult(data);
      onBalanceChange(data.newBalance);
      onStatsUpdate();

      if (data.isCorrect) {
        sounds.playCorrect();
        setScore(prev => prev + 1);
        setTotalPotWon(prev => prev + data.earnedPayout);
      } else {
        sounds.playWrong();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextOrFinish = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      startQuestion(questions[nextIdx]);
    } else {
      setIsPlaying(false);
      setIsFinished(true);
      sounds.playWinFanfare();
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
      {/* Creation View */}
      {!isPlaying && !isFinished && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4" />
              <span>Gemini AI Challenge Generator</span>
              <span aria-hidden="true">·</span>
              <span>Unlimited Custom Arenas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              AI Custom Trivia Arena
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Name any topic or domain in the universe. The AI will synthesize a 5-question high-stakes 
              trivia arena calibrated to your desired difficulty and wager pot.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-6 shadow-xl">
            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Arena Topic / Theme
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. 1990s Cyberpunk Cinema, Quantum Physics, Formula 1..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {TOPIC_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      sounds.playChip();
                      setTopic(p);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Stake */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'Hard', 'Mastermind'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        sounds.playChip();
                        setDifficulty(d);
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        difficulty === d
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Ante Stake (Q-Coins)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        sounds.playChip();
                        setStake(s);
                      }}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                        stake === s
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateAndEnter}
              disabled={isGenerating || !topic.trim() || balance < stake}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Challenge Arena with Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  Generate Arena & Wager ({stake} Q-Coins)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Game Play */}
      {isPlaying && currentQ && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-amber-400">
                Q {currentIdx + 1} / {questions.length}
              </span>
              <span className="line-clamp-1">{topic}</span>
            </div>

            <div className={`flex items-center gap-1 font-mono font-bold text-xs ${
              timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white leading-snug">
              {currentQ.question}
            </h2>

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
                    disabled={result !== null}
                    className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
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

            {result && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${
                    result.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {result.isCorrect ? 'Correct! Wager Won' : 'Incorrect Answer'}
                  </span>
                  <span className="font-mono font-bold text-sm text-amber-400">
                    {result.isCorrect ? `+${result.earnedPayout} Q-Coins` : '0 Q-Coins'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">AI Fact: </span>
                  {result.explanation}
                </p>

                <button
                  onClick={handleNextOrFinish}
                  className="w-full mt-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span>
                    {currentIdx + 1 < questions.length ? 'Next Question' : 'View Arena Outcome'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finished Summary */}
      {isFinished && (
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0f172a] border border-slate-800 max-w-lg mx-auto space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display text-white">
              AI Arena Complete!
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Topic: <span className="text-amber-400 font-semibold">{topic}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase">Correct Answers</p>
              <p className="text-2xl font-extrabold font-mono text-white mt-1">
                {score} / {questions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Total Payout</p>
              <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                +{totalPotWon}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playChip();
              setIsFinished(false);
            }}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Create Another AI Challenge
          </button>
        </div>
      )}
    </div>
  );
};
