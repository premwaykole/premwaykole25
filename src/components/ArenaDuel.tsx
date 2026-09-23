import React, { useState, useEffect, useRef } from 'react';
import { Swords, Trophy, Clock, CheckCircle2, XCircle, ArrowRight, Zap, RefreshCw, UserCheck, Flame } from 'lucide-react';
import type { Category, DuelOpponent, TriviaQuestion } from '../types/quiz.ts';
import { sounds } from '../utils/soundEffects.ts';

interface ArenaDuelProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onStatsUpdate: () => void;
}

type DuelState = 'LOBBY' | 'MATCHMAKING' | 'PLAYING' | 'ROUND_RECAP' | 'GAME_OVER';

interface MatchRoundResult {
  round: number;
  question: string;
  userCorrect: boolean;
  userAnswer: string;
  userTime: number;
  opponentCorrect: boolean;
  opponentAnswer: string;
  correctAnswer: string;
}

export const ArenaDuel: React.FC<ArenaDuelProps> = ({
  balance,
  onBalanceChange,
  onStatsUpdate
}) => {
  const [duelState, setDuelState] = useState<DuelState>('LOBBY');
  const [selectedStake, setSelectedStake] = useState<number>(100);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedOpponent, setSelectedOpponent] = useState<DuelOpponent | null>(null);

  // Match Session
  const [matchQuestions, setMatchQuestions] = useState<TriviaQuestion[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [userScore, setUserScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [roundResults, setRoundResults] = useState<MatchRoundResult[]>([]);

  // Current Question State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);
  const [opponentIsCorrect, setOpponentIsCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [roundStartTime, setRoundStartTime] = useState<number>(0);

  // Match summary
  const [matchWinner, setMatchWinner] = useState<'USER' | 'OPPONENT' | 'TIE' | null>(null);
  const [payoutReceived, setPayoutReceived] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const botTimerRef = useRef<number | null>(null);

  const STAKE_OPTIONS = [50, 100, 250, 500, 1000];
  const CATEGORIES: Category[] = [
    'All',
    'Tech & AI',
    'Science & Space',
    'World History',
    'Pop Culture & Film',
    'Sports & Gaming',
    'Finance & Crypto'
  ];

  const OPPONENTS: DuelOpponent[] = [
    {
      id: 'bot-1',
      name: 'CyberSage_99',
      title: 'Algorithm Prodigy',
      avatarSeed: 'cybersage',
      winRate: 74,
      streak: 5,
      speedRating: 'Fast'
    },
    {
      id: 'bot-2',
      name: 'TriviaQueen_X',
      title: 'History & Cinema Buff',
      avatarSeed: 'triviaqueen',
      winRate: 68,
      streak: 3,
      speedRating: 'Calculated'
    },
    {
      id: 'bot-3',
      name: 'VortexMind',
      title: 'Quantum Generalist',
      avatarSeed: 'vortexmind',
      winRate: 81,
      streak: 8,
      speedRating: 'Fast'
    },
    {
      id: 'bot-4',
      name: 'NeoChallenger',
      title: 'Rising Contender',
      avatarSeed: 'neochallenger',
      winRate: 58,
      streak: 2,
      speedRating: 'Steady'
    }
  ];

  // Start matchmaking / start match
  const handleStartDuel = async (opp?: DuelOpponent) => {
    if (balance < selectedStake) {
      alert('Insufficient Q-Coins! Please refill your bankroll from the top bar.');
      return;
    }

    sounds.playChip();
    setDuelState('MATCHMAKING');

    const opponentToPlay = opp || selectedOpponent || OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    setSelectedOpponent(opponentToPlay);

    try {
      const res = await fetch('/api/duels/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stake: selectedStake,
          category: selectedCategory,
          opponentId: opponentToPlay.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start duel');
        setDuelState('LOBBY');
        return;
      }

      onBalanceChange(data.newBalance);

      // Brief simulated matchmaking latency (800ms) for high tension esports feel
      setTimeout(() => {
        setMatchQuestions(data.matchSession.questions);
        setCurrentRound(0);
        setUserScore(0);
        setOpponentScore(0);
        setRoundResults([]);
        setMatchWinner(null);
        startRound(0, data.matchSession.questions, opponentToPlay);
      }, 900);
    } catch (err) {
      console.error(err);
      setDuelState('LOBBY');
    }
  };

  const startRound = (roundIdx: number, questions: TriviaQuestion[], opponent: DuelOpponent) => {
    const q = questions[roundIdx];
    if (!q) return;

    setDuelState('PLAYING');
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setOpponentAnswered(false);
    setOpponentIsCorrect(false);
    setTimeLeft(q.timeLimitSeconds);
    setRoundStartTime(Date.now());

    // Clear old timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    // Question countdown timer
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpire();
          return 0;
        }
        if (prev <= 4) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    // Opponent response simulation
    // Speed factor: Fast (2-5s), Calculated (3-7s), Steady (4-9s)
    const baseDelay = opponent.speedRating === 'Fast' ? 2500 : opponent.speedRating === 'Calculated' ? 4000 : 5000;
    const randomizedDelay = baseDelay + Math.random() * 2500;

    botTimerRef.current = window.setTimeout(() => {
      // Accuracy based on bot's winRate
      const willBeCorrect = Math.random() * 100 < opponent.winRate;
      setOpponentAnswered(true);
      setOpponentIsCorrect(willBeCorrect);
      if (willBeCorrect) {
        setOpponentScore(prev => prev + q.basePoints);
      }
    }, Math.min(randomizedDelay, q.timeLimitSeconds * 1000 - 500));
  };

  const handleTimeExpire = () => {
    if (isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    sounds.playWrong();
    concludeRound(null, 0);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted || duelState !== 'PLAYING') return;

    const currentQ = matchQuestions[currentRound];
    if (!currentQ) return;

    sounds.playChip();
    setSelectedOption(idx);
    setIsAnswerSubmitted(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = Math.max(1, Math.round((Date.now() - roundStartTime) / 1000));
    const isCorrect = idx === currentQ.correctIndex;

    let pointsEarned = 0;
    if (isCorrect) {
      sounds.playCorrect();
      // Speed bonus: up to 1.5x points if answered swiftly
      const speedMultiplier = timeSpent <= 4 ? 1.5 : timeSpent <= 8 ? 1.25 : 1.0;
      pointsEarned = Math.round(currentQ.basePoints * speedMultiplier);
      setUserScore(prev => prev + pointsEarned);
    } else {
      sounds.playWrong();
    }

    concludeRound(idx, timeSpent);
  };

  const concludeRound = (userPickedIdx: number | null, timeSpent: number) => {
    const currentQ = matchQuestions[currentRound];
    if (!currentQ) return;

    const userIsCorrect = userPickedIdx === currentQ.correctIndex;

    // Record round result
    const resultItem: MatchRoundResult = {
      round: currentRound + 1,
      question: currentQ.question,
      userCorrect: userIsCorrect,
      userAnswer: userPickedIdx !== null ? currentQ.options[userPickedIdx] : 'Timed Out',
      userTime: timeSpent,
      opponentCorrect: opponentIsCorrect,
      opponentAnswer: opponentIsCorrect ? currentQ.options[currentQ.correctIndex] : 'Incorrect',
      correctAnswer: currentQ.options[currentQ.correctIndex]
    };

    setRoundResults(prev => [...prev, resultItem]);

    // Transition to Round Recap after 1.5 seconds
    setTimeout(() => {
      setDuelState('ROUND_RECAP');
    }, 1200);
  };

  const handleNextRoundOrFinish = async () => {
    const nextRoundIdx = currentRound + 1;

    if (nextRoundIdx < matchQuestions.length) {
      setCurrentRound(nextRoundIdx);
      startRound(nextRoundIdx, matchQuestions, selectedOpponent!);
    } else {
      // Match Finished!
      setDuelState('GAME_OVER');
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      try {
        const res = await fetch('/api/duels/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: 'duel-active',
            stake: selectedStake,
            userScore,
            opponentScore,
            opponentName: selectedOpponent?.name || 'Challenger'
          })
        });

        const data = await res.json();
        if (data.playerWon) {
          setMatchWinner('USER');
          setPayoutReceived(data.payout);
          sounds.playWinFanfare();
        } else if (data.isTie) {
          setMatchWinner('TIE');
          setPayoutReceived(data.payout);
        } else {
          setMatchWinner('OPPONENT');
          setPayoutReceived(0);
          sounds.playWrong();
        }

        onBalanceChange(data.newBalance);
        onStatsUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  const currentQ = matchQuestions[currentRound];
  const totalPot = selectedStake * 2;

  return (
    <div className="space-y-6">
      {/* State: LOBBY */}
      {duelState === 'LOBBY' && (
        <div className="space-y-6">
          {/* Header Hero Area */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                <span>Head-to-Head Wager Arena</span>
                <span aria-hidden="true">·</span>
                <span>Winner Takes All Pot</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                Live 1v1 Trivia Duels
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Stake your Q-Coins against seasoned trivia bots and live contenders in a 5-round battle. 
                Fast answers earn streak multipliers. Prove your intellect and claim the double pot!
              </p>
            </div>

            {/* Quick Stats Pill Replacement (Clean metadata) */}
            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">5 Rounds</span>
                <span>/ Match</span>
              </div>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">15s Max</span>
                <span>/ Question</span>
              </div>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-semibold">Double Pot</span>
                <span>(2.0x Payout)</span>
              </div>
            </div>
          </div>

          {/* Wager Stake & Category Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Stake Picker */}
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Select Wager Stake
              </h3>
              <p className="text-xs text-slate-400">
                Both players ante up this amount into the winner pot.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-2 pt-2">
                {STAKE_OPTIONS.map(stake => {
                  const isSelected = selectedStake === stake;
                  const canAfford = balance >= stake;
                  return (
                    <button
                      key={stake}
                      onClick={() => {
                        sounds.playChip();
                        setSelectedStake(stake);
                      }}
                      disabled={!canAfford}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-md shadow-amber-400/10'
                          : canAfford
                          ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          : 'border-slate-800/40 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="block text-base font-extrabold font-mono tabular-nums">
                        {stake}
                      </span>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400 mt-0.5">
                        Q-Coins
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Total Match Pot:</span>
                <span className="font-bold font-mono tabular-nums text-amber-400 text-sm">
                  {(selectedStake * 2).toLocaleString()} Q-Coins
                </span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Choose Domain Focus
              </h3>
              <p className="text-xs text-slate-400">
                Filter question topics or leave as All for a randomized test.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      sounds.playChip();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Match CTA */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0f172a] to-slate-900 border border-slate-800/80 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Enter Battle
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ready to test your wits? Match instantly with an active challenger.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Your Entry:</span>
                    <span className="font-mono text-slate-200">{selectedStake} Q-Coins</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Opponent Entry:</span>
                    <span className="font-mono text-slate-200">{selectedStake} Q-Coins</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold border-t border-slate-800/80 pt-1.5">
                    <span>Winner Take:</span>
                    <span className="font-mono text-sm">{selectedStake * 2} Q-Coins</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartDuel()}
                disabled={balance < selectedStake}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Swords className="w-4 h-4 stroke-[2.5]" />
                Find Match & Ante Up ({selectedStake} Q-Coins)
              </button>
            </div>
          </div>

          {/* Challengers Roster */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Duel Contenders
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target a specific rival or view their stats
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {OPPONENTS.map(opp => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-amber-400 font-display">
                        {opp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {opp.winRate}%
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase">Win Rate</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-3 line-clamp-1">{opp.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{opp.title}</p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>Pace: {opp.speedRating}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-mono">
                        <Flame className="w-3 h-3 fill-amber-400" /> {opp.streak}x
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartDuel(opp)}
                    disabled={balance < selectedStake}
                    className="mt-4 w-full py-2 px-3 bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Challenge ({selectedStake})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* State: MATCHMAKING */}
      {duelState === 'MATCHMAKING' && (
        <div className="p-12 rounded-2xl bg-[#0f172a] border border-slate-800 text-center space-y-6 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
            <Swords className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-white">Matching Duel Opponent...</h2>
            <p className="text-slate-400 text-sm mt-1">
              Locking in {selectedStake} Q-Coins ante · Preparing question arena
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm text-slate-300">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Connecting with {selectedOpponent?.name || 'Rival'}...</span>
          </div>
        </div>
      )}

      {/* State: PLAYING */}
      {duelState === 'PLAYING' && currentQ && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Match HUD / Scoreboard */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex items-center justify-between">
            {/* Player 1 (User) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold font-display text-sm sm:text-base">
                YOU
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">You</p>
                <p className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-white">
                  {userScore} <span className="text-xs text-slate-400 font-normal">pts</span>
                </p>
              </div>
            </div>

            {/* Match Center: Pot, Round & Timer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-amber-400 mb-1">
                <span>Pot: {totalPot} Q-Coins</span>
              </div>
              <p className="text-xs text-slate-400">
                Round {currentRound + 1} of {matchQuestions.length}
              </p>

              {/* Timer circle / countdown */}
              <div className={`mt-1 font-mono text-xl font-bold tabular-nums flex items-center justify-center gap-1 ${
                timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-slate-100'
              }`}>
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Player 2 (Opponent) */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="flex items-center justify-end gap-1.5">
                  {opponentAnswered && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  <p className="text-xs text-slate-400 uppercase font-semibold line-clamp-1 max-w-[100px]">
                    {selectedOpponent?.name || 'Rival'}
                  </p>
                </div>
                <p className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-white">
                  {opponentScore} <span className="text-xs text-slate-400 font-normal">pts</span>
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold font-display text-sm sm:text-base">
                {selectedOpponent?.name.slice(0, 2).toUpperCase() || 'OP'}
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
              <span>{currentQ.category}</span>
              <span aria-hidden="true">·</span>
              <span>{currentQ.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-400 font-semibold">+{currentQ.basePoints} pts</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-bold font-display text-white leading-snug">
              {currentQ.question}
            </h2>

            {/* 4 Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = isAnswerSubmitted && idx === currentQ.correctIndex;
                const isWrong = isAnswerSubmitted && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10'
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

            {/* Answer feedback status */}
            {isAnswerSubmitted && (
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 animate-in fade-in">
                <span>
                  {selectedOption === currentQ.correctIndex
                    ? '✓ Correct answer locked in!'
                    : '✗ Incorrect! Review explanation below.'}
                </span>
                <span>Calculating round recap...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* State: ROUND_RECAP */}
      {duelState === 'ROUND_RECAP' && currentQ && (
        <div className="p-8 rounded-2xl bg-[#0f172a] border border-slate-800 max-w-xl mx-auto space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Round {currentRound + 1} Complete
            </span>
            <h3 className="text-xl font-bold font-display text-white mt-1">
              Scoreboard Update
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Your Answer:</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${
                selectedOption === currentQ.correctIndex ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {selectedOption === currentQ.correctIndex ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {selectedOption !== null ? currentQ.options[selectedOption] : 'Time Expired'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">
                {selectedOpponent?.name || 'Rival'}'s Answer:
              </span>
              <span className={`text-sm font-bold flex items-center gap-1 ${
                opponentIsCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {opponentIsCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {opponentIsCorrect ? 'Correct' : 'Missed'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Explanation: </span>
              {currentQ.explanation}
            </div>
          </div>

          {/* Current Totals */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Your Score</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">{userScore}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">{selectedOpponent?.name || 'Rival'}</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">{opponentScore}</p>
            </div>
          </div>

          <button
            onClick={handleNextRoundOrFinish}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <span>
              {currentRound + 1 < matchQuestions.length ? 'Next Question' : 'View Final Duel Outcome'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* State: GAME_OVER */}
      {duelState === 'GAME_OVER' && (
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0f172a] border border-slate-800 max-w-xl mx-auto space-y-6 shadow-2xl text-center">
          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${
            matchWinner === 'USER'
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              : matchWinner === 'TIE'
              ? 'bg-slate-700/20 border border-slate-700 text-slate-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}>
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              {matchWinner === 'USER'
                ? 'VICTORY!'
                : matchWinner === 'TIE'
                ? 'STALEMATE / PUSH'
                : 'DEFEAT'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {matchWinner === 'USER'
                ? `You outmatched ${selectedOpponent?.name} and claimed the ${totalPot} Q-Coins pot!`
                : matchWinner === 'TIE'
                ? `Scores tied. Your initial ante of ${selectedStake} Q-Coins was refunded.`
                : `${selectedOpponent?.name} scored higher this match. Better luck next round!`}
            </p>
          </div>

          {/* Outcome Metric Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase">Your Final Score</p>
              <p className="text-2xl font-extrabold font-mono text-white mt-1">{userScore} pts</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Opponent Score</p>
              <p className="text-2xl font-extrabold font-mono text-slate-300 mt-1">{opponentScore} pts</p>
            </div>
          </div>

          {/* Payout Info */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-sm">
            <span className="text-slate-400">Net Balance Payout:</span>
            <span className={`font-mono font-bold text-base ${
              matchWinner === 'USER' ? 'text-emerald-400' : matchWinner === 'TIE' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {matchWinner === 'USER' ? `+${payoutReceived}` : matchWinner === 'TIE' ? `+${payoutReceived}` : `-${selectedStake}`} Q-Coins
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                sounds.playChip();
                setDuelState('LOBBY');
              }}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Return to Lobby
            </button>

            <button
              onClick={() => handleStartDuel()}
              disabled={balance < selectedStake}
              className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              Rematch ({selectedStake})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
