import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  Target, 
  Settings, 
  Eye, 
  EyeOff,
  Plus,
  X,
  GripVertical
} from 'lucide-react';
import { 
  getPersonalizedQuickActions, 
  generateDashboardInsights, 
  analyzeSpendingPatterns,
  calculateFinancialHealthScore,
  getDashboardLayout,
  updateDashboardLayout,
  type DashboardWidget,
  type QuickAction,
  type DashboardInsight,
  type SpendingPattern
} from '../utils/dashboardUtils';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import RealTimeInsights from './RealTimeInsights';
import toast from 'react-hot-toast';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface CustomizableDashboardProps {
  userId: string;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ userId }) => {
  const { } = useAuth();
  const { user } = useWallet();
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [financialHealth, setFinancialHealth] = useState<unknown>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Available widget types
  const availableWidgets: Omit<DashboardWidget, 'id' | 'data' | 'position' | 'lastUpdated'>[] = [
    {
      type: 'balance',
      title: 'Account Balance',
      isVisible: true,
      isCustomizable: false
    },
    {
      type: 'quick_actions',
      title: 'Quick Actions',
      isVisible: true,
      isCustomizable: true
    },
    {
      type: 'transactions',
      title: 'Recent Transactions',
      isVisible: true,
      isCustomizable: true
    },
    {
      type: 'savings',
      title: 'Savings Summary',
      isVisible: true,
      isCustomizable: true
    },
    {
      type: 'loans',
      title: 'Loan Status',
      isVisible: true,
      isCustomizable: true
    },
    {
      type: 'achievements',
      title: 'Achievements',
      isVisible: true,
      isCustomizable: true
    },
    {
      type: 'insights',
      title: 'Financial Insights',
      isVisible: true,
      isCustomizable: true
    },
    {
      type: 'goals',
      title: 'Financial Goals',
      isVisible: true,
      isCustomizable: true
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      // Load dashboard layout
      const layout = await getDashboardLayout();
      setWidgets(layout);

      // Load personalized data
      const actions = await getPersonalizedQuickActions();
      setQuickActions(actions);

      // Generate insights
      const userData = {
        balance: user?.balance || 0,
        savingsBalance: user?.savingsBalance || 0,
        transactions: user?.transactions || [],
        premiumStatus: user?.premiumStatus || false,
        goals: user?.goals || []
      };

      const dashboardInsights = await generateDashboardInsights(userId, userData);
      setInsights(dashboardInsights);

      // Analyze spending patterns
      const patterns = analyzeSpendingPatterns(userData.transactions);
      setSpendingPatterns(patterns);

      // Calculate financial health
      const health = calculateFinancialHealthScore({
        balance: userData.balance,
        savingsBalance: userData.savingsBalance,
        monthlyIncome: user?.monthlyIncome || 0,
        monthlyExpenses: user?.monthlyExpenses || 0,
        debtAmount: user?.debtAmount || 0,
        goals: userData.goals
      });
      setFinancialHealth(health);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleLayoutChange = async (layout: any) => {
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find((item: any) => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
    
    try {
      await updateDashboardLayout(userId, updatedWidgets);
      toast.success('Dashboard layout saved');
    } catch (error) {
      toast.error('Failed to save layout');
    }
  };

  const handleAddWidget = (widgetType: string) => {
    const widgetTemplate = availableWidgets.find(w => w.type === widgetType);
    if (!widgetTemplate) return;

    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      ...widgetTemplate,
      data: {},
      position: { x: 0, y: 0, w: 4, h: 2 },
      lastUpdated: new Date()
    };

    setWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
    toast.success('Widget added to dashboard');
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    toast.success('Widget removed from dashboard');
  };

  const handleToggleWidgetVisibility = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    ));
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.isVisible) return null;

    const commonClasses = "bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-full";
    
    switch (widget.type) {
      case 'balance':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wallet className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Account Balance</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                KES {user?.balance?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-600">Available Balance</p>
            </div>
          </div>
        );

      case 'quick_actions':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.slice(0, 4).map((action) => (
                <button
                  key={action.id}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center mb-2`}>
                    <span className="text-white text-sm">📱</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(user?.transactions || []).slice(0, 3).map((transaction: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.direction === '+' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className="text-sm">
                        {transaction.direction === '+' ? '↗' : '↙'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    transaction.direction === '+' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.direction}{transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'savings':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <PiggyBank className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Savings</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                KES {user?.savingsBalance?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-600">Total Savings</p>
              <div className="mt-3 bg-blue-50 rounded-lg p-2">
                <p className="text-xs text-blue-800">Earning 6% annual interest</p>
              </div>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {insights.slice(0, 2).map((insight) => (
                <div key={insight.id} className={`p-3 rounded-lg border ${
                  insight.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  insight.severity === 'error' ? 'bg-red-50 border-red-200' :
                  insight.severity === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'financial_health':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Financial Health</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {financialHealth && (
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  financialHealth.grade === 'A' ? 'text-green-600' :
                  financialHealth.grade === 'B' ? 'text-blue-600' :
                  financialHealth.grade === 'C' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {financialHealth.score}/100
                </div>
                <div className={`text-lg font-semibold mb-2 ${
                  financialHealth.grade === 'A' ? 'text-green-600' :
                  financialHealth.grade === 'B' ? 'text-blue-600' :
                  financialHealth.grade === 'C' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  Grade: {financialHealth.grade}
                </div>
                <p className="text-sm text-gray-600">Financial Health Score</p>
              </div>
            )}
          </div>
        );

      case 'realtime_insights':
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Real-Time Insights</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <RealTimeInsights userId={userId} />
          </div>
        );

      default:
        return (
          <div className={commonClasses}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-gray-500">Widget content coming soon...</p>
          </div>
        );
    }
  };

  const layouts = {
    lg: widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 2,
      minH: 2
    }))
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Your personalized financial overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditing 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? 'Done Editing' : 'Customize'}
          </button>
          
          {isEditing && (
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="bg-gray-50 rounded-2xl p-6 min-h-[600px]">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".drag-handle"
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="relative">
              {isEditing && (
                <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
                  <div className="drag-handle cursor-move p-1 bg-gray-200 rounded">
                    <GripVertical className="h-4 w-4 text-gray-600" />
                  </div>
                  <button
                    onClick={() => handleToggleWidgetVisibility(widget.id)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    {widget.isVisible ? (
                      <Eye className="h-4 w-4 text-gray-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              )}
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Widget</h3>
              <button
                onClick={() => setShowAddWidget(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {availableWidgets
                .filter(w => !widgets.some(existing => existing.type === w.type))
                .map((widget) => (
                  <button
                    key={widget.type}
                    onClick={() => handleAddWidget(widget.type)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{widget.title}</h4>
                    <p className="text-sm text-gray-600 capitalize">{widget.type.replace('_', ' ')}</p>
                  </button>
                ))}
            </div>

            {availableWidgets.filter(w => !widgets.some(existing => existing.type === w.type)).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">All available widgets are already added</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizableDashboard;
