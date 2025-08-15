import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { User, Transaction, SavingsAccount } from '../types';
import { detectSuspiciousActivity, generateSecurityAuditLog } from '../utils/securityUtils';
import { checkRateLimit } from '../utils/rateLimiter';
import { calculateFee, getFeeBreakdown } from '../utils/feeCalculator';
import toast from 'react-hot-toast';

interface WalletContextType {
  user: User | null;
  balance: number;
  savingsBalance: number;
  rewardPoints: number;
  transactions: Transaction[];
  savingsAccounts: SavingsAccount[];
  sendMoney: (amount: number, recipient: string, description: string) => Promise<void>;
  withdrawMoney: (amount: number, method: string) => Promise<void>;
  depositMoney: (amount: number, method: string) => Promise<void>;
  buyAirtime: (amount: number, phoneNumber: string) => Promise<void>;
  buyData: (amount: number, phoneNumber: string, bundle: string) => Promise<void>;
  createSavingsAccount: (principal: number, lockPeriod: number, annualInterestRate: number) => Promise<void>;
  withdrawFromSavings: (savingsId: string, isEarly: boolean) => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
  updateUserPremiumStatus: (premiumData: any) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  addRewardPoints: (points: number) => Promise<void>;
  getFeeEstimate: (amount: number, type: string) => any;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { collectRevenue } = useAdmin();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    } else {
      resetUserData();
    }
  }, [currentUser]);

  const resetUserData = () => {
    setUser(null);
    setBalance(0);
    setSavingsBalance(0);
    setRewardPoints(0);
    setTransactions([]);
    setSavingsAccounts([]);
  };

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Load user data from localStorage
      const userData = localStorage.getItem(`user_${currentUser.uid}`);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setBalance(parsedUser.walletBalance || 0);
        setSavingsBalance(parsedUser.savingsBalance || 0);
        setRewardPoints(parsedUser.rewardPoints || 0);
      } else {
        // Create new user
        const newUser: User = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          walletBalance: 0,
          savingsBalance: 0,
          rewardPoints: 0,
          totalEarnedInterest: 0,
          premiumStatus: false,
          referralsCount: 0,
          referralEarnings: 0,
          kycVerified: false,
          createdAt: new Date()
        };
        setUser(newUser);
        setBalance(0);
        setSavingsBalance(0);
        setRewardPoints(0);
        localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(newUser));
      }

      // Load transactions
      const transactionsData = localStorage.getItem(`transactions_${currentUser.uid}`);
      if (transactionsData) {
        const parsedTransactions = JSON.parse(transactionsData).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        setTransactions(parsedTransactions);
      }

      // Load savings accounts
      const savingsData = localStorage.getItem(`savings_${currentUser.uid}`);
      if (savingsData) {
        const parsedSavings = JSON.parse(savingsData).map((s: any) => ({
          ...s,
          startDate: new Date(s.startDate),
          maturityDate: new Date(s.maturityDate)
        }));
        setSavingsAccounts(parsedSavings);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!currentUser || !user) return;

    try {
      const updatedUser = { ...user, walletBalance: newBalance };
      setUser(updatedUser);
      setBalance(newBalance);
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const updateUserPremiumStatus = async (premiumData: any) => {
    if (!currentUser || !user) return;

    try {
      const updatedUser = { ...user, ...premiumData };
      setUser(updatedUser);
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating premium status:', error);
      toast.error('Failed to update premium status');
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!currentUser) return;

    try {
      // Security checks
      const suspiciousPatterns = detectSuspiciousActivity(
        currentUser.uid,
        transaction.amount,
        transaction.type,
        transactions
      );

      if (suspiciousPatterns.length > 0) {
        const highSeverityPatterns = suspiciousPatterns.filter(p => p.severity === 'high');
        if (highSeverityPatterns.length > 0) {
          generateSecurityAuditLog(
            currentUser.uid,
            'suspicious_activity_detected',
            { patterns: suspiciousPatterns, transaction }
          );
          toast.error('Transaction flagged for review due to suspicious activity');
          return;
        }
      }

      const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem(`transactions_${currentUser.uid}`, JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const addRewardPoints = async (points: number) => {
    if (!currentUser || !user) return;

    try {
      const newRewardPoints = rewardPoints + points;
      setRewardPoints(newRewardPoints);
      
      const updatedUser = { ...user, rewardPoints: newRewardPoints };
      setUser(updatedUser);
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));

      if (points > 0) {
        await addTransaction({
          uid: currentUser.uid,
          type: 'reward',
          amount: Math.abs(points * 0.1), // Convert points to currency value
          description: `Reward points earned: ${points} points`,
          status: 'completed',
          direction: '+'
        });
      }
    } catch (error) {
      console.error('Error adding reward points:', error);
    }
  };

  const getFeeEstimate = (amount: number, type: string) => {
    const premiumTier = user?.premiumStatus ? (user as any).premiumPlan || 'plus' : 'basic';
    return getFeeBreakdown(amount, type, premiumTier);
  };

  const sendMoney = async (amount: number, recipient: string, description: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(currentUser.uid, 'transfer');
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitCheck.remainingTime || 0) / 1000)} seconds.`);
    }

    setLoading(true);
    try {
      const feeEstimate = getFeeEstimate(amount, 'p2p');
      const totalDeduction = amount + feeEstimate.totalFee;

      if (totalDeduction > balance) {
        throw new Error('Insufficient balance including fees');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update balance
      const newBalance = balance - totalDeduction;
      await updateUserBalance(newBalance);

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'send',
        amount,
        fee: feeEstimate.totalFee,
        netAmount: amount,
        description,
        status: 'completed',
        direction: '-',
        recipient
      });

      // Collect fee as revenue
      if (feeEstimate.totalFee > 0) {
        await collectRevenue(
          feeEstimate.totalFee,
          'transaction_fee',
          `txn_${Date.now()}`,
          currentUser.uid,
          `P2P transfer fee from ${currentUser.email}`
        );
      }

      // Add reward points (1 point per 100 KES)
      const pointsEarned = Math.floor(amount / 100);
      if (pointsEarned > 0) {
        await addRewardPoints(pointsEarned);
      }

    } catch (error: any) {
      console.error('Error sending money:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdrawMoney = async (amount: number, method: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const feeEstimate = getFeeEstimate(amount, 'withdrawal');
      const totalDeduction = amount + feeEstimate.totalFee;

      if (totalDeduction > balance) {
        throw new Error('Insufficient balance including fees');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update balance
      const newBalance = balance - totalDeduction;
      await updateUserBalance(newBalance);

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'withdrawal',
        amount,
        fee: feeEstimate.totalFee,
        netAmount: feeEstimate.netAmount,
        description: `Withdrawal via ${method}`,
        status: 'completed',
        direction: '-',
        method
      });

      // Collect fee as revenue
      if (feeEstimate.totalFee > 0) {
        await collectRevenue(
          feeEstimate.totalFee,
          'withdrawal_fee',
          `txn_${Date.now()}`,
          currentUser.uid,
          `Withdrawal fee from ${method}`
        );
      }

    } catch (error: any) {
      console.error('Error withdrawing money:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const depositMoney = async (amount: number, method: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update balance (no fees for deposits)
      const newBalance = balance + amount;
      await updateUserBalance(newBalance);

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'deposit',
        amount,
        description: `Deposit via ${method}`,
        status: 'completed',
        direction: '+',
        method
      });

    } catch (error: any) {
      console.error('Error depositing money:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyAirtime = async (amount: number, phoneNumber: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update balance (no fees for airtime)
      const newBalance = balance - amount;
      await updateUserBalance(newBalance);

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'airtime',
        amount,
        description: `Airtime purchase for ${phoneNumber}`,
        status: 'completed',
        direction: '-',
        recipient: phoneNumber
      });

      // Add reward points
      const pointsEarned = Math.floor(amount / 200); // 1 point per 200 KES
      if (pointsEarned > 0) {
        await addRewardPoints(pointsEarned);
      }

    } catch (error: any) {
      console.error('Error buying airtime:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyData = async (amount: number, phoneNumber: string, bundle: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update balance (no fees for data)
      const newBalance = balance - amount;
      await updateUserBalance(newBalance);

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'data',
        amount,
        description: `Data bundle: ${bundle} for ${phoneNumber}`,
        status: 'completed',
        direction: '-',
        recipient: phoneNumber
      });

      // Add reward points
      const pointsEarned = Math.floor(amount / 200); // 1 point per 200 KES
      if (pointsEarned > 0) {
        await addRewardPoints(pointsEarned);
      }

    } catch (error: any) {
      console.error('Error buying data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createSavingsAccount = async (principal: number, lockPeriod: number, annualInterestRate: number) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (principal > balance) {
        throw new Error('Insufficient balance for savings deposit');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create savings account
      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + lockPeriod);

      const newSavingsAccount: SavingsAccount = {
        id: `sav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: currentUser.uid,
        principal,
        lockPeriod,
        annualInterestRate,
        startDate,
        maturityDate,
        status: 'active'
      };

      const updatedSavings = [...savingsAccounts, newSavingsAccount];
      setSavingsAccounts(updatedSavings);
      localStorage.setItem(`savings_${currentUser.uid}`, JSON.stringify(updatedSavings));

      // Update balances
      const newWalletBalance = balance - principal;
      const newSavingsBalance = savingsBalance + principal;
      
      await updateUserBalance(newWalletBalance);
      setSavingsBalance(newSavingsBalance);

      // Update user data
      if (user) {
        const updatedUser = { ...user, savingsBalance: newSavingsBalance };
        setUser(updatedUser);
        localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));
      }

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_deposit',
        amount: principal,
        description: `Savings deposit - ${lockPeriod} months at ${annualInterestRate}%`,
        status: 'completed',
        direction: '-'
      });

    } catch (error: any) {
      console.error('Error creating savings account:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdrawFromSavings = async (savingsId: string, isEarly: boolean) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const savingsAccount = savingsAccounts.find(s => s.id === savingsId);
      if (!savingsAccount) {
        throw new Error('Savings account not found');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      let withdrawalAmount = savingsAccount.principal;
      let penalty = 0;

      if (isEarly) {
        penalty = Math.round(savingsAccount.principal * 0.05); // 5% penalty
        withdrawalAmount = savingsAccount.principal - penalty;
      } else {
        // Calculate earned interest for matured account
        const monthlyRate = savingsAccount.annualInterestRate / 12 / 100;
        const maturityValue = savingsAccount.principal * Math.pow(1 + monthlyRate, savingsAccount.lockPeriod);
        withdrawalAmount = Math.round(maturityValue);
      }

      // Update savings accounts
      const updatedSavings = savingsAccounts.map(s => 
        s.id === savingsId ? { ...s, status: 'withdrawn' as const } : s
      );
      setSavingsAccounts(updatedSavings);
      localStorage.setItem(`savings_${currentUser.uid}`, JSON.stringify(updatedSavings));

      // Update balances
      const newWalletBalance = balance + withdrawalAmount;
      const newSavingsBalance = savingsBalance - savingsAccount.principal;
      
      await updateUserBalance(newWalletBalance);
      setSavingsBalance(newSavingsBalance);

      // Update user data
      if (user) {
        const updatedUser = { ...user, savingsBalance: newSavingsBalance };
        setUser(updatedUser);
        localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));
      }

      // Add transaction
      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_withdrawal',
        amount: withdrawalAmount,
        description: isEarly 
          ? `Early savings withdrawal (${penalty} KES penalty)` 
          : 'Savings maturity withdrawal',
        status: 'completed',
        direction: '+'
      });

      // Collect penalty as revenue if early withdrawal
      if (penalty > 0) {
        await collectRevenue(
          penalty,
          'early_withdrawal_penalty',
          savingsId,
          currentUser.uid,
          `Early withdrawal penalty from savings account ${savingsId}`
        );
      }

    } catch (error: any) {
      console.error('Error withdrawing from savings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    balance,
    savingsBalance,
    rewardPoints,
    transactions,
    savingsAccounts,
    sendMoney,
    withdrawMoney,
    depositMoney,
    buyAirtime,
    buyData,
    createSavingsAccount,
    withdrawFromSavings,
    updateUserBalance,
    updateUserPremiumStatus,
    addTransaction,
    addRewardPoints,
    getFeeEstimate,
    loading
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};