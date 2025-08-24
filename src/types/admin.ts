export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  createdAt: Date;
}

export interface RevenueRecord {
  id: string;
  type: 'transaction_fee' | 'premium_subscription' | 'withdrawal_fee' | 'merchant_fee' | 'loan_interest' | 'savings_interest' | 'reward_points' | 'cashback' | 'early_withdrawal_penalty';
  amount: number;
  sourceTransactionId?: string;
  sourceUserId: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'collected' | 'failed';
  category: 'revenue' | 'expense';
}

export interface AdminWallet {
  uid: string;
  balance: number;
  totalRevenue: number;
  totalExpenses: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  dailyRevenue: number;
  dailyExpenses: number;
  lastUpdated: Date;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionSize: number;
  conversionRate: number;
  totalSavings: number;
  totalLoansIssued: number;
  totalLoanValue: number;
  overdueLoans: number;
  totalExpenses: number;
  aiAssistantUsage: number;
}

export interface LoanStats {
  totalBorrowed: number;
  loanInterestEarned: number;
  overdueLoans: number;
  repaymentRate: number;
  averageLoanAmount: number;
}

export interface SavingsStats {
  totalSavingsAcrossUsers: number;
  interestLiabilities: number;
  emergencyWithdrawalRequests: number;
  averageSavingsAmount: number;
}