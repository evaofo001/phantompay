import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { calculateFee, getFeeBreakdown } from '../utils/feeCalculator';
import { Transaction, SavingsAccount, User } from '../types';
import toast from 'react-hot-toast';

interface WalletContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  savingsBalance: number;
  rewardPoints: number;
  transactions: Transaction[];
  savingsAccounts: SavingsAccount[];
  sendMoney: (amount: number, recipient: string, description?: string) => Promise<void>;
  buyAirtime: (amount: number, phoneNumber: string) => Promise<void>;
  buyData: (amount: number, phoneNumber: string, bundle: string) => Promise<void>;
  depositMoney: (amount: number, method: string) => Promise<void>;
  withdrawMoney: (amount: number, method: string) => Promise<void>;
  createSavingsAccount: (amount: number, lockPeriod: number, annualRate: number) => Promise<void>;
  withdrawFromSavings: (savingsId: string, isEarly?: boolean) => Promise<void>;
  addRewardPoints: (points: number) => void;
  refreshBalance: () => Promise<void>;
  getFeeEstimate: (amount: number, type: string) => any;
  updateUserPremiumStatus: (premiumData: any) => Promise<void>;
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => Promise<void>;
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

  // Get user's premium tier for fee calculations
  const getUserPremiumTier = () => {
    if (!user?.premiumStatus) return 'basic';
    return (user as any).premiumPlan || 'basic';
  };

  // Initialize user data
  const initializeUser = async () => {
    if (!currentUser) return;

    try {
      // Check if user data exists in localStorage
      const savedUserData = localStorage.getItem(`user_${currentUser.uid}`);
      
      if (savedUserData) {
        const userData = JSON.parse(savedUserData) as User;
        setUser(userData);
        setBalance(userData.walletBalance || 0);
        setSavingsBalance(userData.savingsBalance || 0);
        setRewardPoints(userData.rewardPoints || 0);
      } else {
        // Create new user document
        const newUser: User = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'User',
          walletBalance: 0, // Fresh start - no balance
          savingsBalance: 0,
          rewardPoints: 0, // Fresh start - no points
          totalEarnedInterest: 0,
          premiumStatus: false,
          referralsCount: 0,
          referralEarnings: 0,
          kycVerified: false,
          createdAt: new Date()
        };

        localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(newUser));
        setUser(newUser);
        setBalance(0);
        setSavingsBalance(0);
        setRewardPoints(0);
      }

      // Load transactions
      const savedTransactions = localStorage.getItem(`transactions_${currentUser.uid}`);
      if (savedTransactions) {
        const transactionsList = JSON.parse(savedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        setTransactions(transactionsList);
      }

      // Load savings accounts
      const savedSavings = localStorage.getItem(`savings_${currentUser.uid}`);
      if (savedSavings) {
        const savingsList = JSON.parse(savedSavings).map((s: any) => ({
          ...s,
          startDate: new Date(s.startDate),
          maturityDate: new Date(s.maturityDate)
        }));
        setSavingsAccounts(savingsList);
      }

    } catch (error) {
      console.error('Error initializing user:', error);
      toast.error('Failed to load user data');
    }
  };

  // Initialize user data when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setUser(null);
      setBalance(0);
      setSavingsBalance(0);
      setRewardPoints(0);
      setTransactions([]);
      setSavingsAccounts([]);
      return;
    }

    initializeUser();
  }, [currentUser]);

  const updateUserBalance = async (newBalance: number, newSavingsBalance?: number, newRewardPoints?: number) => {
    if (!currentUser || !user) return;

    const updatedUser = {
      ...user,
      walletBalance: newBalance,
      savingsBalance: newSavingsBalance !== undefined ? newSavingsBalance : user.savingsBalance,
      rewardPoints: newRewardPoints !== undefined ? newRewardPoints : user.rewardPoints || 0
    };

    try {
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));
      
      setBalance(newBalance);
      if (newSavingsBalance !== undefined) setSavingsBalance(newSavingsBalance);
      if (newRewardPoints !== undefined) setRewardPoints(newRewardPoints);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const updateUserPremiumStatus = async (premiumData: any) => {
    if (!currentUser || !user) return;

    const updatedUser = {
      ...user,
      ...premiumData
    };

    try {
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating premium status:', error);
      toast.error('Failed to update premium status');
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;

    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      
      // Save to localStorage
      localStorage.setItem(`transactions_${currentUser.uid}`, JSON.stringify(updatedTransactions));

      // Collect fees to admin wallet if there's a fee
      if (transactionData.fee && transactionData.fee > 0) {
        await collectRevenue(
          transactionData.fee,
          'transaction_fee',
          newTransaction.id,
          transactionData.uid,
          `${transactionData.type} transaction fee`
        );
      }

      // Deduct balance for subscription transactions and collect revenue
      if (transactionData.type === 'subscription' && transactionData.amount > 0) {
        const newBalance = balance - transactionData.amount;
        await updateUserBalance(newBalance);
        
        // Collect premium subscription revenue
        const planType = (user as any)?.premiumPlan || 'plus';
        await collectRevenue(
          transactionData.amount,
          'premium_subscription',
          newTransaction.id,
          transactionData.uid,
          `${planType} premium subscription`
        );
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to record transaction');
    }
  };

  const sendMoney = async (amount: number, recipient: string, description = 'Money transfer') => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'p2p', premiumTier);
      const totalDeduction = amount + feeBreakdown.totalFee;
      
      if (totalDeduction > balance) {
        throw new Error('Insufficient balance including fees');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newBalance = balance - totalDeduction;
      await updateUserBalance(newBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'send',
        amount,
        fee: feeBreakdown.totalFee,
        netAmount: feeBreakdown.netAmount,
        description,
        status: 'completed',
        recipient,
        direction: '-'
      });
      
      // Add reward points based on premium tier
      const cashbackRate = premiumTier === 'vip' ? 0.05 : premiumTier === 'plus' ? 0.02 : 0;
      if (cashbackRate > 0) {
        const rewardPointsEarned = Math.floor(amount * cashbackRate);
        if (rewardPointsEarned > 0) {
          await updateUserBalance(newBalance, undefined, rewardPoints + rewardPointsEarned);
          toast.success(`Earned ${rewardPointsEarned} cashback points! 🎉`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const buyAirtime = async (amount: number, phoneNumber: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'airtime', premiumTier);
      const totalDeduction = amount + feeBreakdown.totalFee;
      
      if (totalDeduction > balance) {
        throw new Error('Insufficient balance');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newBalance = balance - totalDeduction;
      await updateUserBalance(newBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'airtime',
        amount,
        fee: feeBreakdown.totalFee,
        description: `Airtime for ${phoneNumber}`,
        status: 'completed',
        direction: '-'
      });
    } finally {
      setLoading(false);
    }
  };

  const buyData = async (amount: number, phoneNumber: string, bundle: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'data', premiumTier);
      const totalDeduction = amount + feeBreakdown.totalFee;
      
      if (totalDeduction > balance) {
        throw new Error('Insufficient balance');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newBalance = balance - totalDeduction;
      await updateUserBalance(newBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'data',
        amount,
        fee: feeBreakdown.totalFee,
        description: `${bundle} for ${phoneNumber}`,
        status: 'completed',
        direction: '-'
      });
    } finally {
      setLoading(false);
    }
  };

  const depositMoney = async (amount: number, method: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'deposit', premiumTier);
      const netAmount = amount - feeBreakdown.totalFee;

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBalance = balance + netAmount;
      await updateUserBalance(newBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'deposit',
        amount,
        fee: feeBreakdown.totalFee,
        netAmount,
        description: `Deposit via ${method}`,
        status: 'completed',
        method,
        direction: '+'
      });
    } finally {
      setLoading(false);
    }
  };

  const withdrawMoney = async (amount: number, method: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'withdrawal', premiumTier);
      const totalDeduction = amount + feeBreakdown.totalFee;
      
      if (totalDeduction > balance) {
        throw new Error('Insufficient balance including fees');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBalance = balance - totalDeduction;
      await updateUserBalance(newBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'withdrawal',
        amount,
        fee: feeBreakdown.totalFee,
        netAmount: feeBreakdown.netAmount,
        description: `Withdrawal to ${method}`,
        status: 'completed',
        method,
        direction: '-'
      });
    } finally {
      setLoading(false);
    }
  };

  const createSavingsAccount = async (amount: number, lockPeriod: number, annualRate: number) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      // Apply premium tier bonus to savings interest
      const premiumTier = getUserPremiumTier();
      let finalAnnualRate = annualRate;
      
      if (premiumTier === 'plus') {
        finalAnnualRate = 12; // Plus tier gets 12%
      } else if (premiumTier === 'vip') {
        finalAnnualRate = 18; // VIP tier gets 18%
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + lockPeriod);

      const newSavingsAccount: SavingsAccount = {
        id: `savings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: currentUser.uid,
        principal: amount,
        lockPeriod,
        annualInterestRate: finalAnnualRate,
        startDate,
        maturityDate,
        status: 'active'
      };

      const updatedSavings = [newSavingsAccount, ...savingsAccounts];
      setSavingsAccounts(updatedSavings);
      localStorage.setItem(`savings_${currentUser.uid}`, JSON.stringify(updatedSavings));

      const newBalance = balance - amount;
      const newSavingsBalance = savingsBalance + amount;
      await updateUserBalance(newBalance, newSavingsBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_deposit',
        amount,
        description: `Savings deposit - ${lockPeriod} months at ${finalAnnualRate}%`,
        status: 'completed',
        direction: '-'
      });

      if (finalAnnualRate > annualRate) {
        toast.success(`Premium bonus applied! Earning ${finalAnnualRate}% instead of ${annualRate}% 🎉`);
      }
    } finally {
      setLoading(false);
    }
  };

  const withdrawFromSavings = async (savingsId: string, isEarly = false) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const savingsAccount = savingsAccounts.find(s => s.id === savingsId);
      if (!savingsAccount) {
        throw new Error('Savings account not found');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      let withdrawalAmount = savingsAccount.currentValue || savingsAccount.principal;
      let penalty = 0;
      let interestEarned = 0;

      if (isEarly) {
        penalty = savingsAccount.principal * 0.05; // 5% penalty
        withdrawalAmount = savingsAccount.principal - penalty;
      } else {
        // Calculate interest for matured savings
        const monthsElapsed = savingsAccount.lockPeriod;
        const monthlyRate = savingsAccount.annualInterestRate / 12 / 100;
        const totalValue = savingsAccount.principal * Math.pow(1 + monthlyRate, monthsElapsed);
        interestEarned = totalValue - savingsAccount.principal;
        withdrawalAmount = totalValue;
      }

      const newBalance = balance + withdrawalAmount;
      const newSavingsBalance = savingsBalance - savingsAccount.principal;
      await updateUserBalance(newBalance, newSavingsBalance);

      // If there's interest to be paid, it comes from admin wallet (expense)
      if (interestEarned > 0) {
        await collectRevenue(
          -interestEarned, // Negative amount = expense
          'savings_interest',
          savingsId,
          currentUser.uid,
          `Savings interest payment: ${interestEarned} KES for account ${savingsId}`
        );
      }

      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_withdrawal',
        amount: withdrawalAmount,
        fee: penalty,
        description: isEarly ? 'Early savings withdrawal' : 'Savings maturity withdrawal',
        status: 'completed',
        direction: '+'
      });

      // Remove the savings account
      const updatedSavings = savingsAccounts.filter(s => s.id !== savingsId);
      setSavingsAccounts(updatedSavings);
      localStorage.setItem(`savings_${currentUser.uid}`, JSON.stringify(updatedSavings));
    } finally {
      setLoading(false);
    }
  };

  const addRewardPoints = async (points: number) => {
    if (!currentUser) return;
    
    // Calculate cost of reward points (1 point = 0.1 KES)
    const pointsCost = Math.abs(points) * 0.1;
    
    if (points < 0) {
      // Redeeming points - this is an expense from admin wallet
      await collectRevenue(
        -pointsCost, // Negative amount = expense
        'reward_points',
        `reward_redemption_${Date.now()}`,
        currentUser.uid,
        `Reward points redemption: ${Math.abs(points)} points (${pointsCost} KES cost)`
      );
    }
    
    const newRewardPoints = rewardPoints + points;
    await updateUserBalance(balance, undefined, newRewardPoints);
  };

  const refreshBalance = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await initializeUser();
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  };

  const getFeeEstimate = (amount: number, type: string) => {
    const premiumTier = getUserPremiumTier();
    return getFeeBreakdown(amount, type, premiumTier);
  };

  const value = {
    user,
    setUser,
    balance,
    setBalance,
    savingsBalance,
    rewardPoints,
    transactions,
    savingsAccounts,
    sendMoney,
    buyAirtime,
    buyData,
    depositMoney,
    withdrawMoney,
    createSavingsAccount,
    withdrawFromSavings,
    addRewardPoints,
    refreshBalance,
    getFeeEstimate,
    updateUserPremiumStatus,
    addTransaction,
    loading
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};