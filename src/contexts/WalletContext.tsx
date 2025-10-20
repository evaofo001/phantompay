import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { User, Transaction, SavingsAccount } from '../types';
import { 
  getUserDocument,
  createUserDocument,
  updateUserDocument,
  addTransaction,
  getUserTransactions,
  addSavingsAccount,
  updateSavingsAccount,
  getUserSavingsAccounts,
  migrateUserDataFromLocalStorage
} from '../utils/firestoreHelpers';
import { calculateFee, getFeeBreakdown } from '../utils/feeCalculator';
import { calculateCurrentSavingsValue, calculateEarlyWithdrawalPenalty } from '../utils/savingsCalculator';
import { autoCollectTransactionFee, collectPremiumSubscription, deductFromAdminWallet } from '../utils/revenueCollector';
import toast from 'react-hot-toast';

interface WalletContextType {
  user: User | null;
  balance: number;
  savingsBalance: number;
  rewardPoints: number;
  transactions: Transaction[];
  savingsAccounts: SavingsAccount[];
  sendMoney: (amount: number, recipient: string, description: string) => Promise<void>;
  depositMoney: (amount: number, method: string) => Promise<void>;
  withdrawMoney: (amount: number, method: string) => Promise<void>;
  buyAirtime: (amount: number, phoneNumber: string) => Promise<void>;
  buyData: (amount: number, phoneNumber: string, bundle: string) => Promise<void>;
  addRewardPoints: (points: number) => Promise<void>;
  createSavingsAccount: (amount: number, lockPeriod: number, interestRate: number) => Promise<void>;
  withdrawFromSavings: (savingsId: string, isEarly: boolean) => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
  updateUserPremiumStatus: (premiumData: any) => Promise<void>;
  getFeeEstimate: (amount: number, type: string) => { totalFee: number; premiumDiscount: number };
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize user data when authenticated
  useEffect(() => {
    if (!currentUser) {
      setUser(null);
      setTransactions([]);
      setSavingsAccounts([]);
      setLoading(false);
      return;
    }

    let unsubscribeTransactions: (() => void) | undefined;
    let unsubscribeSavings: (() => void) | undefined;

    const initializeUserData = async () => {
      setLoading(true);
      try {
        // Try to migrate data from localStorage first
        await migrateUserDataFromLocalStorage(currentUser.uid);

        // Get or create user document
        let userData = await getUserDocument(currentUser.uid);

        if (!userData) {
          // Create new user document
          const newUserData: Partial<User> = {
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            walletBalance: 0,
            savingsBalance: 0,
            rewardPoints: 0,
            totalEarnedInterest: 0,
            premiumStatus: false,
            premiumPlan: 'basic',
            referralsCount: 0,
            referralEarnings: 0,
            kycVerified: false
          };

          await createUserDocument(currentUser.uid, newUserData);
          userData = await getUserDocument(currentUser.uid);
        }

        setUser(userData);

        // Set up real-time listeners
        unsubscribeTransactions = getUserTransactions(currentUser.uid, (transactionsList) => {
          setTransactions(transactionsList);
        });

        unsubscribeSavings = getUserSavingsAccounts(currentUser.uid, (savingsList) => {
          setSavingsAccounts(savingsList);

          // Update savings balance
          const totalSavings = savingsList.reduce((total, account) => {
            if (account.status === 'active') {
              const currentValue = calculateCurrentSavingsValue(
                account.principal,
                account.startDate,
                account.lockPeriod,
                account.annualInterestRate
              );
              return total + currentValue.currentValue;
            }
            return total;
          }, 0);

          // Update user's savings balance
          if (userData && totalSavings !== userData.savingsBalance) {
            updateUserDocument(currentUser.uid, { savingsBalance: totalSavings });
          }
        });
      } catch (error) {
        console.error('Error initializing user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    initializeUserData();

    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeSavings) unsubscribeSavings();
    };
  }, [currentUser]);

  const getUserPremiumTier = () => {
    if (!user?.premiumStatus) return 'basic';
    return (user as any).premiumPlan || 'basic';
  };

  const sendMoney = async (amount: number, recipient: string, description: string) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'p2p', premiumTier);
      const totalDeduction = amount + feeBreakdown.totalFee;

