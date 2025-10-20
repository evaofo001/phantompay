import React from 'react';
import { Gift, Star, TrendingUp, Award, Calendar, Zap } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const Rewards: React.FC = () => {
  const { rewardPoints, balance, addRewardPoints, transactions } = useWallet();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const rewardOffers = [
    {
      id: 1,
      title: 'Transfer Cashback',
      description: 'Get 1% cashback on all money transfers',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      active: true,
      requirement: 'Automatic on all transfers'
    },
    {
      id: 2,
      title: 'Weekly Streak Bonus',
      description: 'Use PhantomPay 5 days in a week for bonus points',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      active: true,
      requirement: '100 points per week'
    },
    {
      id: 3,
      title: 'Referral Rewards',
      description: 'Invite friends and earn 500 points per referral',
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      active: true,
      requirement: 'Friend must complete first transaction',
      link: '/referral' // Add link to referral page
    },
    {
      id: 4,
      title: 'Top-up Bonus',
      description: 'Get extra points when buying airtime/data',
      icon: Zap,
      color: 'from-orange-500 to-orange-600',
      active: true,
      requirement: '0.5% of purchase amount'
    }
  ];

  const redeemOptions = [
    {
      id: 1,
      title: 'Convert to Cash',
      description: 'Convert points to wallet balance',
      points: 100,
      value: 10,
      available: rewardPoints >= 100
    },
    {
      id: 2,
      title: 'Free Transfer',
      description: 'Send money without fees',
      points: 50,
      value: 5,
      available: rewardPoints >= 50
    },
    {
      id: 3,
      title: 'Airtime Discount',
      description: '20% discount on next airtime purchase',
      points: 75,
      value: 15,
      available: rewardPoints >= 75
    },
    {
      id: 4,
      title: 'Data Bundle Bonus',
      description: 'Get extra 500MB on data purchase',
      points: 150,
      value: 30,
      available: rewardPoints >= 150
    }
  ];

  const handleRedeem = (option: any) => {
    if (option.available) {
      // Deduct points and add value to wallet
      const pointsToDeduct = -option.points;
      addRewardPoints(pointsToDeduct, option.title);
      
      // For cash conversion, add money to wallet
      if (option.id === 1) {
        // This would typically update the user's balance
        // The cost is already handled in addRewardPoints function
      }
      
      toast.success(`Successfully redeemed ${option.points} points! 🎉`);
    }
  };

  // Calculate progress data based on transactions
  const calculateProgress = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter((transaction: any) => {
      if (transaction.type !== 'reward') return false;
      const transactionDate = new Date(transaction.timestamp);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const pointsEarned = monthlyTransactions
      .filter((t: any) => t.direction === '+')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
      
    const pointsRedeemed = monthlyTransactions
      .filter((t: any) => t.direction === '-')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
      
    // Tier system
    const totalPoints = rewardPoints;
    let currentTier = 'Bronze';
    let nextTier = 'Silver';
    let pointsToNextTier = 500 - (totalPoints % 500);
    let progressPercentage = (totalPoints % 500) / 500 * 100;
    let tierBenefits = [
      'Basic reward redemption',
      'Standard customer support',
      'Monthly progress tracking'
    ];
    
    if (totalPoints >= 1000) {
      currentTier = 'Gold';
      nextTier = 'Platinum';
      pointsToNextTier = 2000 - (totalPoints % 2000);
      progressPercentage = (totalPoints % 2000) / 2000 * 100;
      tierBenefits = [
        'All Bronze & Silver benefits',
        'Exclusive Gold rewards',
        'Priority customer support',
        'Special promotional offers',
        'Early access to new features'
      ];
    } else if (totalPoints >= 500) {
      currentTier = 'Silver';
      nextTier = 'Gold';
      pointsToNextTier = 1000 - (totalPoints % 1000);
      progressPercentage = (totalPoints % 1000) / 1000 * 100;
      tierBenefits = [
        'All Bronze benefits',
        'Enhanced reward redemption',
        'Priority customer support',
        'Special promotional offers'
      ];
    }
    
    return {
      pointsEarned,
      pointsRedeemed,
      currentTier,
      nextTier,
      pointsToNextTier,
      progressPercentage,
      tierBenefits
    };
  };

  const progressData = calculateProgress();

  // Tier benefits information
  const tierInfo = [
    {
      name: 'Bronze',
      minPoints: 0,
      color: 'from-amber-600 to-amber-800',
      benefits: [
        'Basic reward redemption',
        'Standard customer support',
        'Monthly progress tracking'
      ]
    },
    {
      name: 'Silver',
      minPoints: 500,
      color: 'from-gray-300 to-gray-500',
      benefits: [
        'All Bronze benefits',
        'Enhanced reward redemption',
        'Priority customer support',
        'Special promotional offers'
      ]
    },
    {
      name: 'Gold',
      minPoints: 1000,
      color: 'from-yellow-300 to-yellow-500',
      benefits: [
        'All Bronze & Silver benefits',
        'Exclusive Gold rewards',
        'Priority customer support',
        'Special promotional offers',
        'Early access to new features'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rewards</h1>
        <p className="text-gray-600">Earn points and unlock amazing benefits</p>
      </div>

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm mb-1">Your Reward Points</p>
            <p className="text-4xl font-bold">{rewardPoints.toLocaleString()}</p>
            <p className="text-orange-100 text-sm mt-1">
              Worth {formatCurrency(rewardPoints * 0.1)}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-2xl">
            <Award className="h-12 w-12 text-white" />
          </div>
        </div>
      </div>

      {/* Earn Points Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Ways to Earn Points</h2>
        <div className="space-y-4">
          {rewardOffers.map((offer) => {
            const Icon = offer.icon;
            return (
              <div key={offer.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors">
                <div className={`w-12 h-12 bg-gradient-to-r ${offer.color} rounded-lg flex items-center justify-center mr-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{offer.title}</h3>
                  <p className="text-sm text-gray-600">{offer.description}</p>
                  <p className="text-xs text-orange-600 mt-1">{offer.requirement}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    offer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {offer.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redeem Points Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Redeem Your Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {redeemOptions.map((option) => (
            <div key={option.id} className={`border rounded-xl p-4 transition-all ${
              option.available 
                ? 'border-orange-200 hover:border-orange-300 hover:shadow-md cursor-pointer' 
                : 'border-gray-200 opacity-60'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{option.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{option.points} pts</p>
                  <p className="text-xs text-gray-500">≈ {formatCurrency(option.value)}</p>
                </div>
              </div>
              <button
                onClick={() => handleRedeem(option)}
                disabled={!option.available}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  option.available
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                {option.available ? 'Redeem Now' : 'Not Enough Points'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress This Month</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <p className="text-2xl font-bold text-purple-600">{progressData.pointsEarned}</p>
            <p className="text-sm text-gray-600">Points Earned</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-2xl font-bold text-pink-600">{progressData.pointsRedeemed}</p>
            <p className="text-sm text-gray-600">Points Redeemed</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress to next tier</span>
            <span>{rewardPoints} / {rewardPoints + progressData.pointsToNextTier} points</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${progressData.progressPercentage}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{progressData.pointsToNextTier} more points to reach {progressData.nextTier} tier</p>
        </div>
      </div>

      {/* Tier Benefits Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tier Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tierInfo.map((tier) => (
            <div 
              key={tier.name} 
              className={`border rounded-xl p-4 ${
                progressData.currentTier === tier.name 
                  ? 'border-orange-300 ring-2 ring-orange-100' 
                  : 'border-gray-200'
              }`}
            >
              <div className={`bg-gradient-to-r ${tier.color} text-white rounded-lg p-3 text-center mb-3`}>
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <p className="text-sm opacity-90">Tier</p>
              </div>
              <ul className="space-y-2">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>
              {progressData.currentTier === tier.name && (
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Your Current Tier
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rewards;