import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  increment,
  serverTimestamp,
  Timestamp,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Transaction, SavingsAccount, Loan, Referral } from '../types';

// Helper function to convert Firestore timestamps to Date objects
export const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  // Convert Timestamp objects to Date objects
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key] === 'object' && converted[key].toDate) {
      converted[key] = converted[key].toDate();
    }
  });
  
  return converted;
};

// User document operations
export const getUserDocument = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return convertTimestamps({ uid, ...userDoc.data() }) as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
};

export const createUserDocument = async (uid: string, userData: Partial<User>): Promise<void> => {
  try {
    const userDocData = {
      ...userData,
      uid,
      createdAt: serverTimestamp(),
      walletBalance: userData.walletBalance || 0,
      savingsBalance: userData.savingsBalance || 0,
      rewardPoints: userData.rewardPoints || 0,
      totalEarnedInterest: userData.totalEarnedInterest || 0,
      premiumStatus: userData.premiumStatus || false,
      premiumPlan: userData.premiumPlan || 'basic',
      referralsCount: userData.referralsCount || 0,
      referralEarnings: userData.referralEarnings || 0,
      kycVerified: userData.kycVerified || false
    };
    
    await setDoc(doc(db, 'users', uid), userDocData);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const updateUserDocument = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    const updateData = { ...updates };
    
    // Convert Date objects to Timestamps for Firestore
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof User] instanceof Date) {
        updateData[key as keyof User] = Timestamp.fromDate(updateData[key as keyof User] as Date) as any;
      }
    });
    
    await updateDoc(doc(db, 'users', uid), updateData);
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

export const updateUserBalance = async (uid: string, amount: number): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      walletBalance: increment(amount)
    });
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
};

// Transaction operations
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const transactionData = {
      ...transaction,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'transactions'), transactionData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getUserTransactions = (uid: string, callback: (transactions: Transaction[]) => void) => {
  const q = query(
    collection(db, 'transactions'),
    where('uid', '==', uid),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot: any) => {
    const transactions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Transaction[];
    
    callback(transactions);
  });
};

