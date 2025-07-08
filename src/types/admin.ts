export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  createdAt: Date;
}

export interface RevenueRecord {
  id: string;
  type: 'transaction_fee' | 'premium_subscription' | 'withdrawal_fee' | 'merchant_fee';
  amount: number;
  sourceTransactionId?: string;
  sourceUserId: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'collected' | 'failed';
}

export interface AdminWallet {
  uid: string;
  balance: number;
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  lastUpdated: Date;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionSize: number;
  conversionRate: number;
}