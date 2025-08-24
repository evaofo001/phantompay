import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { User, Transaction, SavingsAccount } from '../types';
import { detectSuspiciousActivity, generateSecurityAuditLog } from '../utils/securityUtils';
import { checkRateLimit } from '../utils/rateLimiter';
import { calculateFee, getFeeBreakdown } from '../utils/feeCalculator';
import { 
  getUserDocument, 
  createUserDocument, 
  updateUserDocument, 
  updateUserBalance as firestoreUpdateUserBalance,
  addTransaction as firestoreAddTransaction,
  getUserTransactions,
  addSavingsAccount,
  updateSavingsAccount,
  getUserSavingsAccounts,
  migrateUserDataFromLocalStorage
} from '../utils/firestoreHelpers';
import { onSnapshot, doc, updateDoc, increment } from '../config/firebase';
import { db } from '../config/firebase';
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
      
      // Try to migrate data from localStorage first
      await migrateUserDataFromLocalStorage(currentUser.uid);
      
      // Set up real-time listener for user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, async (doc) => {
        if (doc.exists()) {
          const userData = { uid: currentUser.uid, ...doc.data() } as User;
          setUser(userData);
          setBalance(userData.walletBalance || 0);
          setSavingsBalance(userData.savingsBalance || 0);
          setRewardPoints(userData.rewardPoints || 0);
        } else {
          // Create new user document
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
          
          await createUserDocument(currentUser.uid, newUser);
        }
      });

      // Set up real-time listener for transactions
      const unsubscribeTransactions = getUserTransactions(currentUser.uid, (transactionsList) => {
        setTransactions(transactionsList);
      });

      // Set up real-time listener for savings accounts
      const unsubscribeSavings = getUserSavingsAccounts(currentUser.uid, (savingsList) => {
        setSavingsAccounts(savingsList);
      });

      // Cleanup function
      return () => {
        unsubscribeUser();
        unsubscribeTransactions();
        unsubscribeSavings();
      };

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!currentUser || !user) return;

    try {
      await updateUserDocument(currentUser.uid, { walletBalance: newBalance });
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const updateUserPremiumStatus = async (premiumData: any) => {
    if (!currentUser || !user) return;

    try {
      await updateUserDocument(currentUser.uid, premiumData);
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

      await firestoreAddTransaction(transaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const addRewardPoints = async (points: number) => {
    if (!currentUser || !user) return;

    try {
      // Update user document with new reward points
      await updateDoc(doc(db, 'users', currentUser.uid), {
        rewardPoints: increment(points)
      });

      if (points > 0) {
        await addTransaction({
          uid: currentUser.uid,
          type: 'reward',
          amount: Math.abs(points * 0.1),
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

      // Update balance atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(-totalDeduction)
      });

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

      // Update balance atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(-totalDeduction)
      });

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

      // Update balance atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(amount)
      });

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

      // Update balance atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(-amount)
      });

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
      const pointsEarned = Math.floor(amount / 200);
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

      // Update balance atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(-amount)
      });

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
      const pointsEarned = Math.floor(amount / 200);
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

      const newSavingsAccount: Omit<SavingsAccount, 'id'> = {
        uid: currentUser.uid,
        principal,
        lockPeriod,
        annualInterestRate,
        startDate,
        maturityDate,
        status: 'active'
      };

      await addSavingsAccount(newSavingsAccount);

      // Update balances atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(-principal),
        savingsBalance: increment(principal)
      });

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
        penalty = Math.round(savingsAccount.principal * 0.05);
        withdrawalAmount = savingsAccount.principal - penalty;
      } else {
        // Calculate earned interest for matured account
        const monthlyRate = savingsAccount.annualInterestRate / 12 / 100;
        const maturityValue = savingsAccount.principal * Math.pow(1 + monthlyRate, savingsAccount.lockPeriod);
        withdrawalAmount = Math.round(maturityValue);
      }

      // Update savings account status
      await updateSavingsAccount(savingsId, { status: 'withdrawn' });

      // Update balances atomically
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(withdrawalAmount),
        savingsBalance: increment(-savingsAccount.principal)
      });

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