import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { AdminUser, RevenueRecord, AdminWallet, PlatformStats } from '../types/admin';
import { 
  getAdminWallet,
  updateAdminWallet,
  addRevenueRecord,
  getRevenueRecords,
  migrateAdminDataFromLocalStorage
} from '../utils/firestoreHelpers';
import { doc, setDoc, onSnapshot } from '../config/firebase';
import { db } from '../config/firebase';
import { isAdminEmail, getAdminRole, validateAdminSecretCode } from '../config/adminConfig';
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

// Admin configuration is now imported from adminConfig.ts

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
        // Check if user email is in admin list using dynamic configuration
        const userIsAdmin = isAdminEmail(currentUser.email || '');
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Try to migrate admin data from localStorage first
          await migrateAdminDataFromLocalStorage();
          
          await initializeAdminUser();
          await setupAdminListeners();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  const initializeAdminUser = async () => {
    if (!currentUser) return;

    try {
      const newAdmin: AdminUser = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        role: getAdminRole(currentUser.email || ''),
        permissions: ['view_revenue', 'manage_users', 'view_analytics', 'withdraw_funds', 'transfer_funds'],
        createdAt: new Date()
      };

      setAdminUser(newAdmin);
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  };

  const setupAdminListeners = async () => {
    try {
      // Set up admin wallet listener
      const adminWalletRef = doc(db, 'admin_wallet', 'main');
      const unsubscribeWallet = onSnapshot(adminWalletRef, async (doc) => {
        if (doc.exists()) {
          const walletData = doc.data() as AdminWallet;
          setAdminWallet(walletData);
        } else {
          // Create initial admin wallet
          const initialWallet: AdminWallet = {
            uid: 'admin_wallet',
            balance: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            monthlyExpenses: 0,
            dailyExpenses: 0,
            monthlyRevenue: 0,
            dailyRevenue: 0,
            lastUpdated: new Date()
          };
          
          await setDoc(adminWalletRef, initialWallet);
        }
      });

      // Set up revenue records listener
      const unsubscribeRevenue = getRevenueRecords((records) => {
        setRevenueRecords(records);
      });

      // Set up platform stats listener
      const platformStatsRef = doc(db, 'platform_stats', 'summary');
      const unsubscribeStats = onSnapshot(platformStatsRef, async (doc) => {
        if (doc.exists()) {
          const statsData = doc.data() as PlatformStats;
          setPlatformStats(statsData);
        } else {
          // Create initial platform stats
          const initialStats: PlatformStats = {
            totalUsers: 0,
            activeUsers: 0,
            premiumUsers: 0,
            totalTransactions: 0,
            totalVolume: 0,
            averageTransactionSize: 0,
            totalSavings: 0,
            totalLoansIssued: 0,
            totalLoanValue: 0,
            overdueLoans: 0,
            totalExpenses: 0,
            aiAssistantUsage: 0,
            conversionRate: 0
          };
          
          await setDoc(platformStatsRef, initialStats);
        }
      });


    } catch (error) {
      console.error('Error setting up admin listeners:', error);
    }
  };

  const collectRevenue = async (
    amount: number,
    type: string, 
    sourceTransactionId: string, 
    sourceUserId: string, 
    description: string
  ) => {
    if (!isAdmin || !adminWallet) return;

    try {
      // Add revenue record
      const newRecord = {
        type: type as any,
        amount,
        sourceTransactionId,
        sourceUserId,
        description,
        status: 'collected',
        category: amount > 0 ? 'revenue' : 'expense'
      };

      await addRevenueRecord(newRecord);

      // Update admin wallet
      await updateAdminWallet({
        balance: adminWallet.balance + amount,
        totalRevenue: amount > 0 ? adminWallet.totalRevenue + amount : adminWallet.totalRevenue,
        totalExpenses: amount < 0 ? adminWallet.totalExpenses + Math.abs(amount) : adminWallet.totalExpenses,
        monthlyRevenue: amount > 0 ? adminWallet.monthlyRevenue + amount : adminWallet.monthlyRevenue,
        monthlyExpenses: amount < 0 ? adminWallet.monthlyExpenses + Math.abs(amount) : adminWallet.monthlyExpenses,
        dailyRevenue: amount > 0 ? adminWallet.dailyRevenue + amount : adminWallet.dailyRevenue,
        dailyExpenses: amount < 0 ? adminWallet.dailyExpenses + Math.abs(amount) : adminWallet.dailyExpenses
      });

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

    if (!validateAdminSecretCode(secretCode)) {
      toast.error('Invalid admin secret code');
      return;
    }

    if (amount <= 0 || amount > adminWallet.balance) {
      toast.error('Invalid withdrawal amount');
      return;
    }

    try {
      setLoading(true);

      await collectRevenue(
        -amount,
        'admin_withdrawal',
        `admin_withdrawal_${Date.now()}`,
        currentUser?.uid || 'admin',
        `Admin withdrawal of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}`
      );

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

    if (!validateAdminSecretCode(secretCode)) {
      toast.error('Invalid admin secret code');
      return;
    }

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

      await collectRevenue(
        -amount,
        'admin_transfer',
        `admin_transfer_${Date.now()}`,
        currentUser?.uid || 'admin',
        `Admin transfer of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} to ${recipient}`
      );

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
      await setupAdminListeners();
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