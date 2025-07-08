import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { AdminUser, RevenueRecord, AdminWallet, PlatformStats } from '../types/admin';
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
          await loadRevenueRecords();
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
      // Mock admin user data
      const newAdmin: AdminUser = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        role: currentUser.email === 'superadmin@phantompay.com' ? 'super_admin' : 'admin',
        permissions: ['view_revenue', 'manage_users', 'view_analytics', 'withdraw_funds', 'transfer_funds'],
        createdAt: new Date()
      };

      setAdminUser(newAdmin);
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  };

  const initializeAdminWallet = async () => {
    if (!currentUser) return;

    try {
      // Mock admin wallet data - in production this would come from database
      const savedWallet = localStorage.getItem('admin_wallet');
      let walletData: AdminWallet;

      if (savedWallet) {
        walletData = JSON.parse(savedWallet);
      } else {
        walletData = {
          uid: 'admin_wallet',
          balance: 50000, // Starting with some demo balance
          totalRevenue: 50000,
          monthlyRevenue: 15000,
          dailyRevenue: 2500,
          lastUpdated: new Date()
        };
        localStorage.setItem('admin_wallet', JSON.stringify(walletData));
      }

      setAdminWallet(walletData);
    } catch (error) {
      console.error('Error initializing admin wallet:', error);
    }
  };

  const loadPlatformStats = async () => {
    try {
      // Mock platform stats
      const mockStats: PlatformStats = {
        totalUsers: 1250,
        activeUsers: 890,
        premiumUsers: 156,
        totalTransactions: 8945,
        totalVolume: 2450000,
        averageTransactionSize: 2750,
        conversionRate: 12.5
      };

      setPlatformStats(mockStats);
    } catch (error) {
      console.error('Error loading platform stats:', error);
    }
  };

  const loadRevenueRecords = async () => {
    try {
      // Mock revenue records
      const mockRecords: RevenueRecord[] = [
        {
          id: '1',
          type: 'transaction_fee',
          amount: 45,
          sourceTransactionId: 'txn_001',
          sourceUserId: 'user_001',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          description: 'P2P transfer fee',
          status: 'collected'
        },
        {
          id: '2',
          type: 'premium_subscription',
          amount: 500,
          sourceUserId: 'user_002',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          description: 'VIP subscription payment',
          status: 'collected'
        },
        {
          id: '3',
          type: 'withdrawal_fee',
          amount: 75,
          sourceTransactionId: 'txn_003',
          sourceUserId: 'user_003',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          description: 'Bank withdrawal fee',
          status: 'collected'
        }
      ];

      setRevenueRecords(mockRecords);
    } catch (error) {
      console.error('Error loading revenue records:', error);
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
      const newRecord: RevenueRecord = {
        id: `rev_${Date.now()}`,
        type: type as any,
        amount,
        sourceTransactionId,
        sourceUserId,
        timestamp: new Date(),
        description,
        status: 'collected'
      };

      setRevenueRecords(prev => [newRecord, ...prev]);

      // Update admin wallet
      const updatedWallet = {
        ...adminWallet,
        balance: adminWallet.balance + amount,
        totalRevenue: adminWallet.totalRevenue + amount,
        monthlyRevenue: adminWallet.monthlyRevenue + amount,
        dailyRevenue: adminWallet.dailyRevenue + amount,
        lastUpdated: new Date()
      };

      setAdminWallet(updatedWallet);
      localStorage.setItem('admin_wallet', JSON.stringify(updatedWallet));

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
      const withdrawalRecord: RevenueRecord = {
        id: `withdrawal_${Date.now()}`,
        type: 'withdrawal_fee' as any,
        amount: -amount, // Negative amount for withdrawal
        sourceTransactionId: `admin_withdrawal_${Date.now()}`,
        sourceUserId: currentUser?.uid || 'admin',
        timestamp: new Date(),
        description: `Admin withdrawal of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}`,
        status: 'collected'
      };

      setRevenueRecords(prev => [withdrawalRecord, ...prev]);

      // Update admin wallet
      const updatedWallet = {
        ...adminWallet,
        balance: adminWallet.balance - amount,
        lastUpdated: new Date()
      };

      setAdminWallet(updatedWallet);
      localStorage.setItem('admin_wallet', JSON.stringify(updatedWallet));

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
      const transferRecord: RevenueRecord = {
        id: `transfer_${Date.now()}`,
        type: 'transaction_fee' as any,
        amount: -amount, // Negative amount for transfer
        sourceTransactionId: `admin_transfer_${Date.now()}`,
        sourceUserId: currentUser?.uid || 'admin',
        timestamp: new Date(),
        description: `Admin transfer of ${amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })} to ${recipient}`,
        status: 'collected'
      };

      setRevenueRecords(prev => [transferRecord, ...prev]);

      // Update admin wallet
      const updatedWallet = {
        ...adminWallet,
        balance: adminWallet.balance - amount,
        lastUpdated: new Date()
      };

      setAdminWallet(updatedWallet);
      localStorage.setItem('admin_wallet', JSON.stringify(updatedWallet));

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
        loadPlatformStats(),
        loadRevenueRecords()
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