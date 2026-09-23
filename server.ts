import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import type { 
  TriviaQuestion, 
  PlayerStats, 
  BetTransaction, 
  PredictionMarket, 
  UserMarketBet, 
  DuelOpponent, 
  LeaderboardEntry,
  Category 
} from './src/types/quiz.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-Memory Database Store
let userStats: PlayerStats = {
  balance: 1250,
  totalWon: 4200,
  totalLost: 2950,
  matchesPlayed: 18,
  matchesWon: 12,
  winStreak: 3,
  highestPayout: 900
};

let transactions: BetTransaction[] = [
  {
    id: 'tx-1',
    timestamp: Date.now() - 3600000 * 5,
    type: 'DUEL',
    description: 'Duel vs CyberSage (Category: Tech & AI)',
    amount: 250,
    payout: 500,
    status: 'WON',
    odds: 2.0
  },
  {
    id: 'tx-2',
    timestamp: Date.now() - 3600000 * 3,
    type: 'CONFIDENCE_SOLO',
    description: 'High Roller Round 4 (Multiplier 3x)',
    amount: 150,
    payout: 450,
    status: 'WON',
    odds: 3.0
  },
  {
    id: 'tx-3',
    timestamp: Date.now() - 3600000 * 2,
    type: 'PREDICTION_MARKET',
    description: 'Wagered on: Human Master in Chess Trivia Faceoff',
    amount: 200,
    payout: 0,
    status: 'LOST',
    odds: 2.2
  },
  {
    id: 'tx-4',
    timestamp: Date.now() - 3600000 * 1,
    type: 'DUEL',
    description: 'Duel vs TriviaQueen (Category: Pop Culture)',
    amount: 100,
    payout: 200,
    status: 'WON',
    odds: 2.0
  }
];

