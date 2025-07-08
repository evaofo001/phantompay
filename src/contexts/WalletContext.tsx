import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { calculateFee, getFeeBreakdown } from '../utils/feeCalculator';
import { autoCollectTransactionFee, collectPremiumSubscription } from '../utils/revenueCollector';
import { Transaction, SavingsAccount, User } from '../types';
import { db } from '../config/firebase';
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
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
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

        await setDoc(userDocRef, newUser);
        setUser(newUser);
        setBalance(0);
        setSavingsBalance(0);
        setRewardPoints(0);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      toast.error('Failed to load user data');
    }
  };

  // Initialize user data from Firestore
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

  // Listen to transactions
  useEffect(() => {
    if (!currentUser) return;

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsList: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        transactionsList.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as Transaction);
      });
      setTransactions(transactionsList);
    }, (error) => {
      console.error('Error listening to transactions:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to savings accounts
  useEffect(() => {
    if (!currentUser) return;

    const savingsQuery = query(
      collection(db, 'savings'),
      where('uid', '==', currentUser.uid),
      orderBy('startDate', 'desc')
    );

    const unsubscribe = onSnapshot(savingsQuery, (snapshot) => {
      const savingsList: SavingsAccount[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        savingsList.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          maturityDate: data.maturityDate.toDate()
        } as SavingsAccount);
      });
      setSavingsAccounts(savingsList);
    }, (error) => {
      console.error('Error listening to savings:', error);
    });

    return () => unsubscribe();
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
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updateData: any = { walletBalance: newBalance };
      
      if (newSavingsBalance !== undefined) {
        updateData.savingsBalance = newSavingsBalance;
      }
      
      if (newRewardPoints !== undefined) {
        updateData.rewardPoints = newRewardPoints;
      }

      await updateDoc(userDocRef, updateData);
      
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
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, premiumData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating premium status:', error);
      toast.error('Failed to update premium status');
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        timestamp: new Date()
      });

      // Collect fees to admin wallet if there's a fee
      if (transactionData.fee && transactionData.fee > 0) {
        await autoCollectTransactionFee(
          transactionData.fee,
          docRef.id,
          transactionData.uid,
          transactionData.type
        );
      }

      // Deduct balance for subscription transactions and collect revenue
      if (transactionData.type === 'subscription' && transactionData.amount > 0) {
        const newBalance = balance - transactionData.amount;
        await updateUserBalance(newBalance);
        
        // Collect premium subscription revenue
        const planType = (user as any)?.premiumPlan || 'plus';
        await collectPremiumSubscription(
          transactionData.amount,
          transactionData.uid,
          planType
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

      const newSavingsAccount: Omit<SavingsAccount, 'id'> = {
        uid: currentUser.uid,
        principal: amount,
        lockPeriod,
        annualInterestRate: finalAnnualRate,
        startDate,
        maturityDate,
        status: 'active'
      };

      await addDoc(collection(db, 'savings'), newSavingsAccount);

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

      if (isEarly) {
        penalty = savingsAccount.principal * 0.05; // 5% penalty
        withdrawalAmount = savingsAccount.principal - penalty;
      }

      const newBalance = balance + withdrawalAmount;
      const newSavingsBalance = savingsBalance - savingsAccount.principal;
      await updateUserBalance(newBalance, newSavingsBalance);

      await addTransaction({
        uid: currentUser.uid,
        type: 'savings_withdrawal',
        amount: withdrawalAmount,
        fee: penalty,
        description: isEarly ? 'Early savings withdrawal' : 'Savings maturity withdrawal',
        status: 'completed',
        direction: '+'
      });

      // Delete the savings account
      await deleteDoc(doc(db, 'savings', savingsId));
    } finally {
      setLoading(false);
    }
  };

  const addRewardPoints = async (points: number) => {
    if (!currentUser) return;
    
    const newRewardPoints = rewardPoints + points;
    await updateUserBalance(balance, undefined, newRewardPoints);
  };

  const refreshBalance = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setBalance(userData.walletBalance || 0);
        setSavingsBalance(userData.savingsBalance || 0);
        setRewardPoints(userData.rewardPoints || 0);
        setUser(userData);
      }
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