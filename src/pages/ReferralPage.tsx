import React, { useState } from 'react';
import { Users, Copy, RefreshCw, CheckCircle, Clock, Award } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useReferral } from '../contexts/ReferralContext';
import toast from 'react-hot-toast';

const ReferralPage: React.FC = () => {
  const { rewardPoints } = useWallet();
  const { referralCode, referrals, generateNewReferralCode, loading } = useReferral();
  const [copied, setCopied] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on PhantomPay!',
        text: `Use my referral code ${referralCode} to get started with PhantomPay and earn rewards!`,
        url: window.location.href
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Friends</h1>
        <p className="text-gray-600">Share PhantomPay with friends and earn rewards</p>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Code</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-50 rounded-lg p-4 font-mono text-center text-lg font-bold text-gray-900">
            {referralCode}
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4 transition-colors"
            disabled={loading}
          >
            {copied ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Copy className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={shareReferral}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all"
            disabled={loading}
          >
            Share
          </button>
          <button
            onClick={generateNewReferralCode}
            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg p-3 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm mb-1">Referral Rewards</p>
            <p className="text-2xl font-bold">500 Points</p>
            <p className="text-orange-100 text-sm mt-1">
              Per successful referral
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-xl">
            <Award className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <p className="text-sm text-gray-600">Reward Points</p>
          <p className="text-2xl font-bold text-gray-900">{rewardPoints.toLocaleString()}</p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Referral History</h2>
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No referrals yet</p>
            <p className="text-sm text-gray-400 mt-1">Share your code to start earning rewards</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Friend Referral</p>
                    <p className="text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                    {getStatusIcon(referral.status)}
                    <span className="ml-1 capitalize">{referral.status}</span>
                  </span>
                  <span className="font-medium text-orange-600">+500 pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-2">
              <span className="text-purple-600 font-bold">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Share Your Code</h3>
              <p className="text-sm text-gray-600 mt-1">Share your referral code with friends</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-2">
              <span className="text-purple-600 font-bold">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Friend Joins</h3>
              <p className="text-sm text-gray-600 mt-1">Friend signs up using your code</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-2">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Friend Completes First Transaction</h3>
              <p className="text-sm text-gray-600 mt-1">Friend makes their first transaction</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-2">
              <span className="text-purple-600 font-bold">4</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">You Earn Rewards</h3>
              <p className="text-sm text-gray-600 mt-1">Get 500 points when referral is complete</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;