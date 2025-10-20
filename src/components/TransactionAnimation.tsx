import React, { useState, useEffect } from 'react';
import { CheckCircle, Send, ArrowRight } from 'lucide-react';

interface TransactionAnimationProps {
  isVisible: boolean;
  type: 'send' | 'receive' | 'loan' | 'savings';
  amount: number;
  onComplete: () => void;
}

const TransactionAnimation: React.FC<TransactionAnimationProps> = ({
  isVisible,
  type,
  amount,
  onComplete
}) => {
  const [stage, setStage] = useState<'processing' | 'success' | 'complete'>('processing');

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => setStage('success'), 1500);
    const timer2 = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'send':
        return {
          icon: Send,
          color: 'from-blue-500 to-blue-600',
          title: 'Sending Money',
          successTitle: 'Money Sent Successfully!'
        };
      case 'receive':
        return {
          icon: ArrowRight,
          color: 'from-green-500 to-green-600',
          title: 'Receiving Money',
          successTitle: 'Money Received Successfully!'
        };
      case 'loan':
        return {
          icon: CheckCircle,
          color: 'from-purple-500 to-purple-600',
          title: 'Processing Loan',
          successTitle: 'Loan Approved!'
        };
      case 'savings':
        return {
          icon: CheckCircle,
          color: 'from-emerald-500 to-emerald-600',
          title: 'Creating Savings',
          successTitle: 'Savings Account Created!'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'from-gray-500 to-gray-600',
          title: 'Processing',
          successTitle: 'Success!'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        {stage === 'processing' && (
          <>
            <div className={`w-20 h-20 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse`}>
              <Icon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h3>
            <p className="text-gray-600 mb-4">{formatCurrency(amount)}</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </>
        )}

        {stage === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">{config.successTitle}</h3>
            <p className="text-gray-600 mb-4">{formatCurrency(amount)}</p>
            <div className="flex justify-center">
              <div className="text-green-500 text-2xl">✨</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionAnimation;