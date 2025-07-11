import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { Loan, SavingsAccount } from '../types';
import toast from 'react-hot-toast';

interface LoanContextType {
  loans: Loan[];
  calculateMaxLoanAmount: (savingsAccounts: SavingsAccount[]) => number;
  calculateLoanInterest: (amount: number, premiumTier: string) => { rate: number; totalInterest: number; totalRepayment: number };
  applyForLoan: (amount: number, premiumTier: string) => Promise<void>;
  repayLoan: (loanId: string, amount: number) => Promise<void>;
  getLoanEligibility: (savingsAccounts: SavingsAccount[]) => { eligible: boolean; reason?: string; maxAmount: number };
  loading: boolean;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const useLoan = () => {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
};

// CORRECTED: Loan interest rates MUST BE HIGHER than savings interest rates
const LOAN_INTEREST_RATES = {
  basic: 0.20,    // 20% annual (higher than 6% savings)
  plus: 0.18,     // 18% annual (higher than 12% savings)  
  vip: 0.15       // 15% annual (higher than 18% savings - still profitable)
};

// Savings interest rates (for reference)
const SAVINGS_INTEREST_RATES = {
  basic: 0.06,    // 6% annual
  plus: 0.12,     // 12% annual
  vip: 0.18       // 18% annual
};

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { collectRevenue } = useAdmin();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's loans
  useEffect(() => {
    if (!currentUser) {
      setLoans([]);
      return;
    }

    const savedLoans = localStorage.getItem(`loans_${currentUser.uid}`);
    if (savedLoans) {
      const loansList = JSON.parse(savedLoans).map((loan: any) => ({
        ...loan,
        disbursementDate: new Date(loan.disbursementDate),
        dueDate: new Date(loan.dueDate),
        createdAt: new Date(loan.createdAt)
      }));
      setLoans(loansList);
    }
  }, [currentUser]);

  // CORRECTED: Calculate max loan amount from ALL savings accounts combined
  const calculateMaxLoanAmount = (savingsAccounts: SavingsAccount[]): number => {
    const activeSavings = savingsAccounts.filter(savings => savings.status === 'active');
    
    if (activeSavings.length === 0) return 0;
    
    let totalSavingsPrincipal = 0;
    let totalProjectedInterest = 0;
    
    // Calculate combined value from ALL savings accounts
    activeSavings.forEach(savings => {
      const monthsElapsed = Math.min(
        (Date.now() - savings.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
        savings.lockPeriod
      );
      
      const monthlyRate = savings.annualInterestRate / 12 / 100;
      const projectedMaturityValue = savings.principal * Math.pow(1 + monthlyRate, savings.lockPeriod);
      const projectedInterest = projectedMaturityValue - savings.principal;
      
      totalSavingsPrincipal += savings.principal;
      totalProjectedInterest += projectedInterest;
    });
    
    // CORRECTED FORMULA: Loan limit + interest = all savings principals + all savings interests - 1
    const totalSavingsValue = totalSavingsPrincipal + totalProjectedInterest;
    const maxLoanPlusInterest = totalSavingsValue - 1;
    
    // We need to solve: loan_amount + (loan_amount * interest_rate * months/12) = maxLoanPlusInterest
    // Simplified for 6 months: loan_amount * (1 + interest_rate * 0.5) = maxLoanPlusInterest
    // Therefore: loan_amount = maxLoanPlusInterest / (1 + interest_rate * 0.5)
    
    // Use basic tier rate as default for calculation
    const defaultInterestRate = LOAN_INTEREST_RATES.basic;
    const maxLoanAmount = maxLoanPlusInterest / (1 + defaultInterestRate * 0.5);
    
    return Math.floor(Math.max(0, maxLoanAmount));
  };

  const calculateLoanInterest = (amount: number, premiumTier: string) => {
    const rate = LOAN_INTEREST_RATES[premiumTier as keyof typeof LOAN_INTEREST_RATES] || LOAN_INTEREST_RATES.basic;
    
    // Calculate interest for 6 months (standard loan period)
    const months = 6;
    const totalInterest = amount * rate * (months / 12);
    const totalRepayment = amount + totalInterest;
    
    return {
      rate: rate * 100, // Convert to percentage
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment)
    };
  };