const PRELOADED_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'q-1',
    category: 'Tech & AI',
    difficulty: 'Medium',
    question: 'In transformer deep learning models, what does the acronym "RLHF" stand for?',
    options: [
      'Reinforcement Learning from Human Feedback',
      'Recursive Logic with Heuristic Filtering',
      'Residual Layer High-Frequency Tuning',
      'Real-time Latency Hardware Framework'
    ],
    correctIndex: 0,
    explanation: 'RLHF (Reinforcement Learning from Human Feedback) uses human preferences to fine-tune AI models for safety and instruction-following.',
    timeLimitSeconds: 15,
    basePoints: 200
  },
  {
    id: 'q-2',
    category: 'Tech & AI',
    difficulty: 'Hard',
    question: 'Which company developed the breakthrough AlphaFold AI system for predicting 3D protein structures?',
    options: ['OpenAI', 'DeepMind', 'Anthropic', 'Meta FAIR'],
    correctIndex: 1,
    explanation: 'DeepMind released AlphaFold in 2020, revolutionizing molecular biology and structural proteomics.',
    timeLimitSeconds: 15,
    basePoints: 300
  },
  {
    id: 'q-3',
    category: 'Science & Space',
    difficulty: 'Medium',
    question: 'What is the theoretical boundary around a black hole beyond which nothing, not even light, can escape?',
    options: ['Ergosphere', 'Schwarzschild Radius', 'Event Horizon', 'Accretion Disk'],
    correctIndex: 2,
    explanation: 'The event horizon marks the point of no return where the escape velocity strictly exceeds the speed of light.',
    timeLimitSeconds: 15,
    basePoints: 200
  },
  {
    id: 'q-4',
    category: 'Science & Space',
    difficulty: 'Hard',
    question: 'James Webb Space Telescope (JWST) orbits around which Sun-Earth gravitational Lagrange point?',
    options: ['L1 Point', 'L2 Point', 'L4 Point', 'L5 Point'],
    correctIndex: 1,
    explanation: 'JWST orbits the second Sun-Earth Lagrange point (L2), approximately 1.5 million kilometers away from Earth.',
    timeLimitSeconds: 15,
    basePoints: 300
  },
  {
    id: 'q-5',
    category: 'World History',
    difficulty: 'Medium',
    question: 'In what year did the Apollo 11 mission land the first humans on the Moon?',
    options: ['1967', '1969', '1971', '1973'],
    correctIndex: 1,
    explanation: 'Apollo 11 touched down on the lunar surface on July 20, 1969.',
    timeLimitSeconds: 15,
    basePoints: 200
  },
  {
    id: 'q-6',
    category: 'World History',
    difficulty: 'Hard',
    question: 'Which ancient library, one of the largest and most significant of the ancient world, was situated in Ptolemaic Egypt?',
    options: ['Library of Celsus', 'Library of Ashurbanipal', 'Library of Alexandria', 'Library of Pergamum'],
    correctIndex: 2,
    explanation: 'The Great Library of Alexandria was dedicated to the Muses and flourished under the Ptolemaic dynasty.',
    timeLimitSeconds: 15,
    basePoints: 250
  },
  {
    id: 'q-7',
    category: 'Pop Culture & Film',
    difficulty: 'Easy',
    question: 'Which 2023 movie directed by Christopher Nolan swept the Academy Awards with seven Oscars, including Best Picture?',
    options: ['Barbie', 'Oppenheimer', 'Killers of the Flower Moon', 'Poor Things'],
    correctIndex: 1,
    explanation: 'Oppenheimer won Best Picture, Best Director (Nolan), Best Actor (Cillian Murphy), and Best Supporting Actor (Robert Downey Jr.).',
    timeLimitSeconds: 12,
    basePoints: 150
  },
  {
    id: 'q-8',
    category: 'Pop Culture & Film',
    difficulty: 'Medium',
    question: 'In the fictional universe of Dune, what rare substance is essential for interstellar space navigation?',
    options: ['Tiberium', 'Unobtainium', 'Melange (The Spice)', 'Kyber Crystals'],
    correctIndex: 2,
    explanation: 'Melange (The Spice), harvested only on the desert planet Arrakis, grants the Guild Navigators the prescience needed to fold space.',
    timeLimitSeconds: 15,
    basePoints: 200
  },
  {
    id: 'q-9',
    category: 'Sports & Gaming',
    difficulty: 'Easy',
    question: 'Which country won the FIFA Men\'s World Cup 2022 in Qatar led by Lionel Messi?',
    options: ['France', 'Brazil', 'Argentina', 'Croatia'],
    correctIndex: 2,
    explanation: 'Argentina defeated France on penalties in one of the most thrilling World Cup finals in history.',
    timeLimitSeconds: 12,
    basePoints: 150
  },
  {
    id: 'q-10',
    category: 'Sports & Gaming',
    difficulty: 'Hard',
    question: 'In competitive League of Legends, which legendary mid-laner has won a record 4 World Championship titles with T1?',
    options: ['Caps', 'Faker (Lee Sang-hyeok)', 'Rookie', 'ShowMaker'],
    correctIndex: 1,
    explanation: 'Faker won Worlds in 2013, 2015, 2016, and 2023, earning the moniker "The Unkillable Demon King".',
    timeLimitSeconds: 15,
    basePoints: 300
  },
  {
    id: 'q-11',
    category: 'Finance & Crypto',
    difficulty: 'Medium',
    question: 'What is the maximum supply limit of Bitcoin that will ever be minted into existence?',
    options: ['18,000,000', '21,000,000', '100,000,000', 'Infinite Supply'],
    correctIndex: 1,
    explanation: 'Satoshi Nakamoto hardcoded a maximum cap of 21 million Bitcoins into the protocol.',
    timeLimitSeconds: 15,
    basePoints: 200
  },
  {
    id: 'q-12',
    category: 'Finance & Crypto',
    difficulty: 'Hard',
    question: 'What financial term describes when short-term treasury bond yields exceed long-term bond yields, historically signaling a recession?',
    options: ['Bull Steepener', 'Inverted Yield Curve', 'Liquidity Trap', 'Contango Shift'],
    correctIndex: 1,
    explanation: 'An inverted yield curve occurs when shorter-maturity debt instruments pay higher interest than longer-term instruments of equal quality.',
    timeLimitSeconds: 15,
    basePoints: 300
  }
];

