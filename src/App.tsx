import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { AdminProvider } from './contexts/AdminContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import Rewards from './pages/Rewards';
import Settings from './pages/Settings';
import Premium from './pages/Premium';
import Withdraw from './pages/Withdraw';

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <WalletProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </AdminRoute>
                  </ProtectedRoute>
                } />
                
                {/* Regular User Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/transfer" element={
                  <ProtectedRoute>
                    <Layout>
                      <Transfer />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/transactions" element={
                  <ProtectedRoute>
                    <Layout>
                      <Transactions />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/rewards" element={
                  <ProtectedRoute>
                    <Layout>
                      <Rewards />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/premium" element={
                  <ProtectedRoute>
                    <Layout>
                      <Premium />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/withdraw" element={
                  <ProtectedRoute>
                    <Layout>
                      <Withdraw />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        </WalletProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;