export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  walletBalance: number;
  savingsBalance: number;
  rewardPoints?: number;
  totalEarnedInterest: number;
  premiumStatus: boolean;
  premiumPlan?: string;
  premiumExpiry?: Date;
  referralsCount: number;
  referralEarnings: number;
  kycVerified: boolean;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  uid: string;
  type: 'send' | 'receive' | 'airtime' | 'data' | 'reward' | 'deposit' | 'withdrawal' | 'savings_deposit' | 'savings_withdrawal' | 'savings_interest' | 'referral_bonus' | 'subscription';
  amount: number;
  fee?: number;
  netAmount?: number;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  recipient?: string;
  sender?: string;
  method?: string;
  direction: '+' | '-';
}

export interface SavingsAccount {
  id: string;
  uid: string;
  principal: number;
  lockPeriod: number; // in months
  annualInterestRate: number;
  startDate: Date;
  maturityDate: Date;
  status: 'active' | 'matured' | 'withdrawn';
  currentValue?: number;
  earnedInterest?: number;
}

export interface PremiumSubscription {
  uid: string;
  isActive: boolean;
  plan: 'basic' | 'plus' | 'vip';
  startDate: Date;
  expiryDate: Date;
  lastPayment: number;
  autoRenew: boolean;
}

export interface FeeBreakdown {
  percentageFee: number;
  fixedFee: number;
  totalFee: number;
  netAmount: number;
  feeRule: any;
}