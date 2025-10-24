// Savings System Implementation
// Based on your specifications: Basic (6%), Plus (12%), VIP (18%) annual interest

export interface SavingsAccount {
  id: string;
  userId: string;
  accountName: string;
  balance: number;
  interestRate: number; // Annual rate
  lockPeriod: number; // Months: 1, 3, 6, or 12
  createdAt: Date;
  maturityDate: Date;
  isActive: boolean;
  earlyWithdrawalPenalty: number; // 5% of principal
  totalInterestEarned: number;
  lastInterestCalculation: Date;
}

export interface SavingsTransaction {
  id: string;
  savingsAccountId: string;
  type: 'deposit' | 'withdrawal' | 'interest_payment' | 'early_withdrawal_penalty';
  amount: number;
  balance: number;
  timestamp: Date;
  description: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  isCompleted: boolean;
  createdAt: Date;
}

// Interest rates by premium tier
export const SAVINGS_INTEREST_RATES = {
  basic: 0.06, // 6% annual
  plus: 0.12,  // 12% annual
  vip: 0.18    // 18% annual
};

// Lock periods available
export const LOCK_PERIODS = [1, 3, 6, 12]; // months

// Minimum deposit amount
export const MINIMUM_DEPOSIT = 500; // KES 500

// Early withdrawal penalty
export const EARLY_WITHDRAWAL_PENALTY = 0.05; // 5% of principal

