import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { Loan, SavingsAccount } from '../types';
import toast from 'react-hot-toast';

interface LoanContextType {
  loans: Loan[];
  calculateMaxLoanAmount: (savingsAccount: SavingsAccount) => number;
  calculateLoanInterest: (amount: number, premiumTier: string) => { rate: number; totalInterest: number; totalRepayment: number };
  applyForLoan: (savingsAccountId: string, amount: number, premiumTier: string) => Promise<void>;
  repayLoan: (loanId: string, amount: number) => Promise<void>;
  getLoanEligibility: (savingsAccount: SavingsAccount) => { eligible: boolean; reason?: string; maxAmount: number };
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

// Loan interest rates by premium tier
const LOAN_INTEREST_RATES = {
  basic: 0.15,    // 15% annual
  plus: 0.12,     // 12% annual  
  vip: 0.08       // 8% annual
};

// Savings interest rates (must be lower than loan rates)
const SAVINGS_INTEREST_RATES = {
  basic: 0.06,    // 6% annual
  plus: 0.10,     // 10% annual
  vip: 0.12       // 12% annual
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

  const calculateMaxLoanAmount = (savingsAccount: SavingsAccount): number => {
    if (savingsAccount.status !== 'active') return 0;
    
    // Calculate current savings value with interest
    const monthsElapsed = Math.min(
      (Date.now() - savingsAccount.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      savingsAccount.lockPeriod
    );
    
    const monthlyRate = savingsAccount.annualInterestRate / 12 / 100;
    const currentSavingsValue = savingsAccount.principal * Math.pow(1 + monthlyRate, monthsElapsed);
    const projectedMaturityValue = savingsAccount.principal * Math.pow(1 + monthlyRate, savingsAccount.lockPeriod);
    
    // Max loan is 80% of projected maturity value
    return Math.floor(projectedMaturityValue * 0.8);
  };

  const calculateLoanInterest = (amount: number, premiumTier: string) => {
    const rate = LOAN_INTEREST_RATES[premiumTier as keyof typeof LOAN_INTEREST_RATES] || LOAN_INTEREST_RATES.basic;
    
    // Calculate interest for the loan period (typically matches savings period)
    const monthlyRate = rate / 12;
    const months = 6; // Default 6 months, can be customized
    
    const totalInterest = amount * monthlyRate * months;
    const totalRepayment = amount + totalInterest;
    
    return {
      rate: rate * 100, // Convert to percentage
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment)
    };
  };

  const getLoanEligibility = (savingsAccount: SavingsAccount) => {
    // Rule 1: Must have active savings account
    if (savingsAccount.status !== 'active') {
      return {
        eligible: false,
        reason: 'Savings account must be active',
        maxAmount: 0
      };
    }

    // Rule 2: Check if user already has active loan on this savings
    const existingLoan = loans.find(loan => 
      loan.savingsAccountId === savingsAccount.id && 
      (loan.status === 'active' || loan.status === 'overdue')
    );

    if (existingLoan) {
      return {
        eligible: false,
        reason: 'You already have an active loan on this savings account',
        maxAmount: 0
      };
    }

    // Rule 3: Calculate max loan amount
    const maxAmount = calculateMaxLoanAmount(savingsAccount);
    
    if (maxAmount < 1000) { // Minimum loan amount
      return {
        eligible: false,
        reason: 'Savings amount too low for loan eligibility (minimum KES 1,000)',
        maxAmount: 0
      };
    }

    return {
      eligible: true,
      maxAmount
    };
  };

  const applyForLoan = async (savingsAccountId: string, amount: number, premiumTier: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const loanCalculation = calculateLoanInterest(amount, premiumTier);
      
      // Create loan record
      const newLoan: Loan = {
        id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: currentUser.uid,
        savingsAccountId,
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
        `Loan interest revenue from loan ${newLoan.id}`
      );

      toast.success(`Loan of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} approved! 🎉`);

    } catch (error) {
      console.error('Error applying for loan:', error);
      toast.error('Failed to process loan application');
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

    } catch (error) {
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