import React, { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Crown,
  Wallet,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Lock,
  Send,
  Eye,
  EyeOff,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Brain,
  FileText,
  TrendingDown,
  Smartphone,
  Building
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { adminWallet, revenueRecords, platformStats, refreshAdminData, withdrawFromAdminWallet, transferFromAdminWallet, loading } = useAdmin();
  const [dateFilter, setDateFilter] = useState('today');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'expenses'>('revenue');

  // Export functionality
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRevenue = () => {
    const exportData = filteredRevenue.map(record => ({
      Date: format(record.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      Type: record.type.replace('_', ' ').toUpperCase(),
      Amount: record.amount,
      Description: record.description,
      Status: record.status.toUpperCase(),
      Category: record.amount > 0 ? 'REVENUE' : 'EXPENSE'
    }));
    exportToCSV(exportData, 'phantompay_revenue_records');
    toast.success('Revenue data exported successfully!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Filter revenue records based on selected filters
  const filteredRevenue = revenueRecords.filter(record => {
    const now = new Date();
    let dateMatch = true;
    
    switch (dateFilter) {
      case 'today':
        dateMatch = format(record.timestamp, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        break;
      case 'week':
        const weekAgo = subDays(now, 7);
        dateMatch = record.timestamp >= weekAgo;
        break;
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        dateMatch = record.timestamp >= monthStart && record.timestamp <= monthEnd;
        break;
    }

    const typeMatch = revenueFilter === 'all' || record.type === revenueFilter;
    
    return dateMatch && typeMatch;
  });

  // Separate revenue and expenses
  const revenueData = filteredRevenue.filter(record => record.amount > 0);
  const expenseData = filteredRevenue.filter(record => record.amount < 0);

  // Calculate metrics
  const totalRevenue = revenueData.reduce((sum, record) => sum + record.amount, 0);
  const totalExpenses = Math.abs(expenseData.reduce((sum, record) => sum + record.amount, 0));
  const netProfit = totalRevenue - totalExpenses;
  
  // Calculate loan repayment rate
  const loanRepaymentRate = platformStats?.totalLoansIssued > 0 
    ? ((platformStats.totalLoansIssued - (platformStats.overdueLoans || 0)) / platformStats.totalLoansIssued * 100)
    : 0;

  // Calculate active vs dormant users
  const dormantUsers = (platformStats?.totalUsers || 0) - (platformStats?.activeUsers || 0);

  // Revenue by type
  const revenueByType = revenueData.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + record.amount;
    return acc;
  }, {} as Record<string, number>);

  // Expense by type
  const expensesByType = expenseData.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + Math.abs(record.amount);
    return acc;
  }, {} as Record<string, number>);

  const revenueTypes = [
    { id: 'transaction_fee', name: 'Transaction Fees', color: 'from-blue-500 to-blue-600', icon: CreditCard },
    { id: 'premium_subscription', name: 'Premium Subscriptions', color: 'from-purple-500 to-purple-600', icon: Crown },
    { id: 'withdrawal_fee', name: 'Withdrawal Fees', color: 'from-red-500 to-red-600', icon: ArrowUpRight },
    { id: 'loan_interest', name: 'Loan Interest', color: 'from-green-500 to-green-600', icon: Target },
    { id: 'early_withdrawal_penalty', name: 'Early Withdrawal Penalties', color: 'from-orange-500 to-orange-600', icon: AlertTriangle },
    { id: 'admin_withdrawal', name: 'Admin Withdrawals', color: 'from-red-700 to-red-800', icon: Minus },
    { id: 'admin_transfer', name: 'Admin Transfers', color: 'from-blue-700 to-blue-800', icon: Send }
  ];

  const expenseTypes = [
    { id: 'savings_interest', name: 'Savings Interest', color: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
    { id: 'reward_points', name: 'Reward Points', color: 'from-yellow-500 to-yellow-600', icon: Zap },
    { id: 'cashback', name: 'Cashback Payments', color: 'from-orange-500 to-orange-600', icon: ArrowDownRight }
  ];

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > (adminWallet?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    await withdrawFromAdminWallet(amount, secretCode);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setSecretCode('');
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!transferRecipient.trim()) {
      toast.error('Please enter recipient details');
      return;
    }

    if (amount > (adminWallet?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    await transferFromAdminWallet(amount, transferRecipient, secretCode);
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferRecipient('');
    setSecretCode('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💼 PhantomPay Admin Control Center</h1>
          <p className="text-gray-600 mt-1">Your private spaceship cockpit 🛸 - Revenue, loans, and platform management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="h-4 w-4 mr-2" />
            Transfer
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Minus className="h-4 w-4 mr-2" />
            Withdraw
          </button>
          <button
            onClick={refreshAdminData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8" />
            <span className="text-blue-100 text-sm">Total</span>
          </div>
          <p className="text-3xl font-bold">{(platformStats?.totalUsers || 0).toLocaleString()}</p>
          <p className="text-blue-100">Users</p>
          <div className="mt-2 text-sm text-blue-100">
            Active: {(platformStats?.activeUsers || 0).toLocaleString()} | 
            Dormant: {dormantUsers.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8" />
            <span className="text-green-100 text-sm">Active</span>
          </div>
          <p className="text-3xl font-bold">{(platformStats?.activeUsers || 0).toLocaleString()}</p>
          <p className="text-green-100">Active Users</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Crown className="h-8 w-8" />
            <span className="text-purple-100 text-sm">Premium</span>
          </div>
          <p className="text-3xl font-bold">{(platformStats?.premiumUsers || 0).toLocaleString()}</p>
          <p className="text-purple-100">Subscribers</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Brain className="h-8 w-8" />
            <span className="text-orange-100 text-sm">AI Usage</span>
          </div>
          <p className="text-3xl font-bold">{(platformStats?.aiAssistantUsage || 0).toLocaleString()}</p>
          <p className="text-orange-100">Interactions</p>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Loan Metrics</h3>
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Repayment Rate</p>
              <p className="text-2xl font-bold text-green-600">{loanRepaymentRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Loan</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency((platformStats?.totalLoanValue || 0) / Math.max(platformStats?.totalLoansIssued || 1, 1))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">👥 User Activity</h3>
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{(platformStats?.activeUsers || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dormant Users</p>
              <p className="text-2xl font-bold text-red-600">{dormantUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">💰 Transaction Heatmap</h3>
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Avg Transaction Size</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(platformStats?.averageTransactionSize || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(platformStats?.totalVolume || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Revenue Wallet */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <h2 className="text-2xl font-bold mr-3">💎 Boss Wallet (Admin)</h2>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-4xl font-bold mb-4">
              {showBalance ? formatCurrency(adminWallet?.balance || 0) : '••••••••'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-green-100 text-sm">💰 Total Revenue</p>
                <p className="text-xl font-semibold">
                  {showBalance ? formatCurrency(adminWallet?.totalRevenue || 0) : '••••••••'}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-sm">💸 Total Expenses</p>
                <p className="text-xl font-semibold">
                  {showBalance ? formatCurrency(adminWallet?.totalExpenses || 0) : '••••••••'}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-sm">📈 Net Profit</p>
                <p className="text-xl font-semibold">
                  {showBalance ? formatCurrency((adminWallet?.totalRevenue || 0) - (adminWallet?.totalExpenses || 0)) : '••••••••'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-6 rounded-2xl">
            <Wallet className="h-16 w-16 text-white" />
          </div>
        </div>
      </div>

      {/* Dual Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">📈 Revenue Breakdown</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('revenue')}
                className={`px-3 py-1 rounded-lg text-sm ${chartType === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartType('expenses')}
                className={`px-3 py-1 rounded-lg text-sm ${chartType === 'expenses' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
              >
                Expenses
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {chartType === 'revenue' ? (
              revenueTypes.map((type) => {
                const amount = revenueByType[type.id] || 0;
                const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                const Icon = type.icon;
                
                return (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center mr-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{type.name}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              expenseTypes.map((type) => {
                const amount = expensesByType[type.id] || 0;
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                const Icon = type.icon;
                
                return (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center mr-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{type.name}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Loan Management Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">🏦 Loan Management</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">Total Borrowed</p>
                  <p className="text-sm text-blue-700">Active loans</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(platformStats?.totalLoanValue || 0)}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">Interest Earned</p>
                  <p className="text-sm text-green-700">From loans</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(revenueByType['loan_interest'] || 0)}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-900">Overdue Loans</p>
                  <p className="text-sm text-red-700">Needs attention</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-900">{platformStats?.overdueLoans || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">🏦 Withdrawal Destinations Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">1,234</p>
            <p className="text-sm text-green-700">Mobile Money Accounts</p>
            <p className="text-xs text-green-600 mt-1">M-Pesa, Airtel, MTN</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Building className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">567</p>
            <p className="text-sm text-blue-700">Bank Accounts</p>
            <p className="text-xs text-blue-600 mt-1">All major banks</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">89</p>
            <p className="text-sm text-purple-700">Card Accounts</p>
            <p className="text-xs text-purple-600 mt-1">Visa, Mastercard</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <div>
              <p className="font-medium text-amber-900">Pending Verifications</p>
              <p className="text-sm text-amber-700">23 withdrawal methods awaiting admin verification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">🏦 Savings Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <TrendingUp className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(platformStats?.totalSavings || 0)}</p>
            <p className="text-sm text-emerald-700">Total Savings Across Users</p>
            <p className="text-xs text-emerald-600 mt-1">Not included in revenue</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Clock className="h-12 w-12 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-900">{formatCurrency(expensesByType['savings_interest'] || 0)}</p>
            <p className="text-sm text-orange-700">Interest Liabilities</p>
            <p className="text-xs text-orange-600 mt-1">Expected payouts</p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-900">0</p>
            <p className="text-sm text-red-700">Emergency Withdrawals</p>
            <p className="text-xs text-red-600 mt-1">Pending requests</p>
          </div>
        </div>
      </div>

      {/* Recent Revenue Records */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">💰 Recent Revenue & Expense Records</h2>
            <div className="flex space-x-4">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              <button className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Download className="h-4 w-4 mr-2" />
                <span onClick={handleExportRevenue}>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRevenue.slice(0, 10).map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(record.timestamp, 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.amount > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.amount > 0 ? '💰 REVENUE' : '💸 EXPENSE'} - {record.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={record.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {record.amount > 0 ? '+' : ''}{formatCurrency(record.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {record.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'collected' ? 'bg-green-100 text-green-800' :
                      record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRevenue.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500">Try adjusting your filters or date range</p>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">💸 Admin Withdrawal</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Enter amount"
                  max={adminWallet?.balance || 0}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {formatCurrency(adminWallet?.balance || 0)} • No fees applied
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Secret Code
                </label>
                <input
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Enter admin secret code"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmount || !secretCode}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Withdraw Funds'}
              </button>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                  setSecretCode('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Send className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">💰 Admin Transfer</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Amount
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter amount"
                  max={adminWallet?.balance || 0}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {formatCurrency(adminWallet?.balance || 0)} • No fees applied
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Email, phone, or account details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Secret Code
                </label>
                <input
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter admin secret code"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleTransfer}
                disabled={loading || !transferAmount || !transferRecipient || !secretCode}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Transfer Funds'}
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferAmount('');
                  setTransferRecipient('');
                  setSecretCode('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;