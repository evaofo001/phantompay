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
  Shield,
  Target,
  PiggyBank
  Plus,
  Download,
  Smartphone,
  Building
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
    { name: 'Deposit', href: '/deposit', icon: Plus },
    { name: 'Withdraw', href: '/withdraw', icon: Minus },
    { name: 'Loans', href: '/loans', icon: Target },
    { name: 'Savings', href: '/savings', icon: PiggyBank },
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
    // Create a comprehensive app package for download
    const createAppPackage = () => {
      // PWA Manifest
      const manifest = {
        name: "PhantomPay Digital Wallet",
        short_name: "PhantomPay",
        description: "Your secure digital wallet for seamless transactions, savings, loans, and AI financial coaching",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#6366f1",
        orientation: "portrait",
        categories: ["finance", "productivity", "business"],
        icons: [
          {
            src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMSAxNlY4YTIgMiAwIDAgMC0xLTEuNzNsLTctNGEyIDIgMCAwIDAtMiAwbC03IDRBMiAyIDAgMCAwIDMgOHY4YTIgMiAwIDAgMCAxIDEuNzNsNyA0YTIgMiAwIDAgMCAyIDBsNy00QTIgMiAwIDAgMCAyMSAxNloiIGZpbGw9IiM2MzY2ZjEiLz48cGF0aCBkPSJNMTIgMjJWMTIiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTIgMTJsNy00IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTEyIDEybC03LTQiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMSAxNlY4YTIgMiAwIDAgMC0xLTEuNzNsLTctNGEyIDIgMCAwIDAtMiAwbC03IDRBMiAyIDAgMCAwIDMgOHY4YTIgMiAwIDAgMCAxIDEuNzNsNyA0YTIgMiAwIDAgMCAyIDBsNy00QTIgMiAwIDAgMCAyMSAxNloiIGZpbGw9IiM2MzY2ZjEiLz48cGF0aCBkPSJNMTIgMjJWMTIiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTIgMTJsNy00IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTEyIDEybC03LTQiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      };

      // Main HTML file
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhantomPay Digital Wallet</title>
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#6366f1">
    <meta name="description" content="Your secure digital wallet for seamless transactions, savings, loans, and AI financial coaching">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="PhantomPay">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 20px;
        }
        .container {
            max-width: 400px;
            width: 100%;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
            font-size: 2rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        h1 { 
            margin: 0 0 10px; 
            font-size: 2.5rem; 
            font-weight: 700;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { 
            opacity: 0.9; 
            margin: 0 0 30px; 
            font-size: 1.1rem;
            line-height: 1.5;
        }
        .features {
            margin: 30px 0;
            text-align: left;
        }
        .feature {
            display: flex;
            align-items: center;
            margin: 10px 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .feature::before {
            content: "✓";
            margin-right: 10px;
            color: #4ade80;
            font-weight: bold;
        }
        .btn {
            background: white;
            color: #6366f1;
            border: none;
            padding: 15px 30px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            width: 100%;
            margin: 10px 0;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .version {
            margin-top: 20px;
            font-size: 0.8rem;
            opacity: 0.7;
        }
        @media (max-width: 480px) {
            .container { padding: 30px 20px; }
            h1 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💰</div>
        <h1>PhantomPay</h1>
        <p class="subtitle">Your secure digital wallet for seamless transactions</p>
        
        <div class="features">
            <div class="feature">Instant money transfers & withdrawals</div>
            <div class="feature">High-yield savings accounts (up to 18%)</div>
            <div class="feature">Savings-backed loans with low rates</div>
            <div class="feature">AI-powered financial coaching</div>
            <div class="feature">Premium tiers with exclusive benefits</div>
            <div class="feature">Reward points & cashback system</div>
        </div>
        
        <button class="btn" onclick="openApp()">
            🚀 Open PhantomPay Web App
        </button>
        
        <button class="btn btn-secondary" onclick="installPWA()">
            📱 Install as App
        </button>
        
        <div class="version">
            Version 2.0 • Built with ❤️ for Kenya
        </div>
    </div>
    
    <script>
        function openApp() {
            window.location.href = '${window.location.origin}';
        }
        
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });
        
        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                });
            } else {
                // Fallback for browsers that don't support PWA installation
                alert('To install PhantomPay:\\n\\n1. Open this page in Chrome/Safari\\n2. Tap the menu (⋮)\\n3. Select "Add to Home Screen"\\n4. Tap "Add"');
            }
        }
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => console.log('SW registered'))
                .catch(error => console.log('SW registration failed'));
        }
    </script>