let predictionMarkets: PredictionMarket[] = [
  {
    id: 'mkt-1',
    title: 'World Trivia Superbowl: AI Challenger vs Grandmaster Alex',
    category: 'Esports & AI',
    description: 'Will the AI challenger outscore human Grandmaster Alex in the 100-question blitz trivia championship?',
    endTime: Date.now() + 86400000 * 2,
    options: [
      { id: 'opt-ai', label: 'AI Challenger Wins', odds: 1.72, poolVolume: 14200 },
      { id: 'opt-human', label: 'Grandmaster Alex Wins', odds: 2.15, poolVolume: 11800 }
    ],
    totalPool: 26000,
    resolved: false
  },
  {
    id: 'mkt-2',
    title: 'High Roller Gauntlet: Will any player hit a 10-Question Streak today?',
    category: 'Arena Records',
    description: 'Market settles YES if at least one player achieves an unbroken 10/10 streak on Mastermind difficulty in the solo arena.',
    endTime: Date.now() + 86400000,
    options: [
      { id: 'opt-yes', label: 'YES (10+ Streak Occurs)', odds: 2.85, poolVolume: 8400 },
      { id: 'opt-no', label: 'NO (No Player Hits 10)', odds: 1.45, poolVolume: 16500 }
    ],
    totalPool: 24900,
    resolved: false
  },
  {
    id: 'mkt-3',
    title: 'Science & Physics Championship: Winner Category Score',
    category: 'Science Trivia',
    description: 'Will the winning finalist answer the tie-breaker quantum entanglement question correctly in under 6 seconds?',
    endTime: Date.now() + 86400000 * 3,
    options: [
      { id: 'opt-fast', label: 'Correct in < 6.0 seconds', odds: 2.30, poolVolume: 6100 },
      { id: 'opt-slow', label: 'Takes ≥ 6.0s or Misses', odds: 1.60, poolVolume: 9200 }
    ],
    totalPool: 15300,
    resolved: false
  }
];

let userBets: UserMarketBet[] = [
  {
    id: 'ub-1',
    marketId: 'mkt-1',
    marketTitle: 'World Trivia Superbowl: AI Challenger vs Grandmaster Alex',
    optionId: 'opt-ai',
    optionLabel: 'AI Challenger Wins',
    odds: 1.72,
    wagerAmount: 200,
    placedAt: Date.now() - 7200000,
    resolved: false
  }
];

const BOT_OPPONENTS: DuelOpponent[] = [
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

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'VortexMind', avatarSeed: 'vortex', balance: 34200, winRate: 82, streak: 9, badge: 'Grandmaster' },
  { rank: 2, username: 'Atlas_Trivia', avatarSeed: 'atlas', balance: 28450, winRate: 78, streak: 6, badge: 'High Roller' },
  { rank: 3, username: 'CyberSage_99', avatarSeed: 'sage', balance: 24100, winRate: 74, streak: 5, badge: 'Mastermind' },
  { rank: 4, username: 'TriviaQueen_X', avatarSeed: 'queen', balance: 19800, winRate: 69, streak: 4, badge: 'Duelist' },
  { rank: 5, username: 'You (Player)', avatarSeed: 'player', balance: userStats.balance, winRate: Math.round((userStats.matchesWon / (userStats.matchesPlayed || 1)) * 100), streak: userStats.winStreak, badge: 'Veteran' },
  { rank: 6, username: 'Chronos_77', avatarSeed: 'chronos', balance: 11200, winRate: 64, streak: 3, badge: 'Contender' },
  { rank: 7, username: 'PixelBettor', avatarSeed: 'pixel', balance: 9400, winRate: 61, streak: 2, badge: 'Contender' },
  { rank: 8, username: 'KryptonIQ', avatarSeed: 'krypton', balance: 7800, winRate: 57, streak: 1, badge: 'Novice' }
];

// API ROUTES

// 1. User state
app.get('/api/user', (_req, res) => {
  // Update rank 5 on leaderboard to match current user
  const playerEntry = LEADERBOARD.find(e => e.username.includes('You'));
  if (playerEntry) {
    playerEntry.balance = userStats.balance;
    playerEntry.winRate = Math.round((userStats.matchesWon / Math.max(userStats.matchesPlayed, 1)) * 100);
    playerEntry.streak = userStats.winStreak;
  }

  res.json({
    stats: userStats,
    recentTransactions: transactions.slice(0, 15)
  });
});