class SavingsSystem {
  // Create a new savings account
  async createSavingsAccount(
    userId: string,
    accountName: string,
    initialDeposit: number,
    lockPeriod: number,
    premiumTier: string = 'basic'
  ): Promise<SavingsAccount> {
    if (initialDeposit < MINIMUM_DEPOSIT) {
      throw new Error(`Minimum deposit is KES ${MINIMUM_DEPOSIT}`);
    }

    if (!LOCK_PERIODS.includes(lockPeriod)) {
      throw new Error('Invalid lock period. Must be 1, 3, 6, or 12 months');
    }

    const interestRate = SAVINGS_INTEREST_RATES[premiumTier as keyof typeof SAVINGS_INTEREST_RATES] || SAVINGS_INTEREST_RATES.basic;
    const now = new Date();
    const maturityDate = new Date(now.getTime() + lockPeriod * 30 * 24 * 60 * 60 * 1000);

    const savingsAccount: SavingsAccount = {
      id: `savings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      accountName,
      balance: initialDeposit,
      interestRate,
      lockPeriod,
      createdAt: now,
      maturityDate,
      isActive: true,
      earlyWithdrawalPenalty: initialDeposit * EARLY_WITHDRAWAL_PENALTY,
      totalInterestEarned: 0,
      lastInterestCalculation: now
    };

    // In a real implementation, save to database
    console.log('Created savings account:', savingsAccount);
    return savingsAccount;
  }

  // Calculate compound interest
  calculateCompoundInterest(
    principal: number,
    rate: number,
    timeInMonths: number
  ): number {
    // Monthly compound interest calculation
    const monthlyRate = rate / 12;
    const compoundInterest = principal * Math.pow(1 + monthlyRate, timeInMonths) - principal;
    return Math.round(compoundInterest * 100) / 100;
  }

  // Calculate interest for a savings account
  calculateInterest(savingsAccount: SavingsAccount): number {
    const now = new Date();
    const monthsElapsed = Math.floor(
      (now.getTime() - savingsAccount.lastInterestCalculation.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    if (monthsElapsed < 1) return 0;

    return this.calculateCompoundInterest(
      savingsAccount.balance,
      savingsAccount.interestRate,
      monthsElapsed
    );
  }

  // Add interest to savings account
  async addInterest(savingsAccount: SavingsAccount): Promise<SavingsAccount> {
    const interest = this.calculateInterest(savingsAccount);
    
    if (interest > 0) {
      savingsAccount.balance += interest;
      savingsAccount.totalInterestEarned += interest;
      savingsAccount.lastInterestCalculation = new Date();
    }

    return savingsAccount;
  }

  // Withdraw from savings account
  async withdrawFromSavings(
    savingsAccount: SavingsAccount,
    amount: number,
    isEarlyWithdrawal: boolean = false
  ): Promise<{ success: boolean; penalty?: number; message: string }> {
    if (amount > savingsAccount.balance) {
      return {
        success: false,
        message: 'Insufficient balance in savings account'
      };
    }

    const now = new Date();
    const isMatured = now >= savingsAccount.maturityDate;

    if (isEarlyWithdrawal && !isMatured) {
      const penalty = savingsAccount.balance * EARLY_WITHDRAWAL_PENALTY;
      const totalDeduction = amount + penalty;
      
      if (totalDeduction > savingsAccount.balance) {
        return {
          success: false,
          message: `Insufficient balance. Early withdrawal requires ${penalty.toFixed(2)} KES penalty`
        };
      }

      savingsAccount.balance -= totalDeduction;
      return {
        success: true,
        penalty,
        message: `Withdrawal successful. Early withdrawal penalty: ${penalty.toFixed(2)} KES`
      };
    }

    savingsAccount.balance -= amount;
    return {
      success: true,
      message: 'Withdrawal successful'
    };
  }

  // Get savings account summary
  getSavingsSummary(savingsAccount: SavingsAccount): {
    currentBalance: number;
    totalInterestEarned: number;
    projectedInterest: number;
    daysToMaturity: number;
    isMatured: boolean;
  } {
    const now = new Date();
    const daysToMaturity = Math.max(0, Math.ceil((savingsAccount.maturityDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    const isMatured = now >= savingsAccount.maturityDate;
    
    // Calculate projected interest if held to maturity
    const monthsToMaturity = Math.max(0, Math.ceil(daysToMaturity / 30));
    const projectedInterest = isMatured ? 0 : this.calculateCompoundInterest(
      savingsAccount.balance,
      savingsAccount.interestRate,
      monthsToMaturity
    );

    return {
      currentBalance: savingsAccount.balance,
      totalInterestEarned: savingsAccount.totalInterestEarned,
      projectedInterest,
      daysToMaturity,
      isMatured
    };
  }

  // Create savings goal
  async createSavingsGoal(
    userId: string,
    name: string,
    targetAmount: number,
    targetDate: Date
  ): Promise<SavingsGoal> {
    if (targetAmount <= 0) {
      throw new Error('Target amount must be greater than 0');
    }

    if (targetDate <= new Date()) {
      throw new Error('Target date must be in the future');
    }

    const savingsGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      targetAmount,
      currentAmount: 0,
      targetDate,
      isCompleted: false,
      createdAt: new Date()
    };

    console.log('Created savings goal:', savingsGoal);
    return savingsGoal;
  }

  // Update savings goal progress
  async updateSavingsGoal(
    goalId: string,
    additionalAmount: number
  ): Promise<SavingsGoal | null> {
    // In a real implementation, fetch from database
    const goal: SavingsGoal = {
      id: goalId,
      userId: 'user_id',
      name: 'Sample Goal',
      targetAmount: 10000,
      currentAmount: 0,
      targetDate: new Date(),
      isCompleted: false,
      createdAt: new Date()
    };

    goal.currentAmount += additionalAmount;
    goal.isCompleted = goal.currentAmount >= goal.targetAmount;

    return goal;
  }

  // Get all savings accounts for a user
  async getUserSavingsAccounts(userId: string): Promise<SavingsAccount[]> {
    // In a real implementation, fetch from database
    return [];
  }

  // Get all savings goals for a user
  async getUserSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    // In a real implementation, fetch from database
    return [];
  }

  // Calculate total savings value for loan eligibility
  calculateTotalSavingsValue(savingsAccounts: SavingsAccount[]): number {
    return savingsAccounts.reduce((total, account) => total + account.balance, 0);
  }

  // Get savings recommendations based on user profile
  getSavingsRecommendations(
    userBalance: number,
    monthlyIncome: number,
    premiumTier: string
  ): string[] {
    const recommendations: string[] = [];

    if (userBalance >= MINIMUM_DEPOSIT) {
      recommendations.push(`You can start a savings account with KES ${MINIMUM_DEPOSIT} minimum deposit`);
    }

    if (premiumTier === 'basic') {
      recommendations.push('Upgrade to Plus or VIP for higher interest rates (12% or 18% vs 6%)');
    }

    if (monthlyIncome > 0) {
      const recommendedSavings = monthlyIncome * 0.2; // 20% of income
      recommendations.push(`Consider saving KES ${recommendedSavings.toFixed(0)} monthly (20% of your income)`);
    }

    recommendations.push('Longer lock periods (6-12 months) offer better interest rates');
    recommendations.push('Early withdrawal incurs a 5% penalty - plan your savings carefully');

    return recommendations;
  }
}

// Export singleton instance
export const savingsSystem = new SavingsSystem();
export default savingsSystem;
