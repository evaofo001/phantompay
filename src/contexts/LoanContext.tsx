import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { Loan, SavingsAccount } from '../types';
import { addLoan, updateLoan, getUserLoans } from '../utils/firestoreHelpers';
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

const LOAN_INTEREST_RATES = {
  basic: 0.20,
  plus: 0.18,
  vip: 0.15
};

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { collectRevenue } = useAdmin();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's loans with real-time updates
  useEffect(() => {
    if (!currentUser) {
      setLoans([]);
      return;
    }

    const unsubscribe = getUserLoans(currentUser.uid, (loansList) => {
      setLoans(loansList);
    });

    return unsubscribe;
  }, [currentUser]);

  const calculateMaxLoanAmount = (savingsAccounts: SavingsAccount[]): number => {
    const activeSavings = savingsAccounts.filter(savings => savings.status === 'active');
    
    if (activeSavings.length === 0) return 0;
    
    let totalSavingsPrincipal = 0;
    let totalProjectedInterest = 0;
    
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
    
    const totalSavingsValue = totalSavingsPrincipal + totalProjectedInterest;
    const maxLoanPlusInterest = totalSavingsValue - 1;
    
    const defaultInterestRate = LOAN_INTEREST_RATES.basic;
    const maxLoanAmount = maxLoanPlusInterest / (1 + defaultInterestRate * 0.5);
    
    return Math.floor(Math.max(0, maxLoanAmount));
  };

  const calculateLoanInterest = (amount: number, premiumTier: string) => {
    const rate = LOAN_INTEREST_RATES[premiumTier as keyof typeof LOAN_INTEREST_RATES] || LOAN_INTEREST_RATES.basic;
    
    const months = 6;
    const totalInterest = amount * rate * (months / 12);
    const totalRepayment = amount + totalInterest;
    
    return {
      rate: rate * 100,
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment)
    };
  };

  const getLoanEligibility = (savingsAccounts: SavingsAccount[]) => {
    const activeSavings = savingsAccounts.filter(savings => savings.status === 'active');
    
    if (activeSavings.length === 0) {
      return {
        eligible: false,
        reason: 'You need at least one active savings account to qualify for a loan',
        maxAmount: 0
      };
    }

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

    const maxAmount = calculateMaxLoanAmount(activeSavings);
    
    if (maxAmount < 1000) {
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
      
      // Create loan record
      const newLoan: Omit<Loan, 'id'> = {
        uid: currentUser.uid,
        savingsAccountId: 'combined_savings',
        amount,
        interestRate: loanCalculation.rate,
        totalInterest: loanCalculation.totalInterest,
        totalRepayment: loanCalculation.totalRepayment,
        disbursementDate: new Date(),
        dueDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        repaidAmount: 0,
        remainingAmount: loanCalculation.totalRepayment,
        autoDeductFromSavings: true,
        createdAt: new Date()
      };

      await addLoan(newLoan);

      // Collect loan interest as revenue for admin
      await collectRevenue(
        loanCalculation.totalInterest,
        'loan_interest',
        `loan_${Date.now()}`,
        currentUser.uid,
        `Loan interest revenue from loan (${loanCalculation.rate}% rate)`
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

      const loan = loans.find(l => l.id === loanId);
      if (!loan) throw new Error('Loan not found');

      const newRepaidAmount = loan.repaidAmount + amount;
      const newRemainingAmount = Math.max(0, loan.totalRepayment - newRepaidAmount);
      
      await updateLoan(loanId, {
        repaidAmount: newRepaidAmount,
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount === 0 ? 'repaid' : loan.status
      });

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