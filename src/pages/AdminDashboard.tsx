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
  EyeOff
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

  // Calculate revenue metrics
  const totalFilteredRevenue = filteredRevenue.reduce((sum, record) => sum + record.amount, 0);
  const averageRevenue = filteredRevenue.length > 0 ? totalFilteredRevenue / filteredRevenue.length : 0;

  // Revenue by type
  const revenueByType = filteredRevenue.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + record.amount;
    return acc;
  }, {} as Record<string, number>);

  const revenueTypes = [
    { id: 'transaction_fee', name: 'Transaction Fees', color: 'from-blue-500 to-blue-600' },
    { id: 'premium_subscription', name: 'Premium Subscriptions', color: 'from-purple-500 to-purple-600' },
    { id: 'withdrawal_fee', name: 'Withdrawal Fees', color: 'from-red-500 to-red-600' },
    { id: 'merchant_fee', name: 'Merchant Fees', color: 'from-green-500 to-green-600' }
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
          <h1 className="text-3xl font-bold text-gray-900">💰 Revenue Control Center</h1>
          <p className="text-gray-600 mt-1">PhantomPay revenue management and analytics</p>
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

      {/* Admin Revenue Wallet */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <h2 className="text-2xl font-bold mr-3">💎 Revenue Wallet</h2>
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
                <p className="text-green-100 text-sm">Total Revenue Collected</p>
                <p className="text-xl font-semibold">
                  {showBalance ? formatCurrency(adminWallet?.totalRevenue || 0) : '••••••••'}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-sm">This Month</p>
                <p className="text-xl font-semibold">
                  {showBalance ? formatCurrency(adminWallet?.monthlyRevenue || 0) : '••••••••'}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Today</p>
                <p className="text-xl font-semibold">
                  {showBalance ? formatCurrency(adminWallet?.dailyRevenue || 0) : '••••••••'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-6 rounded-2xl">
            <Wallet className="h-16 w-16 text-white" />
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🏦 Admin Privileges</h3>
            <div className="bg-red-100 p-2 rounded-lg">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Zero fees on all operations
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Unlimited withdrawal access
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Direct revenue transfers
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Real-time analytics access
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Platform Health</h3>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-semibold">{platformStats?.totalUsers?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="font-semibold text-green-600">{platformStats?.activeUsers?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Premium Users</span>
              <span className="font-semibold text-purple-600">{platformStats?.premiumUsers?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-orange-600">
                {platformStats?.totalUsers ? Math.round((platformStats.premiumUsers / platformStats.totalUsers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">💸 Transaction Volume</h3>
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(platformStats?.totalVolume || 0)}
              </p>
              <p className="text-sm text-gray-600">Total Volume</p>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Transaction</span>
              <span className="font-semibold">{formatCurrency(platformStats?.averageTransactionSize || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Transactions</span>
              <span className="font-semibold">{platformStats?.totalTransactions?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">📈 Revenue Analytics</h2>
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
            <select
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="all">All Revenue Types</option>
              <option value="transaction_fee">Transaction Fees</option>
              <option value="premium_subscription">Premium Subscriptions</option>
              <option value="withdrawal_fee">Withdrawal Fees</option>
              <option value="merchant_fee">Merchant Fees</option>
            </select>
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Total Revenue ({dateFilter})</h3>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(totalFilteredRevenue)}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Average per Transaction</h3>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(averageRevenue)}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Total Transactions</h3>
            <p className="text-3xl font-bold text-purple-700">{filteredRevenue.length}</p>
          </div>
        </div>

        {/* Revenue by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {revenueTypes.map((type) => {
            const amount = revenueByType[type.id] || 0;
            const percentage = totalFilteredRevenue > 0 ? (amount / totalFilteredRevenue) * 100 : 0;
            
            return (
              <div key={type.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{type.name}</h4>
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${type.color}`}></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                <p className="text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Revenue Records */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">💰 Recent Revenue Records</h2>
            <button className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
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
                      record.type === 'transaction_fee' ? 'bg-blue-100 text-blue-800' :
                      record.type === 'premium_subscription' ? 'bg-purple-100 text-purple-800' :
                      record.type === 'withdrawal_fee' ? 'bg-red-100 text-red-800' :
                      record.amount < 0 ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {record.amount < 0 ? 'WITHDRAWAL' : record.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={record.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      {record.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(record.amount))}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue records found</h3>
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