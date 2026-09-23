export type Category = 
  | 'All'
  | 'Tech & AI' 
  | 'Science & Space' 
  | 'World History' 
  | 'Pop Culture & Film' 
  | 'Sports & Gaming' 
  | 'Finance & Crypto';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mastermind';

export interface TriviaQuestion {
  id: string;
  category: Category;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timeLimitSeconds: number;
  basePoints: number;
}

export interface PlayerStats {
  balance: number;
  totalWon: number;
  totalLost: number;
  matchesPlayed: number;
  matchesWon: number;
  winStreak: number;
  highestPayout: number;
}

export interface BetTransaction {
  id: string;
  timestamp: number;
  type: 'DUEL' | 'CONFIDENCE_SOLO' | 'PREDICTION_MARKET' | 'AI_ARENA' | 'FAUCET';
  description: string;
  amount: number;
  payout: number;
  status: 'WON' | 'LOST' | 'PENDING';
  odds?: number;
}

export interface PredictionMarket {
  id: string;
  title: string;
  category: string;
  description: string;
  endTime: number;
  options: {
    id: string;
    label: string;
    odds: number;
    poolVolume: number;
  }[];
  totalPool: number;
  resolved: boolean;
  winningOptionId?: string;
}

export interface UserMarketBet {
  id: string;
  marketId: string;
  marketTitle: string;
  optionId: string;
  optionLabel: string;
  odds: number;
  wagerAmount: number;
  placedAt: number;
  resolved: boolean;
  won?: boolean;
  payout?: number;
}

export interface DuelOpponent {
  id: string;
  name: string;
  title: string;
  avatarSeed: string;
  winRate: number;
  streak: number;
  speedRating: 'Fast' | 'Calculated' | 'Steady';
}

export interface DuelRoom {
  id: string;
  stake: number;
  category: Category;
  opponent: DuelOpponent;
  roundsCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarSeed: string;
  balance: number;
  winRate: number;
  streak: number;
  badge: string;
}
