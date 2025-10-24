// Premium Plans Management Utilities

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'lifetime';
  color: string;
  popular?: boolean;
  features: string[];
  benefits: PremiumBenefits;
  limits: PremiumLimits;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PremiumBenefits {
  savingsInterest: number; // percentage
  withdrawalFeeDiscount: number; // percentage
  transactionFeeDiscount: number; // percentage
  financialCoach: boolean;
  loanAccess: boolean;
  supportLevel: 'email' | 'chat' | 'phone' | 'priority';
  cashback: number; // percentage
  analytics: 'basic' | 'advanced' | 'premium';
  security: string[];
  gamification: boolean;
  priorityProcessing: boolean;
  exclusiveFeatures: string[];
}

export interface PremiumLimits {
  maxTransactionsPerDay: number;
  maxTransactionAmount: number;
  maxSavingsAccounts: number;
  maxLoanAmount: number;
  maxWithdrawalPerDay: number;
  customFeatures: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: string;
  amount: number;
  currency: string;
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dynamic premium plans configuration
export const getPremiumPlans = async (): Promise<PremiumPlan[]> => {
  // In a real implementation, this would fetch from database/API
  const plans: PremiumPlan[] = [
    {
      id: 'basic',
      name: 'PhantomPay Basic',
      description: 'Essential features for everyday banking',
      price: 0,
      currency: 'KES',
      period: 'monthly',
      color: 'from-gray-500 to-gray-600',
      features: [
        'Basic wallet functionality',
        'Standard transaction fees',
        'Basic savings (6% interest)',
        'Email support only',
        'Basic spending analytics',
        'PIN security only'
      ],
      benefits: {
        savingsInterest: 6,
        withdrawalFeeDiscount: 0,
        transactionFeeDiscount: 0,
        financialCoach: false,
        loanAccess: false,
        supportLevel: 'email',
        cashback: 0,
        analytics: 'basic',
        security: ['PIN'],
        gamification: false,
        priorityProcessing: false,
        exclusiveFeatures: []
      },
      limits: {
        maxTransactionsPerDay: 10,
        maxTransactionAmount: 50000,
        maxSavingsAccounts: 1,
        maxLoanAmount: 0,
        maxWithdrawalPerDay: 20000,
        customFeatures: {}
      },
      isActive: true,
      sortOrder: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'plus',
      name: 'PhantomPay Plus',
      description: 'Enhanced features for active users',
      price: 200,
      currency: 'KES',
      period: 'monthly',
      color: 'from-purple-500 to-indigo-600',
      popular: true,
      features: [
        'Reduced transaction fees (25% off P2P)',
        'Higher savings interest (12% annual)',
        '24/7 chat support',
        '2% cashback on eligible merchants',
        'Advanced spending analytics',
        'Email + OTP security',
        'Badges & challenges',
        'Premium badge'
      ],
      benefits: {
        savingsInterest: 12,
        withdrawalFeeDiscount: 30,
        transactionFeeDiscount: 25,
        financialCoach: false,
        loanAccess: true,
        supportLevel: 'chat',
        cashback: 2,
        analytics: 'advanced',
        security: ['PIN', 'OTP', 'Email'],
        gamification: true,
        priorityProcessing: false,
        exclusiveFeatures: ['Advanced Analytics', 'Premium Badge']
      },
      limits: {
        maxTransactionsPerDay: 25,
        maxTransactionAmount: 100000,
        maxSavingsAccounts: 3,
        maxLoanAmount: 50000,
        maxWithdrawalPerDay: 50000,
        customFeatures: {
          prioritySupport: true,
          advancedAnalytics: true
        }
      },
      isActive: true,
      sortOrder: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'vip',
      name: 'PhantomPay VIP',
      description: 'Premium features for power users',
      price: 500,
      currency: 'KES',
      period: 'monthly',
      color: 'from-yellow-500 to-orange-600',
      features: [
        'Maximum savings interest (18% annual)',
        '50% off all fees',
        '5% cashback on all transactions',
        'Personal AI financial coach',
        'Priority phone support',
        'Advanced security features',
        'Unlimited transactions',
        'VIP badge and status',
        'Exclusive features and early access',
        'Priority processing'
      ],
      benefits: {
        savingsInterest: 18,
        withdrawalFeeDiscount: 50,
        transactionFeeDiscount: 50,
        financialCoach: true,
        loanAccess: true,
        supportLevel: 'phone',
        cashback: 5,
        analytics: 'premium',
        security: ['PIN', 'OTP', 'Email', 'Biometric', '2FA'],
        gamification: true,
        priorityProcessing: true,
        exclusiveFeatures: ['AI Coach', 'VIP Badge', 'Priority Support', 'Advanced Security']
      },
      limits: {
        maxTransactionsPerDay: -1, // unlimited
        maxTransactionAmount: 500000,
        maxSavingsAccounts: 10,
        maxLoanAmount: 200000,
        maxWithdrawalPerDay: 100000,
        customFeatures: {
          vipSupport: true,
          aiCoach: true,
          priorityProcessing: true,
          exclusiveFeatures: true
        }
      },
      isActive: true,
      sortOrder: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  return plans.filter(plan => plan.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
};

// Subscription management functions
export const createSubscription = async (
  userId: string,
  planId: string,
  paymentMethod: string,
  autoRenew: boolean = true
): Promise<Subscription> => {
  const plan = (await getPremiumPlans()).find(p => p.id === planId);
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  const now = new Date();
  const endDate = new Date(now);
  
  switch (plan.period) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'lifetime':
      endDate.setFullYear(endDate.getFullYear() + 100); // Effectively lifetime
      break;
  }

  const subscription: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    planId,
    status: 'pending',
    startDate: now,
    endDate,
    autoRenew,
    paymentMethod,
    amount: plan.price,
    currency: plan.currency,
    nextBillingDate: plan.period !== 'lifetime' ? endDate : undefined,
    createdAt: now,
    updatedAt: now
  };

  // In a real implementation, this would save to database
  console.log('Creating subscription:', subscription);
  
  return subscription;
};

export const getActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  // In a real implementation, this would fetch from database
  console.log('Getting active subscription for user:', userId);
  return null;
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  // In a real implementation, this would update subscription status
  console.log('Cancelling subscription:', subscriptionId);
};

export const renewSubscription = async (subscriptionId: string): Promise<Subscription> => {
  // In a real implementation, this would extend subscription period
  console.log('Renewing subscription:', subscriptionId);
  throw new Error('Not implemented');
};

// Plan comparison utilities
export const comparePlans = (plan1: PremiumPlan, plan2: PremiumPlan): {
  betterSavingsInterest: PremiumPlan | null;
  betterCashback: PremiumPlan | null;
  moreFeatures: PremiumPlan | null;
  betterSupport: PremiumPlan | null;
} => {
  return {
    betterSavingsInterest: plan1.benefits.savingsInterest > plan2.benefits.savingsInterest ? plan1 : plan2,
    betterCashback: plan1.benefits.cashback > plan2.benefits.cashback ? plan1 : plan2,
    moreFeatures: plan1.features.length > plan2.features.length ? plan1 : plan2,
    betterSupport: getSupportLevel(plan1.benefits.supportLevel) > getSupportLevel(plan2.benefits.supportLevel) ? plan1 : plan2
  };
};

const getSupportLevel = (level: string): number => {
  const levels = { 'email': 1, 'chat': 2, 'phone': 3, 'priority': 4 };
  return levels[level as keyof typeof levels] || 0;
};

// ROI calculation utilities
export const calculatePlanROI = (
  plan: PremiumPlan,
  userSavingsBalance: number,
  userMonthlyTransactions: number,
  averageTransactionAmount: number
): {
  monthlySavings: number;
  monthlyCashback: number;
  monthlyFeeSavings: number;
  totalMonthlyBenefits: number;
  netROI: number;
  breakEvenPoint: number;
} => {
  const monthlySavings = (userSavingsBalance * plan.benefits.savingsInterest / 100) / 12;
  const monthlyCashback = (userMonthlyTransactions * averageTransactionAmount * plan.benefits.cashback / 100);
  const monthlyFeeSavings = userMonthlyTransactions * 50 * plan.benefits.transactionFeeDiscount / 100; // Assuming 50 KES average fee
  
  const totalMonthlyBenefits = monthlySavings + monthlyCashback + monthlyFeeSavings;
  const netROI = totalMonthlyBenefits - plan.price;
  const breakEvenPoint = plan.price / (totalMonthlyBenefits / 30); // days to break even

  return {
    monthlySavings,
    monthlyCashback,
    monthlyFeeSavings,
    totalMonthlyBenefits,
    netROI,
    breakEvenPoint
  };
};

// Feature access utilities
export const hasFeatureAccess = (userPlan: PremiumPlan, feature: string): boolean => {
  const featureAccess: Record<string, string[]> = {
    'ai_coach': ['vip'],
    'priority_support': ['plus', 'vip'],
    'advanced_analytics': ['plus', 'vip'],
    'unlimited_transactions': ['vip'],
    'cashback': ['plus', 'vip'],
    'loan_access': ['plus', 'vip'],
    'gamification': ['plus', 'vip']
  };

  const requiredPlans = featureAccess[feature] || [];
  return requiredPlans.includes(userPlan.id);
};

export const getUpgradeRecommendation = (
  currentPlan: PremiumPlan,
  userMetrics: {
    savingsBalance: number;
    monthlyTransactions: number;
    averageTransactionAmount: number;
  }
): {
  recommendedPlan: PremiumPlan | null;
  reason: string;
  potentialSavings: number;
} => {
  const plans = getPremiumPlans();
  const higherPlans = plans.filter(p => p.sortOrder > currentPlan.sortOrder);
  
  if (higherPlans.length === 0) {
    return {
      recommendedPlan: null,
      reason: 'You already have the highest tier!',
      potentialSavings: 0
    };
  }

  const nextPlan = higherPlans[0];
  const currentROI = calculatePlanROI(currentPlan, userMetrics.savingsBalance, userMetrics.monthlyTransactions, userMetrics.averageTransactionAmount);
  const nextROI = calculatePlanROI(nextPlan, userMetrics.savingsBalance, userMetrics.monthlyTransactions, userMetrics.averageTransactionAmount);
  
  const potentialSavings = nextROI.totalMonthlyBenefits - currentROI.totalMonthlyBenefits;

  if (potentialSavings > nextPlan.price) {
    return {
      recommendedPlan: nextPlan,
      reason: `You could save ${potentialSavings.toFixed(2)} KES per month with ${nextPlan.name}`,
      potentialSavings
    };
  }

  return {
    recommendedPlan: null,
    reason: 'Your current plan is optimal for your usage',
    potentialSavings: 0
  };
};

