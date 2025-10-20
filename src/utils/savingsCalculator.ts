export interface SavingsOption {
  months: number;
  annualRate: number;
  name: string;
}

// Base savings options - premium tiers get higher rates
export const SAVINGS_OPTIONS: SavingsOption[] = [
  { months: 1, annualRate: 6, name: '1 Month' },
  { months: 3, annualRate: 6, name: '3 Months' },
  { months: 6, annualRate: 6, name: '6 Months' },
  { months: 12, annualRate: 6, name: '12 Months' }
];

// Premium tier savings rates
export const PREMIUM_SAVINGS_RATES = {
  basic: 6,
  plus: 12,
  vip: 18
};

export const MINIMUM_SAVINGS_DEPOSIT = 500;
export const EARLY_WITHDRAWAL_PENALTY = 0.05; // 5%

export function getSavingsRate(premiumTier: string): number {
  return PREMIUM_SAVINGS_RATES[premiumTier as keyof typeof PREMIUM_SAVINGS_RATES] || 6;
}

export function calculateSavingsReturn(
  principal: number, 
  months: number, 
  annualRate: number
): { total: number; interest: number } {
  const monthlyRate = annualRate / 12 / 100;
  const total = principal * Math.pow(1 + monthlyRate, months);
  const interest = total - principal;
  
  return {
    total: Math.round(total * 100) / 100,
    interest: Math.round(interest * 100) / 100
  };
}

export function calculateEarlyWithdrawalPenalty(principal: number): number {
  return Math.round(principal * EARLY_WITHDRAWAL_PENALTY * 100) / 100;
}

export function getMaturityDate(startDate: Date, months: number): Date {
  const maturityDate = new Date(startDate);
  maturityDate.setMonth(maturityDate.getMonth() + months);
  return maturityDate;
}

export function calculateCurrentSavingsValue(
  principal: number,
  startDate: Date,
  months: number,
  annualRate: number
): { currentValue: number; earnedInterest: number; daysElapsed: number } {
  const now = new Date();
  const start = new Date(startDate);
  const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const monthsElapsed = daysElapsed / 30.44; // Average days per month
  
  if (monthsElapsed <= 0) {
    return { currentValue: principal, earnedInterest: 0, daysElapsed };
  }

  const actualMonthsElapsed = Math.min(monthsElapsed, months);
  const monthlyRate = annualRate / 12 / 100;
  const currentValue = principal * Math.pow(1 + monthlyRate, actualMonthsElapsed);
  const earnedInterest = currentValue - principal;
  
  return {
    currentValue: Math.round(currentValue * 100) / 100,
    earnedInterest: Math.round(earnedInterest * 100) / 100,
    daysElapsed
  };
}