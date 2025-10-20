import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, ArrowRight, User, DollarSign, MessageSquare, Zap, Crown } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import TransactionAnimation from '../components/TransactionAnimation';
import { checkRateLimit } from '../utils/rateLimiter';
import { generateSecurityAuditLog } from '../utils/securityUtils';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TransferForm {
  recipient: string;
  amount: number;
  description: string;
  transferType: 'internal' | 'external';
}

const Transfer: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TransferForm | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const { balance, sendMoney, loading, getFeeEstimate, user } = useWallet();
  const { currentUser } = useAuth();
  const { isOnline, addOfflineTransaction } = useOfflineSync();
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<TransferForm>({
    defaultValues: {
      transferType: 'internal'
    }
  });

  const watchedAmount = watch('amount');
  const watchedTransferType = watch('transferType');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUserPremiumTier = () => {
    if (!user?.premiumStatus) return 'basic';
    return (user as any).premiumPlan || 'basic';
  };

  const onSubmit = async (data: TransferForm) => {
    if (step === 1) {
      setFormData(data);
      setStep(2);
    } else {
      try {
        if (!formData) return;
        
        // Rate limiting check
        const rateLimitCheck = checkRateLimit(currentUser?.uid || 'anonymous', 'transfer');
        if (!rateLimitCheck.allowed) {
          toast.error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitCheck.remainingTime || 0) / 1000)} seconds.`);
          return;
        }

        // Security audit log
        generateSecurityAuditLog(
          currentUser?.uid || 'anonymous',
          'transfer_initiated',
          { amount: formData.amount, recipient: formData.recipient, type: formData.transferType }
        );

        setShowAnimation(true);
        
        if (!isOnline) {
          // Handle offline transaction
          addOfflineTransaction('transfer', formData);
          toast.success('Transfer queued for when you\'re back online! 📱');
        } else {
          await sendMoney(formData.amount, formData.recipient, formData.description);
          toast.success('Transfer completed successfully! 🎉');
        }
        
        await sendMoney(formData.amount, formData.recipient, formData.description);
        toast.success('Transfer completed successfully! 🎉');
        reset();
        setStep(1);
        setFormData(null);
      } catch (error: any) {
        toast.error(error.message || 'Transfer failed');
      }
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setStep(1);
    setFormData(null);
  };

  const goBack = () => {
    setStep(1);
    setFormData(null);
  };

  // Get fee estimate for current amount
  const feeEstimate = watchedAmount ? getFeeEstimate(watchedAmount, 'p2p') : null;
  const premiumTier = getUserPremiumTier();

  if (step === 2 && formData) {
    const finalFeeEstimate = getFeeEstimate(formData.amount, 'p2p');
    const totalDeduction = formData.amount + finalFeeEstimate.totalFee;

    return (
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Transfer</h1>
          <p className="text-gray-600">Review the details before sending</p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Recipient</span>
              <span className="font-medium text-gray-900">{formData.recipient}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Transfer Type</span>
              <span className="font-medium text-gray-900 capitalize">
                {formData.transferType}
                {formData.transferType === 'internal' && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    PhantomPay User
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Amount</span>
              <span className="font-bold text-2xl text-gray-900">{formatCurrency(formData.amount)}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Transaction Fee</span>
              <div className="text-right">
                <span className="font-medium text-red-600">{formatCurrency(finalFeeEstimate.totalFee)}</span>
                {finalFeeEstimate.premiumDiscount > 0 && (
                  <div className="text-xs text-green-600">
                    Saved {formatCurrency(finalFeeEstimate.premiumDiscount)} with {premiumTier.toUpperCase()}!
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Total Deduction</span>
              <span className="font-bold text-red-600">{formatCurrency(totalDeduction)}</span>
            </div>
            
            {formData.description && (
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-600">Description</span>
                <span className="font-medium text-gray-900">{formData.description}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Your Balance After</span>
              <span className="font-medium text-gray-900">{formatCurrency(balance - totalDeduction)}</span>
            </div>
          </div>
        </div>

        {/* Premium Benefits */}
        {premiumTier !== 'basic' && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
            <div className="flex items-center mb-2">
              <Crown className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900">{premiumTier.toUpperCase()} Benefits Applied</span>
            </div>
            <p className="text-sm text-purple-700">
              You saved {formatCurrency(finalFeeEstimate.premiumDiscount)} on this transaction!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading || totalDeduction > balance}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : totalDeduction > balance ? (
              'Insufficient Balance'
            ) : (
              <>
                Confirm Transfer
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
          
          <button
            onClick={goBack}
            disabled={loading}
            className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <TransactionAnimation
        isVisible={showAnimation}
        type="send"
        amount={formData?.amount || 0}
        onComplete={handleAnimationComplete}
      />
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📱 You're offline. Transactions will be processed when connection is restored.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Send Money</h1>
        <p className="text-gray-600">Transfer money instantly to anyone</p>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-purple-100 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>
          {user?.premiumStatus && (
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{premiumTier.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-6">
          {/* Transfer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transfer Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                watchedTransferType === 'internal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  {...register('transferType')}
                  type="radio"
                  value="internal"
                  className="sr-only"
                />
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Internal</p>
                    <p className="text-xs text-gray-600">PhantomPay users</p>
                  </div>
                </div>
              </label>
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                watchedTransferType === 'external' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  {...register('transferType')}
                  type="radio"
                  value="external"
                  className="sr-only"
                />
                <div className="flex items-center">
                  <Send className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">External</p>
                    <p className="text-xs text-gray-600">Other banks</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {watchedTransferType === 'internal' ? 'Recipient Email' : 'Recipient Details'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('recipient', { 
                  required: 'Recipient is required',
                  pattern: watchedTransferType === 'internal' ? {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address'
                  } : undefined
                })}
                type={watchedTransferType === 'internal' ? 'email' : 'text'}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder={watchedTransferType === 'internal' ? 'Enter email address' : 'Enter phone or account number'}
              />
            </div>
            {errors.recipient && (
              <p className="mt-1 text-sm text-red-600">{errors.recipient.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (KES)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 1, message: 'Amount must be at least KES 1' },
                  max: { value: balance, message: 'Amount exceeds available balance' }
                })}
                type="number"
                step="0.01"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
            {feeEstimate && watchedAmount > 0 && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Amount:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(watchedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Fee:</span>
                    <div className="text-right">
                      <span className="font-medium text-blue-900">{formatCurrency(feeEstimate.totalFee)}</span>
                      {feeEstimate.premiumDiscount > 0 && (
                        <div className="text-xs text-green-600">
                          -{formatCurrency(feeEstimate.premiumDiscount)} ({premiumTier.toUpperCase()} discount)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1">
                    <span className="text-blue-700 font-medium">Total:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(watchedAmount + feeEstimate.totalFee)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('description')}
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="What's this for?"
              />
            </div>
          </div>
        </div>

        {/* Premium Upgrade Hint */}
        {premiumTier === 'basic' && watchedAmount > 0 && feeEstimate && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center mb-2">
              <Crown className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-900">Save on Fees with Premium!</span>
            </div>
            <p className="text-sm text-yellow-800 mb-2">
              With Plus: Save {formatCurrency(feeEstimate.totalFee * 0.25)} • With VIP: Save {formatCurrency(feeEstimate.totalFee * 0.50)}
            </p>
            <button
              type="button"
              onClick={() => window.location.href = '/premium'}
              className="text-sm text-yellow-700 underline hover:text-yellow-800"
            >
              Upgrade now →
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!watchedAmount || (feeEstimate && watchedAmount + feeEstimate.totalFee > balance)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          Continue
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      </form>
    </div>
  );
};

export default Transfer;