// Savings account operations
export const addSavingsAccount = async (savingsAccount: Omit<SavingsAccount, 'id'>): Promise<string> => {
  try {
    const savingsData = {
      ...savingsAccount,
      startDate: Timestamp.fromDate(savingsAccount.startDate),
      maturityDate: Timestamp.fromDate(savingsAccount.maturityDate)
    };
    
    const docRef = await addDoc(collection(db, 'savingsAccounts'), savingsData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding savings account:', error);
    throw error;
  }
};

export const updateSavingsAccount = async (savingsId: string, updates: Partial<SavingsAccount>): Promise<void> => {
  try {
    const updateData = { ...updates };
    
    // Convert Date objects to Timestamps
    if (updateData.startDate) {
      updateData.startDate = Timestamp.fromDate(updateData.startDate) as any;
    }
    if (updateData.maturityDate) {
      updateData.maturityDate = Timestamp.fromDate(updateData.maturityDate) as any;
    }
    
    await updateDoc(doc(db, 'savingsAccounts', savingsId), updateData);
  } catch (error) {
    console.error('Error updating savings account:', error);
    throw error;
  }
};

export const getUserSavingsAccounts = (uid: string, callback: (accounts: SavingsAccount[]) => void) => {
  const q = query(
    collection(db, 'savingsAccounts'),
    where('uid', '==', uid),
    orderBy('startDate', 'desc')
  );
  
  return onSnapshot(q, (snapshot: any) => {
    const accounts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as SavingsAccount[];
    
    callback(accounts);
  });
};

// Loan operations
export const addLoan = async (loan: Omit<Loan, 'id'>): Promise<string> => {
  try {
    const loanData = {
      ...loan,
      disbursementDate: Timestamp.fromDate(loan.disbursementDate),
      dueDate: Timestamp.fromDate(loan.dueDate),
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'loans'), loanData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding loan:', error);
    throw error;
  }
};

export const updateLoan = async (loanId: string, updates: Partial<Loan>): Promise<void> => {
  try {
    const updateData = { ...updates };
    
    // Convert Date objects to Timestamps
    if (updateData.disbursementDate) {
      updateData.disbursementDate = Timestamp.fromDate(updateData.disbursementDate) as any;
    }
    if (updateData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updateData.dueDate) as any;
    }
    if (updateData.createdAt) {
      updateData.createdAt = Timestamp.fromDate(updateData.createdAt) as any;
    }
    
    await updateDoc(doc(db, 'loans', loanId), updateData);
  } catch (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
};

export const getUserLoans = (uid: string, callback: (loans: Loan[]) => void) => {
  const q = query(
    collection(db, 'loans'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot: any) => {
    const loans = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Loan[];
    
    callback(loans);
  });
};

// Admin operations
export const getAdminWallet = async () => {
  try {
    const adminDoc = await getDoc(doc(db, 'admin_wallet', 'main'));
    if (adminDoc.exists()) {
      return convertTimestamps(adminDoc.data());
    }
    return null;
  } catch (error) {
    console.error('Error getting admin wallet:', error);
    return null;
  }
};

export const updateAdminWallet = async (updates: any): Promise<void> => {
  try {
    await updateDoc(doc(db, 'admin_wallet', 'main'), {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating admin wallet:', error);
    throw error;
  }
};

export const addRevenueRecord = async (record: any): Promise<string> => {
  try {
    const recordData = {
      ...record,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'revenue_records'), recordData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding revenue record:', error);
    throw error;
  }
};

export const getRevenueRecords = (callback: (records: any[]) => void) => {
  const q = query(
    collection(db, 'revenue_records'),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot: any) => {
    const records = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    callback(records);
  });
};

// Migration helper - check and migrate localStorage data
export const migrateUserDataFromLocalStorage = async (uid: string): Promise<boolean> => {
  try {
    // Check if user already exists in Firestore
    const existingUser = await getUserDocument(uid);
    if (existingUser) {
      return false; // User already migrated
    }

    // Check for localStorage data
    const localUserData = localStorage.getItem(`user_${uid}`);
    const localTransactions = localStorage.getItem(`transactions_${uid}`);
    const localSavings = localStorage.getItem(`savings_${uid}`);
    const localLoans = localStorage.getItem(`loans_${uid}`);

    let migrated = false;

    // Migrate user data
    if (localUserData) {
      const userData = JSON.parse(localUserData);
      await createUserDocument(uid, {
        email: userData.email,
        displayName: userData.displayName,
        walletBalance: userData.walletBalance || 0,
        savingsBalance: userData.savingsBalance || 0,
        rewardPoints: userData.rewardPoints || 0,
        totalEarnedInterest: userData.totalEarnedInterest || 0,
        premiumStatus: userData.premiumStatus || false,
        premiumPlan: userData.premiumPlan,
        premiumExpiry: userData.premiumExpiry ? new Date(userData.premiumExpiry) : undefined,
        referralsCount: userData.referralsCount || 0,
        referralEarnings: userData.referralEarnings || 0,
        kycVerified: userData.kycVerified || false
      });
      migrated = true;
    }

    // Migrate transactions
    if (localTransactions) {
      const transactions = JSON.parse(localTransactions);
      for (const transaction of transactions) {
        await addTransaction({
          uid: transaction.uid,
          type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee,
          netAmount: transaction.netAmount,
          description: transaction.description,
          status: transaction.status,
          recipient: transaction.recipient,
          sender: transaction.sender,
          method: transaction.method,
          direction: transaction.direction,
          loanId: transaction.loanId
        });
      }
      migrated = true;
    }

    // Migrate savings accounts
    if (localSavings) {
      const savings = JSON.parse(localSavings);
      for (const account of savings) {
        await addSavingsAccount({
          uid: account.uid,
          principal: account.principal,
          lockPeriod: account.lockPeriod,
          annualInterestRate: account.annualInterestRate,
          startDate: new Date(account.startDate),
          maturityDate: new Date(account.maturityDate),
          status: account.status,
          currentValue: account.currentValue,
          earnedInterest: account.earnedInterest,
          hasActiveLoan: account.hasActiveLoan
        });
      }
      migrated = true;
    }

    // Migrate loans
    if (localLoans) {
      const loans = JSON.parse(localLoans);
      for (const loan of loans) {
        await addLoan({
          uid: loan.uid,
          savingsAccountId: loan.savingsAccountId,
          amount: loan.amount,
          interestRate: loan.interestRate,
          totalInterest: loan.totalInterest,
          totalRepayment: loan.totalRepayment,
          disbursementDate: new Date(loan.disbursementDate),
          dueDate: new Date(loan.dueDate),
          status: loan.status,
          repaidAmount: loan.repaidAmount,
          remainingAmount: loan.remainingAmount,
          autoDeductFromSavings: loan.autoDeductFromSavings,
          createdAt: new Date(loan.createdAt)
        });
      }
      migrated = true;
    }

    // Clear localStorage after successful migration
    if (migrated) {
      localStorage.removeItem(`user_${uid}`);
      localStorage.removeItem(`transactions_${uid}`);
      localStorage.removeItem(`savings_${uid}`);
      localStorage.removeItem(`loans_${uid}`);
      console.log('Successfully migrated user data from localStorage to Firestore');
    }

    return migrated;
  } catch (error) {
    console.error('Error migrating user data:', error);
    return false;
  }
};

// Admin data migration
export const migrateAdminDataFromLocalStorage = async (): Promise<boolean> => {
  try {
    // Check if admin data already exists
    const existingAdminWallet = await getAdminWallet();
    if (existingAdminWallet) {
      return false; // Already migrated
    }

    // Migrate admin wallet
    const localAdminWallet = localStorage.getItem('admin_wallet');
    if (localAdminWallet) {
      const walletData = JSON.parse(localAdminWallet);
      await setDoc(doc(db, 'admin_wallet', 'main'), {
        ...walletData,
        lastUpdated: serverTimestamp()
      });
    }

    // Migrate revenue records
    const localRevenueRecords = localStorage.getItem('admin_revenue_records');
    if (localRevenueRecords) {
      const records = JSON.parse(localRevenueRecords);
      for (const record of records) {
        await addRevenueRecord({
          type: record.type,
          amount: record.amount,
          sourceTransactionId: record.sourceTransactionId,
          sourceUserId: record.sourceUserId,
          description: record.description,
          status: record.status,
          category: record.category
        });
      }
    }

    // Clear localStorage after migration
    localStorage.removeItem('admin_wallet');
    localStorage.removeItem('admin_revenue_records');
    
    console.log('Successfully migrated admin data from localStorage to Firestore');
    return true;
  } catch (error) {
    console.error('Error migrating admin data:', error);
    return false;
  }
};

// Referral functions
export const generateReferralCode = async (): Promise<string> => {
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createReferral = async (referral: Omit<Referral, 'id'>): Promise<string> => {
  try {
    const referralData = {
      ...referral,
      createdAt: serverTimestamp(),
      completedAt: referral.completedAt ? Timestamp.fromDate(referral.completedAt) : null
    };
    
    const docRef = await addDoc(collection(db, 'referrals'), referralData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

export const updateReferralStatus = async (
  referralId: string, 
  status: 'pending' | 'completed' | 'expired', 
  completedAt?: Date
): Promise<void> => {
  try {
    const updateData: any = { status };
    
    if (completedAt) {
      updateData.completedAt = Timestamp.fromDate(completedAt);
    }
    
    await updateDoc(doc(db, 'referrals', referralId), updateData);
  } catch (error) {
    console.error('Error updating referral status:', error);
    throw error;
  }
};

export const getUserReferrals = (userId: string, callback: (referrals: Referral[]) => void) => {
  const q = query(
    collection(db, 'referrals'),
    where('referrerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot: any) => {
    const referrals = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Referral[];
    
    callback(referrals);
  });
};

export const getReferralByCode = async (referralCode: string): Promise<Referral | null> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referralCode', '==', referralCode),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as Referral;
    }
    return null;
  } catch (error) {
    console.error('Error getting referral by code:', error);
    return null;
  }
};
