import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, onSnapshot, addDoc, increment } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { AdminUser, RevenueRecord, AdminWallet, PlatformStats } from '../types/admin';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

interface AdminContextType {
  isAdmin: boolean;
  adminUser: AdminUser | null;
  adminWallet: AdminWallet | null;
  revenueRecords: RevenueRecord[];
  platformStats: PlatformStats | null;
  collectRevenue: (amount: number, type: string, sourceTransactionId: string, sourceUserId: string, description: string) => Promise<void>;
  withdrawFromAdminWallet: (amount: number, secretCode: string) => Promise<void>;
  transferFromAdminWallet: (amount: number, recipient: string, secretCode: string) => Promise<void>;
  refreshAdminData: () => Promise<void>;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// Admin email addresses - in production, this would be in a secure database
const ADMIN_EMAILS = [
  'admin@phantompay.com',
  'superadmin@phantompay.com',
  'revenue@phantompay.com'
];

// Secret code for admin operations - in production, this would be more secure
const ADMIN_SECRET_CODE = 'PHANTOM2024';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false);
      setAdminUser(null);
      setAdminWallet(null);
      setRevenueRecords([]);
      setPlatformStats(null);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        // Check if user email is in admin list
        const userIsAdmin = ADMIN_EMAILS.includes(currentUser.email || '');
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          await initializeAdminUser();
          await initializeAdminWallet();
          await loadPlatformStats();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Listen to revenue records for admin users
  useEffect(() => {
    if (!isAdmin || !currentUser) return;

    const revenueQuery = query(
      collection(db, 'revenue'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(revenueQuery, (snapshot) => {
      const records: RevenueRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as RevenueRecord);
      });
      setRevenueRecords(records);
    }, (error) => {
      console.error('Error listening to revenue records:', error);
    });

    return () => unsubscribe();
  }, [isAdmin, currentUser]);

  const initializeAdminUser = async () => {
    if (!currentUser) return;

    try {
      const adminDocRef = doc(db, 'admins', currentUser.uid);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        const adminData = adminDoc.data() as AdminUser;
        setAdminUser(adminData);
      } else {
        // Create new admin user
        const newAdmin: AdminUser = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          role: currentUser.email === 'superadmin@phantompay.com' ? 'super_admin' : 'admin',
          permissions: ['view_revenue', 'manage_users', 'view_analytics', 'withdraw_funds', 'transfer_funds'],
          createdAt: new Date()
        };

        await setDoc(adminDocRef, newAdmin);
        setAdminUser(newAdmin);
      }
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  };

  const initializeAdminWallet = async () => {
    if (!currentUser) return;

    try {
      const walletDocRef = doc(db, 'admin_wallet', 'main');
      const walletDoc = await getDoc(walletDocRef);

      if (walletDoc.exists()) {
        const walletData = walletDoc.data() as AdminWallet;
        setAdminWallet(walletData);
      } else {
        // Create admin wallet
        const newWallet: AdminWallet = {
          uid: 'admin_wallet',
          balance: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          dailyRevenue: 0,
          lastUpdated: new Date()
        };

        await setDoc(walletDocRef, newWallet);
        setAdminWallet(newWallet);
      }
    } catch (error) {
      console.error('Error initializing admin wallet:', error);
    }
  };

  const loadPlatformStats = async () => {
    try {
      const statsDocRef = doc(db, 'platform_stats', 'main');
      const statsDoc = await getDoc(statsDocRef);

      if (statsDoc.exists()) {
        const statsData = statsDoc.data() as PlatformStats;
        setPlatformStats(statsData);
      } else {
        // Initialize platform stats
        const initialStats: PlatformStats = {
          totalUsers: 0,
          activeUsers: 0,
          premiumUsers: 0,
          totalTransactions: 0,
          totalVolume: 0,
          averageTransactionSize: 0,
          conversionRate: 0
        };

        await setDoc(statsDocRef, initialStats);
        setPlatformStats(initialStats);
      }
    } catch (error) {
      console.error('Error loading platform stats:', error);
    }
  };

  const collectRevenue = async (
    amount: number, 
    type: string, 
    sourceTransactionId: string, 
    sourceUserId: string, 
    description: string
  ) => {
    if (!isAdmin) return;

    try {
      // Add revenue record
      const revenueRecord: Omit<RevenueRecord, 'id'> = {
        type: type as any,
        amount,
        sourceTransactionId,
        sourceUserId,
        timestamp: new Date(),
        description,
        status: 'collected'
      };

      await addDoc(collection(db, 'revenue'), revenueRecord);

      // Update admin wallet
      const walletDocRef = doc(db, 'admin_wallet', 'main');
      await updateDoc(walletDocRef, {
        balance: increment(amount),
        totalRevenue: increment(amount),
        monthlyRevenue: increment(amount),
        dailyRevenue: increment(amount),
        lastUpdated: new Date()
      });

      // Update local state
      if (adminWallet) {
        setAdminWallet({
          ...adminWallet,
          balance: adminWallet.balance + amount,
          totalRevenue: adminWallet.totalRevenue + amount,
          monthlyRevenue: adminWallet.monthlyRevenue + amount,
          dailyRevenue: adminWallet.dailyRevenue + amount,
          lastUpdated: new Date()
        });
      }

    } catch (error) {
      console.error('Error collecting revenue:', error);
      toast.error('Failed to collect revenue');
    }
  };

  const withdrawFromAdminWallet = async (amount: number, secretCode: string) => {
    if (!isAdmin || !adminWallet) {
      toast.error('Unauthorized withdrawal attempt');
      return;
    }

    // Validate secret code
    if (secretCode !== ADMIN_SECRET_CODE) {
      toast.error('Invalid admin secret code');
      return;
    }

    // Validate amount
    if (amount <= 0 || amount > adminWallet.balance) {
      toast.error('Invalid withdrawal amount');
      return;
    }

    try {
      setLoading(true);

      // Add withdrawal record
      const withdrawalRecord: Omit<RevenueRecord, 'id'> = {
        type: 'withdrawal' as any,
        amount: -amount, // Negative amount for withdrawal
        sourceTransactionId: `admin_withdrawal_${Date.now()}`,
        sourceUserId: currentUser?.uid || 'admin',
        timestamp: new Date(),
        description: `Admin withdrawal of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}`,
        status: 'collected'
      };

      await addDoc(collection(db, 'revenue'), withdrawalRecord);

      // Update admin wallet
      const walletDocRef = doc(db, 'admin_wallet', 'main');
      await updateDoc(walletDocRef, {
        balance: increment(-amount),
        lastUpdated: new Date()
      });

      // Update local state
      setAdminWallet({
        ...adminWallet,
        balance: adminWallet.balance - amount,
        lastUpdated: new Date()
      });

      toast.success(`Successfully withdrew ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} 💰`);

    } catch (error) {
      console.error('Error withdrawing from admin wallet:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const transferFromAdminWallet = async (amount: number, recipient: string, secretCode: string) => {
    if (!isAdmin || !adminWallet) {
      toast.error('Unauthorized transfer attempt');
      return;
    }

    // Validate secret code
    if (secretCode !== ADMIN_SECRET_CODE) {
      toast.error('Invalid admin secret code');
      return;
    }

    // Validate amount
    if (amount <= 0 || amount > adminWallet.balance) {
      toast.error('Invalid transfer amount');
      return;
    }

    if (!recipient.trim()) {
      toast.error('Recipient is required');
      return;
    }

    try {
      setLoading(true);

      // Add transfer record
      const transferRecord: Omit<RevenueRecord, 'id'> = {
        type: 'transfer' as any,
        amount: -amount, // Negative amount for transfer
        sourceTransactionId: `admin_transfer_${Date.now()}`,
        sourceUserId: currentUser?.uid || 'admin',
        timestamp: new Date(),
        description: `Admin transfer of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} to ${recipient}`,
        status: 'collected'
      };

      await addDoc(collection(db, 'revenue'), transferRecord);

      // Update admin wallet
      const walletDocRef = doc(db, 'admin_wallet', 'main');
      await updateDoc(walletDocRef, {
        balance: increment(-amount),
        lastUpdated: new Date()
      });

      // Update local state
      setAdminWallet({
        ...adminWallet,
        balance: adminWallet.balance - amount,
        lastUpdated: new Date()
      });

      toast.success(`Successfully transferred ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} to ${recipient} 💸`);

    } catch (error) {
      console.error('Error transferring from admin wallet:', error);
      toast.error('Failed to process transfer');
    } finally {
      setLoading(false);
    }
  };

  const refreshAdminData = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      await Promise.all([
        initializeAdminWallet(),
        loadPlatformStats()
      ]);
      toast.success('Admin data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing admin data:', error);
      toast.error('Failed to refresh admin data');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAdmin,
    adminUser,
    adminWallet,
    revenueRecords,
    platformStats,
    collectRevenue,
    withdrawFromAdminWallet,
    transferFromAdminWallet,
    refreshAdminData,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};