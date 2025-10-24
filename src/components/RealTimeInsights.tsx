import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  DollarSign,
  Target,
  Zap,
  Shield,
  PiggyBank,
  CreditCard
} from 'lucide-react';
import { 
  generateDashboardInsights, 
  analyzeSpendingPatterns,
  calculateFinancialHealthScore,
  type DashboardInsight,
  type SpendingPattern
} from '../utils/dashboardUtils';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';

interface RealTimeInsightsProps {
  userId: string;
  onInsightUpdate?: (insights: DashboardInsight[]) => void;
}

export const RealTimeInsights: React.FC<RealTimeInsightsProps> = ({ 
  userId, 
  onInsightUpdate 
}) => {
  const { user } = useWallet();
  const { currentUser } = useAuth();
  
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([]);
  const [financialHealth, setFinancialHealth] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time insight generation
  const generateInsights = useCallback(async () => {
    if (!user || !currentUser) return;

    setIsLoading(true);
    try {
      const userData = {
        balance: user.balance || 0,
        savingsBalance: user.savingsBalance || 0,
        transactions: user.transactions || [],
        premiumStatus: user.premiumStatus || false,
        goals: user.goals || []
      };

      // Generate dashboard insights
      const dashboardInsights = await generateDashboardInsights(userId, userData);
      setInsights(dashboardInsights);

      // Analyze spending patterns
      const patterns = analyzeSpendingPatterns(userData.transactions);
      setSpendingPatterns(patterns);

      // Calculate financial health
      const health = calculateFinancialHealthScore({
        balance: userData.balance,
        savingsBalance: userData.savingsBalance,
        monthlyIncome: user.monthlyIncome || 0,
        monthlyExpenses: user.monthlyExpenses || 0,
        debtAmount: user.debtAmount || 0,
        goals: userData.goals
      });
      setFinancialHealth(health);

      setLastUpdate(new Date());
      onInsightUpdate?.(dashboardInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentUser, userId, onInsightUpdate]);

  // Auto-refresh insights every 5 minutes
  useEffect(() => {
    generateInsights();
    
    const interval = setInterval(generateInsights, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [generateInsights]);

  // Generate contextual insights based on current data
  const generateContextualInsights = () => {
    const contextualInsights: DashboardInsight[] = [];

    if (!user) return contextualInsights;

    // Balance-based insights
    if (user.balance < 1000) {
      contextualInsights.push({
        id: 'low_balance',
        type: 'spending',
        title: 'Low Balance Alert',
        message: 'Your balance is running low. Consider adding funds or reducing expenses.',
        severity: 'warning',
        action: {
          text: 'Add Funds',
          href: '/deposit'
        },
        createdAt: new Date()
      });
    }

    // Savings insights
    if (user.savingsBalance === 0) {
      contextualInsights.push({
        id: 'no_savings',
        type: 'savings',
        title: 'Start Your Savings Journey',
        message: 'You haven\'t started saving yet. Even small amounts can grow significantly over time.',
        severity: 'info',
        action: {
          text: 'Start Saving',
          href: '/savings'
        },
        createdAt: new Date()
      });
    }

    // Premium upgrade insights
    if (!user.premiumStatus && user.balance > 10000) {
      contextualInsights.push({
        id: 'premium_upgrade',
        type: 'premium',
        title: 'Unlock Premium Benefits',
        message: `With ${user.balance.toLocaleString()} KES in your account, you could benefit from Premium features.`,
        severity: 'info',
        action: {
          text: 'Upgrade Now',
          href: '/premium'
        },
        createdAt: new Date()
      });
    }

    // Transaction frequency insights
    const recentTransactions = (user.transactions || []).filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentTransactions.length > 10) {
      contextualInsights.push({
        id: 'high_activity',
        type: 'spending',
        title: 'High Transaction Activity',
        message: `You've made ${recentTransactions.length} transactions this week. Consider reviewing your spending patterns.`,
        severity: 'info',
        action: {
          text: 'View Transactions',
          href: '/transactions'
        },
        createdAt: new Date()
      });
    }

    return contextualInsights;
  };

  const getInsightIcon = (type: string, severity: string) => {
    const iconClass = "h-5 w-5";
    
    switch (severity) {
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getInsightColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const contextualInsights = generateContextualInsights();
  const allInsights = [...insights, ...contextualInsights];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Real-Time Insights</h2>
          <p className="text-sm text-gray-600">
            Last updated: {formatTimeAgo(lastUpdate)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
          <button
            onClick={generateInsights}
            disabled={isLoading}
            className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <Zap className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Health Score */}
      {financialHealth && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Financial Health Score</h3>
            </div>
            <div className={`text-2xl font-bold ${
              financialHealth.grade === 'A' ? 'text-green-600' :
              financialHealth.grade === 'B' ? 'text-blue-600' :
              financialHealth.grade === 'C' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {financialHealth.score}/100
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {financialHealth.breakdown.emergencyFund}%
              </div>
              <div className="text-xs text-gray-600">Emergency Fund</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {financialHealth.breakdown.savingsRate}%
              </div>
              <div className="text-xs text-gray-600">Savings Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {financialHealth.breakdown.debtRatio}%
              </div>
              <div className="text-xs text-gray-600">Debt Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {financialHealth.breakdown.goalProgress}%
              </div>
              <div className="text-xs text-gray-600">Goal Progress</div>
            </div>
          </div>

          {financialHealth.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {financialHealth.recommendations.slice(0, 3).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Spending Patterns */}
      {spendingPatterns.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Spending Patterns</h3>
          </div>
          
          <div className="space-y-3">
            {spendingPatterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">{pattern.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    KES {pattern.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {pattern.percentage.toFixed(1)}% of spending
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Insights</h3>
        
        {allInsights.length > 0 ? (
          <div className="space-y-3">
            {allInsights.slice(0, 5).map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getInsightColor(insight.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getInsightIcon(insight.type, insight.severity)}
                    <div className="ml-3 flex-1">
                      <h4 className="font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm mb-2">{insight.message}</p>
                      {insight.action && (
                        <a
                          href={insight.action.href}
                          className="inline-flex items-center text-sm font-medium hover:underline"
                        >
                          {insight.action.text} →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {formatTimeAgo(insight.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No insights available at the moment</p>
            <p className="text-sm text-gray-400 mt-1">
              Insights will appear as you use the app more
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <DollarSign className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-blue-900">Add Funds</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <PiggyBank className="h-6 w-6 text-green-600 mb-2" />
          <span className="text-sm font-medium text-green-900">Start Saving</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          <CreditCard className="h-6 w-6 text-purple-600 mb-2" />
          <span className="text-sm font-medium text-purple-900">View Budget</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
          <Shield className="h-6 w-6 text-orange-600 mb-2" />
          <span className="text-sm font-medium text-orange-900">Security</span>
        </button>
      </div>
    </div>
  );
};

export default RealTimeInsights;