      if (totalDeduction > user.walletBalance) {
        throw new Error('Insufficient balance including fees');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create transaction record
      const transactionId = await addTransaction({
        uid: currentUser.uid,
        type: 'send',
        amount,
        fee: feeBreakdown.totalFee,
        netAmount: amount,
        description,
        status: 'completed',
        recipient,
        direction: '-'
      });

      // Update user balance
      const newBalance = user.walletBalance - totalDeduction;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

      // Collect fee revenue
      if (feeBreakdown.totalFee > 0) {
        await collectRevenue(
          feeBreakdown.totalFee,
          'transaction_fee',
          transactionId,
          currentUser.uid,
          `P2P transfer fee (${premiumTier} tier)`
        );
      }

      // Add reward points (1 point per KES 100 transferred)
      const rewardPoints = Math.floor(amount / 100);
      if (rewardPoints > 0) {
        await addRewardPoints(rewardPoints, 'money transfer');
      }

    } catch (error: any) {
      console.error('Error sending money:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const depositMoney = async (amount: number, method: string) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create transaction record
      await addTransaction({
        uid: currentUser.uid,
        type: 'deposit',
        amount,
        description: `Deposit via ${method}`,
        status: 'completed',
        method,
        direction: '+'
      });

      // Update user balance
      const newBalance = user.walletBalance + amount;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

      // Add reward points (1 point per KES 500 deposited)
      const rewardPoints = Math.floor(amount / 500);
      if (rewardPoints > 0) {
        await addRewardPoints(rewardPoints, 'deposit');
      }

    } catch (error: any) {
      console.error('Error depositing money:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdrawMoney = async (amount: number, method: string) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const premiumTier = getUserPremiumTier();
      const feeBreakdown = getFeeBreakdown(amount, 'withdrawal', premiumTier);
      const totalDeduction = amount + feeBreakdown.totalFee;

      if (totalDeduction > user.walletBalance) {
        throw new Error('Insufficient balance including fees');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create transaction record
      const transactionId = await addTransaction({
        uid: currentUser.uid,
        type: 'withdrawal',
        amount,
        fee: feeBreakdown.totalFee,
        netAmount: feeBreakdown.netAmount,
        description: `Withdrawal via ${method}`,
        status: 'completed',
        method,
        direction: '-'
      });

      // Update user balance
      const newBalance = user.walletBalance - totalDeduction;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

      // Collect fee revenue
      if (feeBreakdown.totalFee > 0) {
        await collectRevenue(
          feeBreakdown.totalFee,
          'withdrawal_fee',
          transactionId,
          currentUser.uid,
          `Withdrawal fee (${premiumTier} tier)`
        );
      }

    } catch (error: any) {
      console.error('Error withdrawing money:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyAirtime = async (amount: number, phoneNumber: string) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (amount > user.walletBalance) {
        throw new Error('Insufficient balance');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create transaction record
      await addTransaction({
        uid: currentUser.uid,
        type: 'airtime',
        amount,
        description: `Airtime for ${phoneNumber}`,
        status: 'completed',
        recipient: phoneNumber,
        direction: '-'
      });

      // Update user balance
      const newBalance = user.walletBalance - amount;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

      // Add reward points
      const rewardPoints = Math.floor(amount / 200);
      if (rewardPoints > 0) {
        await addRewardPoints(rewardPoints, 'airtime purchase');
      }

    } catch (error: any) {
      console.error('Error buying airtime:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buyData = async (amount: number, phoneNumber: string, bundle: string) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (amount > user.walletBalance) {
        throw new Error('Insufficient balance');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create transaction record
      await addTransaction({
        uid: currentUser.uid,
        type: 'data',
        amount,
        description: `Data bundle: ${bundle} for ${phoneNumber}`,
        status: 'completed',
        recipient: phoneNumber,
        direction: '-'
      });

      // Update user balance
      const newBalance = user.walletBalance - amount;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

      // Add reward points
      const rewardPoints = Math.floor(amount / 200);
      if (rewardPoints > 0) {
        await addRewardPoints(rewardPoints, 'data purchase');
      }

    } catch (error: any) {
      console.error('Error buying data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addRewardPoints = async (points: number, activity: string = 'Reward points') => {
    if (!currentUser || !user) return;
    
    try {
      const newRewardPoints = (user.rewardPoints || 0) + points;
      await updateUserDocument(currentUser.uid, { rewardPoints: newRewardPoints });

      // Create transaction record for reward activity
      await addTransaction({
        uid: currentUser.uid,
        type: 'reward',
        amount: Math.abs(points),
        description: points > 0 
          ? `Earned ${points} points from ${activity}` 
          : `Redeemed ${Math.abs(points)} points for ${activity}`,
        status: 'completed',
        direction: points > 0 ? '+' : '-'
      });

      // If points are being redeemed (negative), handle the cost
      if (points < 0) {
        const pointValue = Math.abs(points) * 0.1; // 10 points = 1 KES
        await deductFromAdminWallet(
          pointValue,
          currentUser.uid,
          'reward_points',
          `Reward points redemption: ${Math.abs(points)} points`
        );
      }

    } catch (error) {
      console.error('Error updating reward points:', error);
    }
  };

  const createSavingsAccount = async (amount: number, lockPeriod: number, interestRate: number) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (amount > user.walletBalance) {
        throw new Error('Insufficient balance');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + lockPeriod);

      // Create savings account
      await addSavingsAccount({
        uid: currentUser.uid,
        principal: amount,
        lockPeriod,
        annualInterestRate: interestRate,
        startDate,
        maturityDate,
        status: 'active',
        currentValue: amount,
        earnedInterest: 0
      });

      // Create transaction record
      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_deposit',
        amount,
        description: `Savings deposit - ${lockPeriod} month(s) at ${interestRate}%`,
        status: 'completed',
        direction: '-'
      });

      // Update user balance
      const newBalance = user.walletBalance - amount;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

    } catch (error: any) {
      console.error('Error creating savings account:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdrawFromSavings = async (savingsId: string, isEarly: boolean) => {
    if (!currentUser || !user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const savingsAccount = savingsAccounts.find(s => s.id === savingsId);
      if (!savingsAccount) {
        throw new Error('Savings account not found');
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate current value
      const currentValue = calculateCurrentSavingsValue(
        savingsAccount.principal,
        savingsAccount.startDate,
        savingsAccount.lockPeriod,
        savingsAccount.annualInterestRate
      );

      let withdrawalAmount = currentValue.currentValue;
      let penalty = 0;

      if (isEarly) {
        penalty = calculateEarlyWithdrawalPenalty(savingsAccount.principal);
        withdrawalAmount = savingsAccount.principal - penalty;

        // Collect penalty as revenue
        if (penalty > 0) {
          await collectRevenue(
            penalty,
            'early_withdrawal_penalty',
            `savings_${savingsId}`,
            currentUser.uid,
            `Early withdrawal penalty from savings account`
          );
        }
      }

      // Update savings account status
      await updateSavingsAccount(savingsId, {
        status: 'withdrawn',
        currentValue: 0,
        earnedInterest: currentValue.earnedInterest
      });

      // Create transaction record
      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_withdrawal',
        amount: withdrawalAmount,
        description: `Savings withdrawal${isEarly ? ' (early)' : ''} - ${savingsAccount.lockPeriod} month(s)`,
        status: 'completed',
        direction: '+'
      });

      // Update user balance
      const newBalance = user.walletBalance + withdrawalAmount;
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });

      // If not early withdrawal, pay out the interest as an expense
      if (!isEarly && currentValue.earnedInterest > 0) {
        await deductFromAdminWallet(
          currentValue.earnedInterest,
          currentUser.uid,
          'savings_interest',
          `Savings interest payout for ${lockPeriod} month savings`
        );
      }

    } catch (error: any) {
      console.error('Error withdrawing from savings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  };

  const updateUserPremiumStatus = async (premiumData: any) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      await updateUserDocument(currentUser.uid, premiumData);

      // If upgrading to premium, collect subscription fee
      if (premiumData.premiumStatus && premiumData.premiumPlan !== 'basic') {
        const subscriptionFee = premiumData.premiumPlan === 'vip' ? 500 : 200;
        
        await collectRevenue(
          subscriptionFee,
          'premium_subscription',
          `subscription_${Date.now()}`,
          currentUser.uid,
          `${premiumData.premiumPlan.toUpperCase()} premium subscription`
        );
      }

    } catch (error) {
      console.error('Error updating premium status:', error);
      throw error;
    }
  };

  const getFeeEstimate = (amount: number, type: string) => {
    const premiumTier = getUserPremiumTier();
    const feeBreakdown = getFeeBreakdown(amount, type, premiumTier);
    
    return {
      totalFee: feeBreakdown.totalFee,
      premiumDiscount: feeBreakdown.premiumDiscount || 0
    };
  };

  const value = {
    user,
    balance: user?.walletBalance || 0,
    savingsBalance: user?.savingsBalance || 0,
    rewardPoints: user?.rewardPoints || 0,
    transactions,
    savingsAccounts,
    sendMoney,
    depositMoney,
    withdrawMoney,
    buyAirtime,
    buyData,
    addRewardPoints,
    createSavingsAccount,
    withdrawFromSavings,
    updateUserBalance,
    updateUserPremiumStatus,
    getFeeEstimate,
    loading
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};