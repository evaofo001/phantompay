import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { AdminProvider } from './contexts/AdminContext';
import { LoanProvider } from './contexts/LoanContext';
import { ReferralProvider } from './contexts/ReferralContext';
import { AchievementsProvider } from './contexts/AchievementsContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Transfer from './pages/Transfer';
import Deposit from './pages/Deposit';
import Transactions from './pages/Transactions';
import Rewards from './pages/Rewards';
import ReferralPage from './pages/ReferralPage';
import AchievementsPage from './pages/AchievementsPage';
import Settings from './pages/Settings';
import Premium from './pages/Premium';
import Withdraw from './pages/Withdraw';
import Loans from './pages/Loans';
import Savings from './pages/Savings';
import AIAssistant from './pages/AIAssistant';
import EmailLinkHandler from './components/EmailLinkHandler';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/email-link" element={<EmailLinkHandler />} />
            
            {/* Protected Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AdminProvider>
                  <LoanProvider>
                    <WalletProvider>
                      <ReferralProvider>
                        <AchievementsProvider>
                          <Routes>
                            {/* Admin Routes */}
                            <Route path="/admin" element={
                              <AdminRoute>
                                <Layout>
                                  <AdminDashboard />
                                </Layout>
                              </AdminRoute>
                            } />
                            
                            {/* Regular User Routes */}
                            <Route path="/" element={
                              <Layout>
                                <Dashboard />
                              </Layout>
                            } />
                            <Route path="/transfer" element={
                              <Layout>
                                <Transfer />
                              </Layout>
                            } />
                            <Route path="/deposit" element={
                              <Layout>
                                <Deposit />
                              </Layout>
                            } />
                            <Route path="/transactions" element={
                              <Layout>
                                <Transactions />
                              </Layout>
                            } />
                            <Route path="/rewards" element={
                              <Layout>
                                <Rewards />
                              </Layout>
                            } />
                            <Route path="/referral" element={
                              <Layout>
                                <ReferralPage />
                              </Layout>
                            } />
                            <Route path="/achievements" element={
                              <Layout>
                                <AchievementsPage />
                              </Layout>
                            } />
                            <Route path="/loans" element={
                              <Layout>
                                <Loans />
                              </Layout>
                            } />
                            <Route path="/savings" element={
                              <Layout>
                                <Savings />
                              </Layout>
                            } />
                            <Route path="/ai-assistant" element={
                              <Layout>
                                <AIAssistant />
                              </Layout>
                            } />
                            <Route path="/settings" element={
                              <Layout>
                                <Settings />
                              </Layout>
                            } />
                            <Route path="/premium" element={
                              <Layout>
                                <Premium />
                              </Layout>
                            } />
                            <Route path="/withdraw" element={
                              <Layout>
                                <Withdraw />
                              </Layout>
                            } />
                          </Routes>
                        </AchievementsProvider>
                      </ReferralProvider>
                    </WalletProvider>
                  </LoanProvider>
                </AdminProvider>
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
    </AuthProvider>
  );
}

export default App;