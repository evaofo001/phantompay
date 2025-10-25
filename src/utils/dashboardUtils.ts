// Dashboard Utilities for Dynamic Personalization

export interface DashboardWidget {
  id: string;
  type: 'balance' | 'transactions' | 'savings' | 'loans' | 'achievements' | 'quick_actions' | 'insights' | 'goals' | 'airtime';
  title: string;
  data: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  isVisible: boolean;
  isCustomizable: boolean;
  lastUpdated: Date;
}

export interface QuickAction {
  id: string;
  name: string;
  href: string;
  icon: string;
  color: string;
  description: string;
  isEnabled: boolean;
  frequency: number; // how often user uses this action
  lastUsed?: Date;
  category: 'transfer' | 'deposit' | 'withdraw' | 'savings' | 'loans' | 'utilities' | 'premium' | 'airtime' | 'data';
}

export interface DashboardInsight {
  id: string;
  type: 'spending' | 'savings' | 'income' | 'goals' | 'premium' | 'security';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  action?: {
    text: string;
    href: string;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: 'emergency' | 'vacation' | 'education' | 'home' | 'retirement' | 'other';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dynamic quick actions based on user behavior
export const getPersonalizedQuickActions = async (): Promise<QuickAction[]> => {
  // In a real implementation, this would analyze user behavior and preferences
  const allActions: QuickAction[] = [
    {
      id: 'transfer',
      name: 'Transfer',
      href: '/transfer',
      icon: 'Send',
      color: 'from-blue-500 to-blue-600',
      description: 'Send money',
      isEnabled: true,
      frequency: 0.8, // 80% of users use this
      category: 'transfer'
    },
    {
      id: 'deposit',
      name: 'Deposit',
      href: '/deposit',
      icon: 'Plus',
      color: 'from-green-500 to-green-600',
      description: 'Add money',
      isEnabled: true,
      frequency: 0.6,
      category: 'deposit'
    },
    {
      id: 'withdraw',
      name: 'Withdraw',
      href: '/withdraw',
      icon: 'Minus',
      color: 'from-red-500 to-red-600',
      description: 'Cash out',
      isEnabled: true,
      frequency: 0.4,
      category: 'withdraw'
    },
    {
      id: 'savings',
      name: 'Savings',
      href: '/savings',
      icon: 'PiggyBank',
      color: 'from-emerald-500 to-emerald-600',
      description: 'Save money',
      isEnabled: true,
      frequency: 0.5,
      category: 'savings'
    },
    {
      id: 'loans',
      name: 'Loans',
      href: '/loans',
      icon: 'Target',
      color: 'from-green-500 to-green-600',
      description: 'Get loans',
      isEnabled: true,
      frequency: 0.3,
      category: 'loans'
    },
    {
      id: 'airtime',
      name: 'Airtime',
      href: '/airtime',
      icon: 'Smartphone',
      color: 'from-orange-500 to-orange-600',
      description: 'Buy airtime',
      isEnabled: true,
      frequency: 0.7,
      category: 'airtime'
    },
    {
      id: 'data',
      name: 'Data',
      href: '/data',
      icon: 'Wifi',
      color: 'from-indigo-500 to-indigo-600',
      description: 'Buy data bundle',
      isEnabled: true,
      frequency: 0.6,
      category: 'data'
    },
    {
      id: 'qr_pay',
      name: 'QR Pay',
      href: '/qr-pay',
      icon: 'QrCode',
      color: 'from-purple-500 to-purple-600',
      description: 'QR payments',
      isEnabled: true,
      frequency: 0.2,
      category: 'transfer'
    },
    {
      id: 'eva',
      name: 'EVA',
      href: '/ai-assistant',
      icon: 'Brain',
      color: 'from-indigo-500 to-purple-600',
      description: 'AI Financial Organism',
      isEnabled: true,
      frequency: 0.4,
      category: 'premium'
    }
  ];

  // Sort by frequency and return top 6-8 actions
  return allActions
    .filter(action => action.isEnabled)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8);
};

// Generate personalized insights
export const generateDashboardInsights = async (
  userId: string,
  userData: {
    balance: number;
    savingsBalance: number;
    transactions: Array<{
      direction: string;
      amount: number;
      category?: string;
    }>;
    premiumStatus: boolean;
    goals: FinancialGoal[];
  }
): Promise<DashboardInsight[]> => {
  const insights: DashboardInsight[] = [];

  // Spending insights
  const recentTransactions = userData.transactions.slice(0, 10);
  const totalSpent = recentTransactions
    .filter(t => t.direction === '-')
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalSpent > userData.balance * 0.8) {
    insights.push({
      id: 'high_spending',
      type: 'spending',
      title: 'High Spending Alert',
      message: `You've spent ${(totalSpent / userData.balance * 100).toFixed(1)}% of your balance this week. Consider setting a budget.`,
      severity: 'warning',
      action: {
        text: 'Set Budget',
        href: '/settings'
      },
      createdAt: new Date()
    });
  }

