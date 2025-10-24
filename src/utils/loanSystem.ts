// Loan System Implementation
// Based on your specifications: Basic (20%), Plus (18%), VIP (15%) for 6 months

export interface LoanApplication {
  id: string;
  userId: string;
  requestedAmount: number;
  approvedAmount: number;
  interestRate: number; // Annual rate
  termMonths: number; // Always 6 months
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
  appliedAt: Date;
  approvedAt?: Date;
  disbursedAt?: Date;
  maturityDate?: Date;
  totalSavingsValue: number;
  eligibilityScore: number;
  rejectionReason?: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  type: 'principal' | 'interest' | 'penalty';
  timestamp: Date;
  method: 'auto_deduction' | 'manual' | 'savings_deduction';
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paidAt: Date;
  method: 'auto_deduction' | 'manual' | 'savings_deduction';
}

// Interest rates by premium tier (annual)
export const LOAN_INTEREST_RATES = {
  basic: 0.20, // 20% annual
  plus: 0.18,  // 18% annual
  vip: 0.15    // 15% annual
};

// Loan term (always 6 months)
export const LOAN_TERM_MONTHS = 6;

// Maximum loan calculation factor
export const LOAN_CALCULATION_FACTOR = 0.5; // 50% of savings value

class LoanSystem {
  // Calculate maximum loan amount based on savings
  calculateMaxLoanAmount(
    totalSavingsValue: number,
    interestRate: number
  ): number {
    if (totalSavingsValue <= 1) return 0;

    // Formula: (Total savings value - KES 1) ÷ (1 + interest rate × 0.5)
    const maxLoan = (totalSavingsValue - 1) / (1 + interestRate * LOAN_CALCULATION_FACTOR);
    return Math.round(maxLoan * 100) / 100;
  }

  // Check loan eligibility
  checkLoanEligibility(
    userId: string,
    requestedAmount: number,
    totalSavingsValue: number,
    premiumTier: string,
    hasActiveLoan: boolean = false
  ): {
    eligible: boolean;
    maxLoanAmount: number;
    interestRate: number;
    score: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 100;

    // Check if user has active loan
    if (hasActiveLoan) {
      reasons.push('You already have an active loan');
      return {
        eligible: false,
        maxLoanAmount: 0,
        interestRate: 0,
        score: 0,
        reasons
      };
    }

    // Check minimum savings requirement
    if (totalSavingsValue <= 1) {
      reasons.push('Insufficient savings. You need at least KES 1 in savings');
      return {
        eligible: false,
        maxLoanAmount: 0,
        interestRate: 0,
        score: 0,
        reasons
      };
    }

    const interestRate = LOAN_INTEREST_RATES[premiumTier as keyof typeof LOAN_INTEREST_RATES] || LOAN_INTEREST_RATES.basic;
    const maxLoanAmount = this.calculateMaxLoanAmount(totalSavingsValue, interestRate);

    // Check if requested amount is within limit
    if (requestedAmount > maxLoanAmount) {
      reasons.push(`Requested amount exceeds maximum loan of KES ${maxLoanAmount.toFixed(2)}`);
      score -= 50;
    }

    // Check if requested amount is reasonable
    if (requestedAmount < 100) {
      reasons.push('Minimum loan amount is KES 100');
      score -= 20;
    }

    // Premium tier benefits
    if (premiumTier === 'vip') {
      reasons.push('VIP members get the lowest interest rate (15%)');
    } else if (premiumTier === 'plus') {
      reasons.push('Plus members get reduced interest rate (18%)');
    } else {
      reasons.push('Upgrade to Plus or VIP for lower interest rates');
    }

    const eligible = requestedAmount <= maxLoanAmount && requestedAmount >= 100 && !hasActiveLoan;

    return {
      eligible,
      maxLoanAmount,
      interestRate,
      score: Math.max(0, score),
      reasons
    };
  }

  // Apply for a loan
  async applyForLoan(
    userId: string,
    requestedAmount: number,
    totalSavingsValue: number,
    premiumTier: string,
    hasActiveLoan: boolean = false
  ): Promise<LoanApplication> {
    const eligibility = this.checkLoanEligibility(
      userId,
      requestedAmount,
      totalSavingsValue,
      premiumTier,
      hasActiveLoan
    );

    if (!eligibility.eligible) {
      throw new Error(`Loan not eligible: ${eligibility.reasons.join(', ')}`);
    }

    const interestRate = eligibility.interestRate;
    const approvedAmount = Math.min(requestedAmount, eligibility.maxLoanAmount);
    const now = new Date();
    const maturityDate = new Date(now.getTime() + LOAN_TERM_MONTHS * 30 * 24 * 60 * 60 * 1000);

    const loanApplication: LoanApplication = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      requestedAmount,
      approvedAmount,
      interestRate,
      termMonths: LOAN_TERM_MONTHS,
      status: 'approved', // Auto-approved based on savings collateral
      appliedAt: now,
      approvedAt: now,
      disbursedAt: now,
      maturityDate,
      totalSavingsValue,
      eligibilityScore: eligibility.score
    };