// 2. Faucet (daily chips refill)
app.post('/api/user/faucet', (_req, res) => {
  const refillAmount = 500;
  userStats.balance += refillAmount;

  const tx: BetTransaction = {
    id: `tx-${Date.now()}`,
    timestamp: Date.now(),
    type: 'FAUCET',
    description: 'Claimed Daily Bankroll Grant',
    amount: refillAmount,
    payout: refillAmount,
    status: 'WON'
  };

  transactions.unshift(tx);
  res.json({ success: true, balance: userStats.balance, message: `Added ${refillAmount} Q-Coins to bankroll!` });
});

// 3. Question Bank for Matches & Solo
app.get('/api/questions/random', (req, res) => {
  const count = parseInt(req.query.count as string) || 5;
  const category = (req.query.category as Category) || 'All';
  
  let pool = [...PRELOADED_QUESTIONS];
  if (category && category !== 'All') {
    pool = pool.filter(q => q.category === category);
    if (pool.length === 0) pool = [...PRELOADED_QUESTIONS];
  }

  // Shuffle and pick
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // Return questions with correct answers obscured for client play, server will verify
  const clientSafe = selected.map(q => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    timeLimitSeconds: q.timeLimitSeconds,
    basePoints: q.basePoints
  }));

  res.json({ questions: clientSafe });
});

// 4. Submit Answer / Verify
app.post('/api/match/submit-answer', (req, res) => {
  const { questionId, selectedIndex, wagerMultiplier = 1, baseWager = 0, timeRemaining = 0 } = req.body;

  const question = PRELOADED_QUESTIONS.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const isCorrect = question.correctIndex === selectedIndex;
  let earnedPayout = 0;
  let netChange = 0;

  if (baseWager > 0) {
    const totalWager = baseWager * wagerMultiplier;
    if (isCorrect) {
      // Speed bonus: +10% if answered in first half of time limit
      const speedMultiplier = timeRemaining > (question.timeLimitSeconds / 2) ? 1.15 : 1.0;
      earnedPayout = Math.round(totalWager * 2.0 * speedMultiplier);
      netChange = earnedPayout - totalWager;
      userStats.balance += earnedPayout;
      userStats.totalWon += netChange;
      userStats.winStreak += 1;
      if (earnedPayout > userStats.highestPayout) {
        userStats.highestPayout = earnedPayout;
      }

      transactions.unshift({
        id: `tx-${Date.now()}`,
        timestamp: Date.now(),
        type: 'CONFIDENCE_SOLO',
        description: `Confidence Bet Won (${wagerMultiplier}x Multiplier)`,
        amount: totalWager,
        payout: earnedPayout,
        status: 'WON',
        odds: Number((earnedPayout / totalWager).toFixed(2))
      });
    } else {
      netChange = -totalWager;
      userStats.totalLost += totalWager;
      userStats.winStreak = 0;

      transactions.unshift({
        id: `tx-${Date.now()}`,
        timestamp: Date.now(),
        type: 'CONFIDENCE_SOLO',
        description: `Confidence Bet Lost (${wagerMultiplier}x Multiplier)`,
        amount: totalWager,
        payout: 0,
        status: 'LOST',
        odds: wagerMultiplier * 2
      });
    }
  }

  res.json({
    isCorrect,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    earnedPayout,
    netChange,
    newBalance: userStats.balance,
    winStreak: userStats.winStreak
  });
});

// 5. Duel Matchmaking & Resolution
app.get('/api/duels/lobby', (_req, res) => {
  res.json({
    opponents: BOT_OPPONENTS,
    activeStakes: [50, 100, 250, 500, 1000]
  });
});

