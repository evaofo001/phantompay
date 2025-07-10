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
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { Download } from 'lucide-react';

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
    { name: 'Loans', href: '/loans', icon: Target },
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

  const handleDownloadApp = () => {
    // Create a simple PWA manifest and trigger download
    const manifest = {
      name: "PhantomPay Digital Wallet",
      short_name: "PhantomPay",
      description: "Your secure digital wallet for seamless transactions",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#6366f1",
      icons: [
        {
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMSAxNlY4YTIgMiAwIDAgMC0xLTEuNzNsLTctNGEyIDIgMCAwIDAtMiAwbC03IDRBMiAyIDAgMCAwIDMgOHY4YTIgMiAwIDAgMCAxIDEuNzNsNyA0YTIgMiAwIDAgMCAyIDBsNy00QTIgMiAwIDAgMCAyMSAxNloiIGZpbGw9IiM2MzY2ZjEiLz48cGF0aCBkPSJNMTIgMjJWMTIiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTIgMTJsNy00IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTEyIDEybC03LTQiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
          sizes: "192x192",
          type: "image/svg+xml"
        }
      ]
    };

    // Create and download the manifest file
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    // Create a simple HTML file for the app
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhantomPay Digital Wallet</title>
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#6366f1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
        }
        .container {
            max-width: 400px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        h1 { margin: 0 0 10px; font-size: 2rem; }
        p { opacity: 0.9; margin: 0 0 30px; }
        .btn {
            background: white;
            color: #6366f1;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💰</div>
        <h1>PhantomPay</h1>
        <p>Your secure digital wallet for seamless transactions</p>
        <button class="btn" onclick="window.location.href='${window.location.origin}'">
            Open PhantomPay
        </button>
    </div>
    <script>
        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js');
        }
    </script>
</body>
</html>`;

    // Create service worker content
    const swContent = `
const CACHE_NAME = 'phantompay-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});`;

    // Create a zip-like structure by downloading multiple files
    const downloadFile = (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // Download all files
    downloadFile(JSON.stringify(manifest, null, 2), 'manifest.json', 'application/json');
    setTimeout(() => downloadFile(htmlContent, 'index.html', 'text/html'), 500);
    setTimeout(() => downloadFile(swContent, 'sw.js', 'application/javascript'), 1000);
    
    toast.success('PhantomPay app files downloaded! 📱');
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
            <button
              onClick={handleDownloadApp}
              className="w-full flex items-center px-4 py-3 mb-4 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
            >
              <Download className="h-5 w-5 mr-3" />
              Download App
            </button>
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