import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface RevenueCollectionData {
  amount: number;
  type: 'transaction_fee' | 'premium_subscription' | 'withdrawal_fee' | 'merchant_fee' | 'loan_interest' | 'early_withdrawal_penalty';
  sourceTransactionId?: string;
  sourceUserId: string;
  description: string;
  transactionType?: string; // p2p, withdrawal, merchant_qr, etc.
  premiumTier?: string; // basic, plus, vip
}

export interface AdminExpenseData {
  amount: number;
  type: 'savings_interest' | 'referral_payment' | 'reward_points' | 'cashback' | 'admin_withdrawal' | 'admin_transfer';
  targetUserId: string;
  description: string;
  expenseCategory: 'operational' | 'user_benefits' | 'admin_operations';
}
export const collectRevenueToAdminWallet = async (data: RevenueCollectionData) => {
  try {
    // Add revenue record with enhanced tracking
    const revenueRecord = {
      ...data,
      timestamp: new Date(),
      status: 'collected',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      day: new Date().getDate()
    };

    await addDoc(collection(db, 'revenue'), revenueRecord);

    // Update admin wallet balance with detailed tracking
    const adminWalletRef = doc(db, 'admin_wallet', 'main');
    await updateDoc(adminWalletRef, {
      balance: increment(data.amount),
      totalRevenue: increment(data.amount),
      monthlyRevenue: increment(data.amount),
      dailyRevenue: increment(data.amount),
      [`${data.type}Revenue`]: increment(data.amount),
      lastUpdated: new Date()
    });

    // Track revenue by transaction type and premium tier
    if (data.transactionType) {
      await updateDoc(adminWalletRef, {
        [`${data.transactionType}Revenue`]: increment(data.amount)
      });
    }

    if (data.premiumTier) {
      await updateDoc(adminWalletRef, {
        [`${data.premiumTier}Revenue`]: increment(data.amount)
      });
    }

    console.log(`Revenue collected: ${data.amount} KES from ${data.type} (${data.transactionType || 'unknown'})`);
    return true;
  } catch (error) {
    console.error('Error collecting revenue:', error);
    return false;
  }
};

// Function to deduct expenses from admin wallet
export const deductFromAdminWallet = async (data: AdminExpenseData) => {
  try {
    // Add expense record with enhanced tracking
    const expenseRecord = {
      ...data,
      timestamp: new Date(),
      status: 'paid',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      day: new Date().getDate()
    };

    await addDoc(collection(db, 'expenses'), expenseRecord);

    // Update admin wallet balance with detailed tracking
    const adminWalletRef = doc(db, 'admin_wallet', 'main');
    await updateDoc(adminWalletRef, {
      balance: increment(-data.amount),
      totalExpenses: increment(data.amount),
      monthlyExpenses: increment(data.amount),
      dailyExpenses: increment(data.amount),
      [`${data.type}Expenses`]: increment(data.amount),
      [`${data.expenseCategory}Expenses`]: increment(data.amount),
      lastUpdated: new Date()
    });

    console.log(`Expense deducted: ${data.amount} KES for ${data.type} (${data.expenseCategory})`);
    return true;
  } catch (error) {
    console.error('Error deducting expense:', error);
    return false;
  }
};
// Helper function to automatically collect fees from transactions
export const autoCollectTransactionFee = async (
  feeAmount: number,
  transactionId: string,
  userId: string,
  transactionType: string,
  premiumTier: string = 'basic'
) => {
  if (feeAmount <= 0) return;

  await collectRevenueToAdminWallet({
    amount: feeAmount,
    type: 'transaction_fee',
    sourceTransactionId: transactionId,
    sourceUserId: userId,
    description: `Transaction fee from ${transactionType} (${transactionId})`,
    transactionType,
    premiumTier
  });
};

// Helper function to collect premium subscription fees
export const collectPremiumSubscription = async (
  subscriptionAmount: number,
  userId: string,
  planType: string
) => {
  await collectRevenueToAdminWallet({
    amount: subscriptionAmount,
    type: 'premium_subscription',
    sourceUserId: userId,
    description: `${planType} premium subscription payment`
  });
};