app.post('/api/duels/start', (req, res) => {
  const { stake, category, opponentId } = req.body;
  const stakeNum = parseInt(stake) || 100;

  if (userStats.balance < stakeNum) {
    return res.status(400).json({ error: 'Insufficient Q-Coins balance to enter duel.' });
  }

  // Deduct stake upfront to commit
  userStats.balance -= stakeNum;

  const opponent = BOT_OPPONENTS.find(b => b.id === opponentId) || BOT_OPPONENTS[0];
  const pot = stakeNum * 2;

  // Filter or pick 5 questions
  let pool = [...PRELOADED_QUESTIONS];
  if (category && category !== 'All') {
    pool = pool.filter(q => q.category === category);
    if (pool.length < 5) pool = [...PRELOADED_QUESTIONS];
  }
  const questions = pool.sort(() => 0.5 - Math.random()).slice(0, 5);

  const matchSession = {
    matchId: `duel-${Date.now()}`,
    stake: stakeNum,
    pot,
    category: category || 'All',
    opponent,
    questions: questions.map(q => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex, // included for duel server verification
      explanation: q.explanation,
      timeLimitSeconds: q.timeLimitSeconds,
      basePoints: q.basePoints
    }))
  };

  res.json({ success: true, matchSession, newBalance: userStats.balance });
});

app.post('/api/duels/finish', (req, res) => {
  const { matchId, stake, userScore, opponentScore, opponentName } = req.body;
  const stakeNum = parseInt(stake) || 100;
  const pot = stakeNum * 2;

  const playerWon = userScore > opponentScore;
  const isTie = userScore === opponentScore;

  userStats.matchesPlayed += 1;

  if (playerWon) {
    userStats.matchesWon += 1;
    userStats.balance += pot;
    userStats.totalWon += stakeNum;
    userStats.winStreak += 1;
    if (pot > userStats.highestPayout) {
      userStats.highestPayout = pot;
    }

    transactions.unshift({
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
      type: 'DUEL',
      description: `Victory vs ${opponentName} (${userScore} - ${opponentScore})`,
      amount: stakeNum,
      payout: pot,
      status: 'WON',
      odds: 2.0
    });
  } else if (isTie) {
    // Return stake
    userStats.balance += stakeNum;
    transactions.unshift({
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
      type: 'DUEL',
      description: `Push / Draw vs ${opponentName} (${userScore} - ${opponentScore})`,
      amount: stakeNum,
      payout: stakeNum,
      status: 'WON',
      odds: 1.0
    });
  } else {
    userStats.totalLost += stakeNum;
    userStats.winStreak = 0;

    transactions.unshift({
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
      type: 'DUEL',
      description: `Defeat vs ${opponentName} (${userScore} - ${opponentScore})`,
      amount: stakeNum,
      payout: 0,
      status: 'LOST',
      odds: 2.0
    });
  }

  res.json({
    success: true,
    playerWon,
    isTie,
    payout: playerWon ? pot : isTie ? stakeNum : 0,
    newBalance: userStats.balance,
    winStreak: userStats.winStreak
  });
});

// 6. Prediction Markets
app.get('/api/markets', (_req, res) => {
  res.json({
    markets: predictionMarkets,
    userBets
  });
});

app.post('/api/markets/bet', (req, res) => {
  const { marketId, optionId, amount } = req.body;
  const wagerAmount = parseInt(amount) || 50;

  if (userStats.balance < wagerAmount) {
    return res.status(400).json({ error: 'Insufficient balance to place prediction bet.' });
  }

  const market = predictionMarkets.find(m => m.id === marketId);
  if (!market || market.resolved) {
    return res.status(400).json({ error: 'Market is closed or not found.' });
  }

  const option = market.options.find(o => o.id === optionId);
  if (!option) {
    return res.status(404).json({ error: 'Selected outcome option not found.' });
  }

  // Deduct from user
  userStats.balance -= wagerAmount;
  option.poolVolume += wagerAmount;
  market.totalPool += wagerAmount;

  const newBet: UserMarketBet = {
    id: `bet-${Date.now()}`,
    marketId: market.id,
    marketTitle: market.title,
    optionId: option.id,
    optionLabel: option.label,
    odds: option.odds,
    wagerAmount,
    placedAt: Date.now(),
    resolved: false
  };

  userBets.unshift(newBet);

  transactions.unshift({
    id: `tx-${Date.now()}`,
    timestamp: Date.now(),
    type: 'PREDICTION_MARKET',
    description: `Market Bet: ${option.label} (${option.odds}x)`,
    amount: wagerAmount,
    payout: 0,
    status: 'PENDING',
    odds: option.odds
  });

  res.json({
    success: true,
    newBet,
    newBalance: userStats.balance,
    market
  });
});

