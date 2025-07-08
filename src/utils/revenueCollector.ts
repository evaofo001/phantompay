import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface RevenueCollectionData {
  amount: number;
  type: 'transaction_fee' | 'premium_subscription' | 'withdrawal_fee' | 'merchant_fee';
  sourceTransactionId?: string;
  sourceUserId: string;
  description: string;
}

export const collectRevenueToAdminWallet = async (data: RevenueCollectionData) => {
  try {
    // Add revenue record
    const revenueRecord = {
      ...data,
      timestamp: new Date(),
      status: 'collected'
    };

    await addDoc(collection(db, 'revenue'), revenueRecord);

    // Update admin wallet balance
    const adminWalletRef = doc(db, 'admin_wallet', 'main');
    await updateDoc(adminWalletRef, {
      balance: increment(data.amount),
      totalRevenue: increment(data.amount),
      monthlyRevenue: increment(data.amount),
      dailyRevenue: increment(data.amount),
      lastUpdated: new Date()
    });

    console.log(`Revenue collected: ${data.amount} KES from ${data.type}`);
    return true;
  } catch (error) {
    console.error('Error collecting revenue:', error);
    return false;
  }
};

// Helper function to automatically collect fees from transactions
export const autoCollectTransactionFee = async (
  feeAmount: number,
  transactionId: string,
  userId: string,
  transactionType: string
) => {
  if (feeAmount <= 0) return;

  await collectRevenueToAdminWallet({
    amount: feeAmount,
    type: 'transaction_fee',
    sourceTransactionId: transactionId,
    sourceUserId: userId,
    description: `Transaction fee from ${transactionType} (${transactionId})`
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