</body>
</html>`;

      // Enhanced Service Worker
      const swContent = `
const CACHE_NAME = 'phantompay-v2.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/index.html'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline transactions when back online
  return Promise.resolve();
}`;

      // README file
      const readmeContent = `# PhantomPay Digital Wallet

## 🚀 Features

### 💰 Core Wallet Functions
- **Instant Transfers**: Send money to anyone instantly
- **Quick Withdrawals**: Cash out to M-Pesa, bank accounts, or cards
- **Secure Deposits**: Add funds from multiple sources
- **Transaction History**: Track all your financial activities

### 🏦 Savings & Investments
- **High-Yield Savings**: Earn up to 18% annual interest (VIP tier)
- **Flexible Terms**: 1, 3, 6, or 12-month savings periods
- **Premium Bonuses**: Higher rates for Plus and VIP members
- **Auto-Save**: Automatically save a percentage of deposits

### 🎯 Loans
- **Savings-Backed Loans**: Borrow up to 80% of your savings value
- **Low Interest Rates**: 8% for VIP, 12% for Plus, 15% for Basic
- **No Credit Checks**: Your savings are your collateral
- **Flexible Repayment**: Pay back anytime before maturity

### 🤖 AI Financial Coach
- **Personalized Advice**: Get tailored financial guidance
- **Spending Analysis**: Understand your money habits
- **Goal Setting**: Create and track financial objectives
- **Investment Tips**: Learn about growing your wealth

### 👑 Premium Tiers
- **Basic**: Free tier with standard features
- **Plus (KES 200/month)**: 25% fee discount, 2% cashback, 12% savings interest
- **VIP (KES 500/month)**: 50% fee discount, 5% cashback, 18% savings interest, AI coach

### 🎁 Rewards System
- **Earn Points**: Get points for transactions and activities
- **Redeem Rewards**: Convert points to cash or discounts
- **Cashback**: Earn money back on eligible transactions
- **Referral Bonuses**: Invite friends and earn rewards

## 📱 Installation

### Web App
1. Open the included \`index.html\` file in your browser
2. Click "Open PhantomPay Web App"
3. Bookmark for easy access

### Mobile App (PWA)
1. Open \`index.html\` in Chrome or Safari on your phone
2. Tap "Install as App" or use browser menu "Add to Home Screen"
3. The app will install like a native mobile app

## 🔧 Technical Details

### Files Included
- \`index.html\`: Main app launcher
- \`manifest.json\`: PWA configuration
- \`sw.js\`: Service worker for offline functionality
- \`README.md\`: This documentation

### Browser Support
- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

### Security Features
- Bank-level encryption
- Secure authentication
- Transaction verification
- Fraud detection

## 🌍 Supported Regions
- **Primary**: Kenya (KES currency)
- **Mobile Money**: M-Pesa, Airtel Money, MTN
- **Banks**: All major Kenyan banks supported

## 📞 Support
- **Email**: support@phantompay.com
- **Phone**: +254 700 000 000
- **Hours**: 24/7 customer support

## 🔒 Privacy & Security
PhantomPay takes your privacy seriously:
- End-to-end encryption for all transactions
- No data sharing with third parties
- Secure cloud storage
- Regular security audits

---

**PhantomPay** - Your financial future, simplified. 💰✨`;

      return { manifest, htmlContent, swContent, readmeContent };
    };

    const { manifest, htmlContent, swContent, readmeContent } = createAppPackage();

    // Create and download files
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

    // Download all files with proper timing
    downloadFile(JSON.stringify(manifest, null, 2), 'manifest.json', 'application/json');
    setTimeout(() => downloadFile(htmlContent, 'index.html', 'text/html'), 500);
    setTimeout(() => downloadFile(swContent, 'sw.js', 'application/javascript'), 1000);
    setTimeout(() => downloadFile(readmeContent, 'README.md', 'text/markdown'), 1500);
    
    toast.success('📱 PhantomPay app package downloaded! Check your downloads folder for 4 files.');
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