app.post('/api/markets/resolve', (req, res) => {
  const { marketId, winningOptionId } = req.body;
  const market = predictionMarkets.find(m => m.id === marketId);
  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  market.resolved = true;
  market.winningOptionId = winningOptionId;

  // Settle all pending bets on this market
  let totalWinningsClaimed = 0;
  userBets.forEach(bet => {
    if (bet.marketId === marketId && !bet.resolved) {
      bet.resolved = true;
      if (bet.optionId === winningOptionId) {
        bet.won = true;
        bet.payout = Math.round(bet.wagerAmount * bet.odds);
        totalWinningsClaimed += bet.payout;
        userStats.balance += bet.payout;
        userStats.totalWon += (bet.payout - bet.wagerAmount);

        // Update transaction if found
        const tx = transactions.find(t => t.description.includes(bet.optionLabel) && t.status === 'PENDING');
        if (tx) {
          tx.status = 'WON';
          tx.payout = bet.payout;
        }
      } else {
        bet.won = false;
        bet.payout = 0;
        userStats.totalLost += bet.wagerAmount;
        const tx = transactions.find(t => t.description.includes(bet.optionLabel) && t.status === 'PENDING');
        if (tx) {
          tx.status = 'LOST';
        }
      }
    }
  });

  res.json({
    success: true,
    market,
    totalWinningsClaimed,
    newBalance: userStats.balance
  });
});

// 7. Leaderboard
app.get('/api/leaderboard', (_req, res) => {
  // Sort leaderboard by balance desc
  const sorted = [...LEADERBOARD].sort((a, b) => b.balance - a.balance);
  sorted.forEach((item, idx) => {
    item.rank = idx + 1;
  });
  res.json({ leaderboard: sorted });
});