  const getLoanEligibility = (savingsAccounts: SavingsAccount[]) => {
    const activeSavings = savingsAccounts.filter(savings => savings.status === 'active');
    
    // Rule 1: Must have at least one active savings account
    if (activeSavings.length === 0) {
      return {
        eligible: false,
        reason: 'You need at least one active savings account to qualify for a loan',
        maxAmount: 0
      };
    }

    // Rule 2: Check if user already has any active loan
    const existingLoan = loans.find(loan => 
      loan.status === 'active' || loan.status === 'overdue'
    );

    if (existingLoan) {
      return {
        eligible: false,
        reason: 'You already have an active loan. Please repay it before applying for a new one.',
        maxAmount: 0
      };
    }

    // Rule 3: Calculate max loan amount from ALL savings combined
    const maxAmount = calculateMaxLoanAmount(activeSavings);
    
    if (maxAmount < 1000) { // Minimum loan amount
      return {
        eligible: false,
        reason: 'Combined savings amount too low for loan eligibility (minimum loan: KES 1,000)',
        maxAmount: 0
      };
    }

    return {
      eligible: true,
      maxAmount
    };
  };

  const applyForLoan = async (amount: number, premiumTier: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const loanCalculation = calculateLoanInterest(amount, premiumTier);
      
      // Create loan record (not tied to specific savings account anymore)
      const newLoan: Loan = {
        id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: currentUser.uid,
        savingsAccountId: 'combined_savings', // Indicates it's backed by all savings
        amount,
        interestRate: loanCalculation.rate,
        totalInterest: loanCalculation.totalInterest,
        totalRepayment: loanCalculation.totalRepayment,
        disbursementDate: new Date(),
        dueDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
        status: 'active',
        repaidAmount: 0,
        remainingAmount: loanCalculation.totalRepayment,
        autoDeductFromSavings: true,
        createdAt: new Date()
      };

      const updatedLoans = [newLoan, ...loans];
      setLoans(updatedLoans);
      
      // Save to localStorage
      localStorage.setItem(`loans_${currentUser.uid}`, JSON.stringify(updatedLoans));

      // Collect loan interest as revenue for admin
      await collectRevenue(
        loanCalculation.totalInterest,
        'loan_interest',
        newLoan.id,
        currentUser.uid,
        `Loan interest revenue from loan ${newLoan.id} (${loanCalculation.rate}% rate)`
      );

      toast.success(`Loan of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} approved! 🎉`);

    } catch (error: any) {
      console.error('Error applying for loan:', error);
      toast.error(error.message || 'Failed to process loan application');
    } finally {
      setLoading(false);
    }
  };

  const repayLoan = async (loanId: string, amount: number) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedLoans = loans.map(loan => {
        if (loan.id === loanId) {
          const newRepaidAmount = loan.repaidAmount + amount;
          const newRemainingAmount = Math.max(0, loan.totalRepayment - newRepaidAmount);
          
          return {
            ...loan,
            repaidAmount: newRepaidAmount,
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount === 0 ? 'repaid' as const : loan.status
          };
        }
        return loan;
      });

      setLoans(updatedLoans);
      localStorage.setItem(`loans_${currentUser.uid}`, JSON.stringify(updatedLoans));

      toast.success(`Loan repayment of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} processed! 💰`);

    } catch (error: any) {
      console.error('Error repaying loan:', error);
      toast.error('Failed to process loan repayment');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loans,
    calculateMaxLoanAmount,
    calculateLoanInterest,
    applyForLoan,
    repayLoan,
    getLoanEligibility,
    loading
  };

  return (
    <LoanContext.Provider value={value}>
      {children}
    </LoanContext.Provider>
  );
};