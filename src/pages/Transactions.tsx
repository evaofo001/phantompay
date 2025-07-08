import React, { useState } from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Award, 
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { format } from 'date-fns';

const Transactions: React.FC = () => {
  const { transactions } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      case 'receive': return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'airtime': case 'data': return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'reward': return <Award className="h-5 w-5 text-yellow-500" />;
      default: return <History className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.sender && transaction.sender.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const transactionDate = transaction.timestamp;
      
      switch (dateFilter) {
        case 'today':
          matchesDate = format(transactionDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send': return 'text-red-600';
      case 'receive': case 'reward': return 'text-green-600';
      default: return 'text-gray-900';
    }
  };

  const getTransactionSign = (type: string) => {
    return type === 'receive' || type === 'reward' ? '+' : '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <History className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">View and manage your transaction history</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-colors"
              placeholder="Search transactions..."
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-colors"
              >
                <option value="all">All Types</option>
                <option value="send">Sent</option>
                <option value="receive">Received</option>
                <option value="airtime">Airtime</option>
                <option value="data">Data</option>
                <option value="reward">Rewards</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-colors"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction, index) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>{format(transaction.timestamp, 'MMM dd, yyyy • HH:mm')}</p>
                        {transaction.recipient && (
                          <p>To: {transaction.recipient}</p>
                        )}
                        {transaction.sender && (
                          <p>From: {transaction.sender}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                      {getTransactionSign(transaction.type)}{formatCurrency(transaction.amount)}
                    </p>
                    <p className={`text-xs capitalize px-2 py-1 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start using PhantomPay to see your transactions here'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {filteredTransactions.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredTransactions.filter(t => t.type === 'receive' || t.type === 'reward').length}
              </p>
              <p className="text-sm text-gray-600">Money In</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {filteredTransactions.filter(t => t.type === 'send').length}
              </p>
              <p className="text-sm text-gray-600">Money Out</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {filteredTransactions.filter(t => t.type === 'airtime' || t.type === 'data').length}
              </p>
              <p className="text-sm text-gray-600">Services</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;