// 8. Gemini AI Quiz Generator
app.post('/api/ai/generate-quiz', async (req, res) => {
  const { topic, difficulty = 'Hard', stake = 100 } = req.body;
  const targetTopic = topic || 'Artificial Intelligence & Machine Learning';

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('No GEMINI_API_KEY provided');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    const prompt = `You are the master quizmaker for an elite trivia wagering arena called QuizBets.
Generate exactly 5 high-quality, authentic trivia questions about the topic: "${targetTopic}".
Difficulty level: ${difficulty}.
Return ONLY a valid JSON array of objects without Markdown formatting or explanations.
Each object must have this exact structure:
[
  {
    "id": "ai-1",
    "category": "Tech & AI",
    "difficulty": "${difficulty}",
    "question": "Clear, engaging trivia question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief 1-line fascinating reason why this answer is correct.",
    "timeLimitSeconds": 15,
    "basePoints": 250
  }
]`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let responseText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr) {
        console.warn(`Model ${modelName} failed, trying next candidate:`, modelErr instanceof Error ? modelErr.message : String(modelErr));
      }
    }

    if (!responseText) {
      throw new Error('All Gemini model candidates failed to return response');
    }

    const parsed = JSON.parse(responseText);

    if (Array.isArray(parsed) && parsed.length >= 3) {
      // Add unique IDs
      const formatted = parsed.map((item, i) => ({
        ...item,
        id: `ai-${Date.now()}-${i}`,
        correctIndex: typeof item.correctIndex === 'number' ? item.correctIndex : 0,
        options: Array.isArray(item.options) ? item.options : ['A', 'B', 'C', 'D'],
        timeLimitSeconds: 15,
        basePoints: difficulty === 'Mastermind' ? 400 : difficulty === 'Hard' ? 300 : 200
      }));

      // Add to preloaded questions in memory so they can be verified
      formatted.forEach(q => PRELOADED_QUESTIONS.push(q));

      return res.json({
        success: true,
        topic: targetTopic,
        difficulty,
        stake: parseInt(stake) || 100,
        questions: formatted
      });
    }
    throw new Error('Invalid JSON format from AI');
  } catch (err: unknown) {
    console.warn('AI generation fallback triggered:', err instanceof Error ? err.message : String(err));
    
    // Algorithmic intelligent fallback tailored to topic
    const fallbackQuestions: TriviaQuestion[] = [
      {
        id: `ai-fb-${Date.now()}-1`,
        category: 'Tech & AI',
        difficulty: difficulty as any,
        question: `Regarding ${targetTopic}: Which fundamental breakthrough or foundational model pioneered modern attention mechanisms?`,
        options: [
          'Vaswani et al. (Attention Is All You Need)',
          'Hinton et al. (AlexNet Convolutional Nets)',
          'LeCun et al. (LeNet Document Recognition)',
          'Silver et al. (AlphaGo Monte Carlo Search)'
        ],
        correctIndex: 0,
        explanation: 'The 2017 paper "Attention Is All You Need" introduced the Transformer architecture, replacing recurrent and convolutional layers with self-attention.',
        timeLimitSeconds: 15,
        basePoints: 300
      },
      {
        id: `ai-fb-${Date.now()}-2`,
        category: 'Tech & AI',
        difficulty: difficulty as any,
        question: `In advanced research on ${targetTopic}, what concept describes a model retaining high performance on new tasks without catastrophic forgetting?`,
        options: [
          'Continual & Lifelong Learning',
          'Quantization-Aware Training',
          'Stochastic Gradient Collapse',
          'Greedy Token Decoding'
        ],
        correctIndex: 0,
        explanation: 'Continual learning focuses on updating neural networks sequentially while preventing catastrophic forgetting of previous domain knowledge.',
        timeLimitSeconds: 15,
        basePoints: 300
      },
      {
        id: `ai-fb-${Date.now()}-3`,
        category: 'Tech & AI',
        difficulty: difficulty as any,
        question: `When deploying high-throughput models for ${targetTopic}, which technique compresses weights into 4-bit or 8-bit integers?`,
        options: [
          'LoRA Low-Rank Adaptation',
          'Post-Training Quantization (PTQ)',
          'Mixture of Experts Routing',
          'Context Window Caching'
        ],
        correctIndex: 1,
        explanation: 'Quantization reduces numerical precision of weights and activations, drastically decreasing memory bandwidth and latency.',
        timeLimitSeconds: 15,
        basePoints: 300
      },
      {
        id: `ai-fb-${Date.now()}-4`,
        category: 'Science & Space',
        difficulty: difficulty as any,
        question: `What fundamental law governs the relationship between computational capability and thermal dissipation limits?`,
        options: [
          'Landauer\'s Principle',
          'Moore\'s Observation',
          'Amdahl\'s Speedup Law',
          'Metcalfe\'s Network Law'
        ],
        correctIndex: 0,
        explanation: 'Landauer\'s principle establishes the minimum possible amount of energy required to erase one bit of information (kT ln 2).',
        timeLimitSeconds: 15,
        basePoints: 350
      },
      {
        id: `ai-fb-${Date.now()}-5`,
        category: 'Sports & Gaming',
        difficulty: difficulty as any,
        question: `In high-stakes competitive game theory, what state occurs when no player can benefit by unilaterally changing strategy?`,
        options: [
          'Pareto Optimum',
          'Nash Equilibrium',
          'Minimax Saddle Point',
          'Zero-Sum Parity'
        ],
        correctIndex: 1,
        explanation: 'In a Nash Equilibrium, each player is assuming the other players\' strategies and has no incentive to deviate on their own.',
        timeLimitSeconds: 15,
        basePoints: 350
      }
    ];

    fallbackQuestions.forEach(q => PRELOADED_QUESTIONS.push(q));

    return res.json({
      success: true,
      topic: targetTopic,
      difficulty,
      stake: parseInt(stake) || 100,
      questions: fallbackQuestions
    });
  }
});

// Full stack serving: Vite middlewares in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`QuizBets Full-Stack Server listening on port ${port}`);
  });
}

startServer();
