// Admin Configuration
// This file contains all admin-related configuration that can be dynamically updated

export interface AdminConfig {
  // Admin authentication
  adminEmails: string[];
  secretCode: string;
  
  // Admin permissions
  permissions: {
    view_revenue: boolean;
    manage_users: boolean;
    view_analytics: boolean;
    withdraw_funds: boolean;
    transfer_funds: boolean;
    manage_settings: boolean;
    view_reports: boolean;
  };
  
  // Platform statistics (can be updated dynamically)
  platformStats: {
    withdrawalDestinations: {
      mobileMoneyAccounts: number;
      bankAccounts: number;
      cardAccounts: number;
      pendingVerifications: number;
    };
    defaultValues: {
      totalUsers: number;
      activeUsers: number;
      premiumUsers: number;
      totalTransactions: number;
      totalVolume: number;
      averageTransactionSize: number;
      totalSavings: number;
      totalLoansIssued: number;
      totalLoanValue: number;
      overdueLoans: number;
      aiAssistantUsage: number;
      conversionRate: number;
    };
  };
  
  // Revenue types configuration
  revenueTypes: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    category: 'revenue' | 'expense';
  }>;
  
  // Expense types configuration
  expenseTypes: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    category: 'expense';
  }>;
}

// Default configuration - can be overridden by environment variables or database
const defaultAdminConfig: AdminConfig = {
  adminEmails: [
    'admin@phantompay.com',
    'superadmin@phantompay.com',
    'revenue@phantompay.com'
  ],
  secretCode: process.env.REACT_APP_ADMIN_SECRET_CODE || 'PHANTOM2024',
  
  permissions: {
    view_revenue: true,
    manage_users: true,
    view_analytics: true,
    withdraw_funds: true,
    transfer_funds: true,
    manage_settings: true,
    view_reports: true
  },
  
  platformStats: {
    withdrawalDestinations: {
      mobileMoneyAccounts: 1234,
      bankAccounts: 567,
      cardAccounts: 89,
      pendingVerifications: 23
    },
    defaultValues: {
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
      aiAssistantUsage: 0,
      conversionRate: 0
    }
  },
  
  revenueTypes: [
    { id: 'transaction_fee', name: 'Transaction Fees', color: 'from-blue-500 to-blue-600', icon: 'CreditCard', category: 'revenue' },
    { id: 'premium_subscription', name: 'Premium Subscriptions', color: 'from-purple-500 to-purple-600', icon: 'Crown', category: 'revenue' },
    { id: 'withdrawal_fee', name: 'Withdrawal Fees', color: 'from-red-500 to-red-600', icon: 'ArrowUpRight', category: 'revenue' },
    { id: 'loan_interest', name: 'Loan Interest', color: 'from-green-500 to-green-600', icon: 'Target', category: 'revenue' },
    { id: 'early_withdrawal_penalty', name: 'Early Withdrawal Penalties', color: 'from-orange-500 to-orange-600', icon: 'AlertTriangle', category: 'revenue' },
    { id: 'admin_withdrawal', name: 'Admin Withdrawals', color: 'from-red-700 to-red-800', icon: 'Minus', category: 'expense' },
    { id: 'admin_transfer', name: 'Admin Transfers', color: 'from-blue-700 to-blue-800', icon: 'Send', category: 'expense' }
  ],
  
  expenseTypes: [
    { id: 'savings_interest', name: 'Savings Interest', color: 'from-emerald-500 to-emerald-600', icon: 'TrendingUp', category: 'expense' },
    { id: 'reward_points', name: 'Reward Points', color: 'from-yellow-500 to-yellow-600', icon: 'Zap', category: 'expense' },
    { id: 'cashback', name: 'Cashback Payments', color: 'from-orange-500 to-orange-600', icon: 'ArrowDownRight', category: 'expense' }
  ]
};

// Function to get admin configuration
export const getAdminConfig = (): AdminConfig => {
  // In the future, this could fetch from a database or API
  // For now, we'll use environment variables to override defaults
  const config = { ...defaultAdminConfig };
  
  // Override with environment variables if available
  if (process.env.REACT_APP_ADMIN_EMAILS) {
    config.adminEmails = process.env.REACT_APP_ADMIN_EMAILS.split(',');
  }
  
  return config;
};

// Function to check if email is admin
export const isAdminEmail = (email: string): boolean => {
  const config = getAdminConfig();
  return config.adminEmails.includes(email);
};

// Function to get admin role based on email
export const getAdminRole = (email: string): 'super_admin' | 'admin' => {
  const config = getAdminConfig();
  // Super admin is the first email in the list, or specifically 'superadmin@phantompay.com'
  return email === 'superadmin@phantompay.com' || email === config.adminEmails[0] ? 'super_admin' : 'admin';
};

// Function to validate admin secret code
export const validateAdminSecretCode = (code: string): boolean => {
  const config = getAdminConfig();
  return code === config.secretCode;
};

// Function to get platform stats configuration
export const getPlatformStatsConfig = () => {
  const config = getAdminConfig();
  return config.platformStats;
};

// Function to get revenue types configuration
export const getRevenueTypesConfig = () => {
  const config = getAdminConfig();
  return config.revenueTypes;
};

// Function to get expense types configuration
export const getExpenseTypesConfig = () => {
  const config = getAdminConfig();
  return config.expenseTypes;
};

// Export default config for direct access
export default defaultAdminConfig;
