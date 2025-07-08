import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Send, 
  History, 
  Gift, 
  Settings, 
  Menu, 
  X,
  Wallet,
  LogOut,
  Crown,
  Minus,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const { isAdmin } = useAdmin();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Transfer', href: '/transfer', icon: Send },
    { name: 'Withdraw', href: '/withdraw', icon: Minus },
    { name: 'Transactions', href: '/transactions', icon: History },
    { name: 'Rewards', href: '/rewards', icon: Gift },
    { name: 'Premium', href: '/premium', icon: Crown },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Add admin navigation for admin users
  const adminNavigation = [
    { name: 'Revenue Dashboard', href: '/admin', icon: Shield },
  ];

  const allNavigation = isAdmin ? [...adminNavigation, ...navigation] : navigation;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">PhantomPay</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4 pb-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {allNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${item.name === 'Revenue Dashboard' ? 'border-t border-gray-200 mt-4 pt-4' : ''}
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {item.name === 'Revenue Dashboard' && (
                    <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-900">
                {currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isAdmin ? 'Revenue Admin' : 'Premium Account'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 mt-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-purple-600" />
              <span className="font-bold text-gray-900">PhantomPay</span>
              {isAdmin && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;