  // Savings insights
  if (userData.savingsBalance === 0) {
    insights.push({
      id: 'no_savings',
      type: 'savings',
      title: 'Start Saving Today',
      message: 'You haven\'t started saving yet. Even small amounts can grow significantly over time.',
      severity: 'info',
      action: {
        text: 'Create Savings Account',
        href: '/savings'
      },
      createdAt: new Date()
    });
  }

  // Premium upgrade insights
  if (!userData.premiumStatus && userData.savingsBalance > 10000) {
    insights.push({
      id: 'premium_upgrade',
      type: 'premium',
      title: 'Unlock Higher Returns',
      message: `With ${userData.savingsBalance.toLocaleString()} KES in savings, you could earn more with Premium.`,
      severity: 'info',
      action: {
        text: 'Upgrade Now',
        href: '/premium'
      },
      createdAt: new Date()
    });
  }

  // Goal insights
  const activeGoals = userData.goals.filter(g => g.isActive);
  const nearDeadlineGoals = activeGoals.filter(g => {
    const daysLeft = (g.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30 && daysLeft > 0;
  });

  if (nearDeadlineGoals.length > 0) {
    insights.push({
      id: 'goal_deadline',
      type: 'goals',
      title: 'Goal Deadline Approaching',
      message: `You have ${nearDeadlineGoals.length} goal(s) due within 30 days. Keep up the momentum!`,
      severity: 'warning',
      action: {
        text: 'View Goals',
        href: '/goals'
      },
      createdAt: new Date()
    });
  }

  return insights;
};

// Analyze spending patterns
export const analyzeSpendingPatterns = (transactions: Array<{
  direction: string;
  amount: number;
  category?: string;
}>): SpendingPattern[] => {
  const categoryTotals: Record<string, number> = {};
  let totalSpent = 0;

  transactions.forEach(transaction => {
    if (transaction.direction === '-') {
      const category = transaction.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      totalSpent += transaction.amount;
    }
  });

  const patterns: SpendingPattern[] = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    trend: 'stable', // This would be calculated based on historical data
    changePercent: 0 // This would be calculated based on previous period
  }));

  return patterns.sort((a, b) => b.amount - a.amount);
};

