export interface Transaction {
  uid: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  direction: '-' | '+';
  timestamp?: string;
}

export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  color: string;
  popular?: boolean;
  features: string[];
  benefits: {
    savingsInterest: string;
    withdrawalFee: string;
    financialCoach: boolean;
    loanAccess: string;
    support: string;
    cashback: string;
    analytics: string;
    security: string;
    gamification: boolean;
  };
}