    console.log('Loan application created:', loanApplication);
    return loanApplication;
  }

  // Calculate loan repayment amount
  calculateLoanRepayment(loanAmount: number, interestRate: number): {
    monthlyPayment: number;
    totalInterest: number;
    totalRepayment: number;
    interestBreakdown: number[];
  } {
    const monthlyRate = interestRate / 12;
    const totalInterest = loanAmount * monthlyRate * LOAN_TERM_MONTHS;
    const totalRepayment = loanAmount + totalInterest;
    const monthlyPayment = totalRepayment / LOAN_TERM_MONTHS;

    // Calculate interest breakdown for each month
    const interestBreakdown: number[] = [];
    let remainingPrincipal = loanAmount;

    for (let month = 1; month <= LOAN_TERM_MONTHS; month++) {
      const monthlyInterest = remainingPrincipal * monthlyRate;
      const monthlyPrincipal = monthlyPayment - monthlyInterest;
      remainingPrincipal -= monthlyPrincipal;
      interestBreakdown.push(Math.round(monthlyInterest * 100) / 100);
    }

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      interestBreakdown
    };
  }

  // Process loan repayment
  async processLoanRepayment(
    loanId: string,
    paymentAmount: number,
    method: 'auto_deduction' | 'manual' | 'savings_deduction' = 'manual'
  ): Promise<LoanRepayment> {
    // In a real implementation, fetch loan details from database
    const loan: LoanApplication = {
      id: loanId,
      userId: 'user_id',
      requestedAmount: 10000,
      approvedAmount: 10000,
      interestRate: 0.20,
      termMonths: 6,
      status: 'active',
      appliedAt: new Date(),
      approvedAt: new Date(),
      disbursedAt: new Date(),
      maturityDate: new Date(),
      totalSavingsValue: 20000,
      eligibilityScore: 100
    };

    const repayment = this.calculateLoanRepayment(loan.approvedAmount, loan.interestRate);
    
    const loanRepayment: LoanRepayment = {
      id: `repayment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loanId,
      totalAmount: paymentAmount,
      principalAmount: Math.min(paymentAmount, loan.approvedAmount),
      interestAmount: Math.max(0, paymentAmount - loan.approvedAmount),
      penaltyAmount: 0, // No penalty for on-time payments
      paidAt: new Date(),
      method
    };

    console.log('Loan repayment processed:', loanRepayment);
    return loanRepayment;
  }

  // Auto-deduct from savings at maturity
  async autoDeductFromSavings(loanId: string): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Check if loan is at maturity
    // 2. Calculate remaining balance
    // 3. Deduct from user's savings accounts
    // 4. Update loan status to 'completed'
    // 5. Handle insufficient savings (mark as defaulted)

    console.log(`Auto-deducting loan ${loanId} from savings`);
    return true;
  }

  // Get loan status and details
  getLoanDetails(loan: LoanApplication): {
    status: string;
    daysToMaturity: number;
    isOverdue: boolean;
    remainingBalance: number;
    nextPaymentDue: Date;
    totalPaid: number;
  } {
    const now = new Date();
    const daysToMaturity = Math.max(0, Math.ceil((loan.maturityDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    const isOverdue = now > loan.maturityDate!;
    
    // In a real implementation, calculate from actual payments
    const remainingBalance = loan.approvedAmount;
    const totalPaid = 0;
    const nextPaymentDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next month

    return {
      status: loan.status,
      daysToMaturity,
      isOverdue,
      remainingBalance,
      nextPaymentDue,
      totalPaid
    };
  }

  // Get loan recommendations
  getLoanRecommendations(
    totalSavingsValue: number,
    premiumTier: string,
    monthlyIncome: number
  ): string[] {
    const recommendations: string[] = [];
    const interestRate = LOAN_INTEREST_RATES[premiumTier as keyof typeof LOAN_INTEREST_RATES] || LOAN_INTEREST_RATES.basic;
    const maxLoan = this.calculateMaxLoanAmount(totalSavingsValue, interestRate);

    if (maxLoan > 0) {
      recommendations.push(`You can borrow up to KES ${maxLoan.toFixed(2)} based on your savings`);
    }

    if (premiumTier === 'basic') {
      recommendations.push('Upgrade to Plus (18%) or VIP (15%) for lower interest rates');
    }

    if (monthlyIncome > 0) {
      const affordableLoan = monthlyIncome * 0.3; // 30% of monthly income
      recommendations.push(`Consider borrowing no more than KES ${affordableLoan.toFixed(0)} (30% of monthly income)`);
    }

    recommendations.push('Loans are secured against your savings - no credit check required');
    recommendations.push('6-month repayment term with monthly payments');
    recommendations.push('Auto-deduction from savings available at maturity');

    return recommendations;
  }

  // Calculate loan impact on savings
  calculateLoanImpact(
    loanAmount: number,
    totalSavingsValue: number,
    interestRate: number
  ): {
    remainingSavings: number;
    loanToSavingsRatio: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const remainingSavings = totalSavingsValue - loanAmount;
    const loanToSavingsRatio = loanAmount / totalSavingsValue;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (loanToSavingsRatio > 0.8) riskLevel = 'high';
    else if (loanToSavingsRatio > 0.5) riskLevel = 'medium';

    return {
      remainingSavings,
      loanToSavingsRatio,
      riskLevel
    };
  }
}

// Export singleton instance
export const loanSystem = new LoanSystem();
export default loanSystem;