// Generate financial health score
export const calculateFinancialHealthScore = (userData: {
  balance: number;
  savingsBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  debtAmount: number;
  goals: FinancialGoal[];
}): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
  breakdown: {
    emergencyFund: number;
    savingsRate: number;
    debtRatio: number;
    goalProgress: number;
  };
} => {
  const { savingsBalance, monthlyIncome, monthlyExpenses, debtAmount, goals } = userData;

  // Calculate emergency fund score (3-6 months expenses)
  const emergencyFundMonths = savingsBalance / monthlyExpenses;
  const emergencyFundScore = Math.min(100, (emergencyFundMonths / 6) * 100);

  // Calculate savings rate score
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const savingsRateScore = Math.min(100, savingsRate * 2); // 50% savings rate = 100 score

  // Calculate debt ratio score
  const debtRatio = monthlyIncome > 0 ? (debtAmount / monthlyIncome) * 100 : 0;
  const debtRatioScore = Math.max(0, 100 - debtRatio); // Lower debt ratio = higher score

  // Calculate goal progress score
  const activeGoals = goals.filter(g => g.isActive);
  const avgGoalProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount), 0) / activeGoals.length
    : 0;
  const goalProgressScore = avgGoalProgress * 100;

  // Calculate overall score
  const overallScore = (emergencyFundScore + savingsRateScore + debtRatioScore + goalProgressScore) / 4;

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else if (overallScore >= 60) grade = 'D';
  else grade = 'F';

  // Generate recommendations
  const recommendations: string[] = [];
  if (emergencyFundScore < 60) {
    recommendations.push('Build an emergency fund covering 3-6 months of expenses');
  }
  if (savingsRateScore < 60) {
    recommendations.push('Increase your savings rate to at least 20% of income');
  }
  if (debtRatioScore < 60) {
    recommendations.push('Focus on reducing debt to improve financial health');
  }
  if (goalProgressScore < 60) {
    recommendations.push('Set specific financial goals and track progress regularly');
  }

  return {
    score: Math.round(overallScore),
    grade,
    recommendations,
    breakdown: {
      emergencyFund: Math.round(emergencyFundScore),
      savingsRate: Math.round(savingsRateScore),
      debtRatio: Math.round(debtRatioScore),
      goalProgress: Math.round(goalProgressScore)
    }
  };
};

// Dashboard widget management
export const getDefaultDashboardLayout = (): DashboardWidget[] => {
  return [
    {
      id: 'balance_card',
      type: 'balance',
      title: 'Account Balance',
      data: {},
      position: { x: 0, y: 0, w: 6, h: 2 },
      isVisible: true,
      isCustomizable: false,
      lastUpdated: new Date()
    },
    {
      id: 'quick_actions',
      type: 'quick_actions',
      title: 'Quick Actions',
      data: {},
      position: { x: 6, y: 0, w: 6, h: 2 },
      isVisible: true,
      isCustomizable: true,
      lastUpdated: new Date()
    },
    {
      id: 'recent_transactions',
      type: 'transactions',
      title: 'Recent Transactions',
      data: {},
      position: { x: 0, y: 2, w: 8, h: 4 },
      isVisible: true,
      isCustomizable: true,
      lastUpdated: new Date()
    },
    {
      id: 'savings_summary',
      type: 'savings',
      title: 'Savings Summary',
      data: {},
      position: { x: 8, y: 2, w: 4, h: 4 },
      isVisible: true,
      isCustomizable: true,
      lastUpdated: new Date()
    },
    {
      id: 'insights',
      type: 'insights',
      title: 'Financial Insights',
      data: {},
      position: { x: 0, y: 6, w: 8, h: 2 },
      isVisible: true,
      isCustomizable: true,
      lastUpdated: new Date()
    },
    {
      id: 'airtime_data',
      type: 'airtime',
      title: 'Airtime & Data',
      data: {},
      position: { x: 8, y: 6, w: 4, h: 2 },
      isVisible: true,
      isCustomizable: true,
      lastUpdated: new Date()
    }
  ];
};

export const updateDashboardLayout = async (_userId: string, layout: DashboardWidget[]): Promise<void> => {
  // In a real implementation, this would save the layout to the database
  console.log('Updating dashboard layout for user:', _userId, layout);
};

export const getDashboardLayout = async (): Promise<DashboardWidget[]> => {
  // In a real implementation, this would fetch the user's custom layout
  return getDefaultDashboardLayout();
};

