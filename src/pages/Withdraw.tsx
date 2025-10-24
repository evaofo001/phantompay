import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Minus, Smartphone, Building, AlertTriangle, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { getFeeBreakdown } from '../utils/feeCalculator';
import toast from 'react-hot-toast';

interface WithdrawForm {
  amount: number;
  method: string;
  phoneNumber?: string;
  accountNumber?: string;
  bankName?: string;
}

const Withdraw: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const { balance, withdrawMoney, loading } = useWallet();
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<WithdrawForm>();

  const watchedAmount = watch('amount');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const withdrawMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: Smartphone,
      description: 'Instant withdrawal to M-Pesa',
      color: 'from-green-500 to-green-600',
      fields: ['phoneNumber']
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building,
      description: 'Transfer to your bank account',
      color: 'from-blue-500 to-blue-600',
      fields: ['accountNumber', 'bankName']
    }
  ];

  const selectedMethodData = withdrawMethods.find(method => method.id === selectedMethod);
  const feeBreakdown = watchedAmount ? getFeeBreakdown(watchedAmount, 'withdrawal') : null;

  const onSubmit = async (data: WithdrawForm) => {
    try {
      if (!feeBreakdown) return;
      
      if (feeBreakdown.totalAmount > balance) {
        toast.error('Insufficient balance including fees');
        return;
      }

      await withdrawMoney(data.amount, selectedMethod);
      toast.success(`Withdrawal of ${formatCurrency(data.amount)} initiated successfully!`);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal failed');
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-red-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Minus className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Withdraw Money</h1>
        <p className="text-gray-600">Transfer funds from your PhantomPay wallet</p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-purple-100 text-sm mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
      </div>

      {/* Withdrawal Methods */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Withdrawal Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {withdrawMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedMethod === method.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{method.name}</h3>
                <p className="text-xs text-gray-600">{method.description}</p>
              </button>
            );
          })}
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Quick Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Amount Selection
            </label>
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    const event = { target: { name: 'amount', value: amount.toString() } };
                    register('amount').onChange(event);
                  }}
                  className="p-3 border border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-center"
                  disabled={amount > balance}
                >
                  <span className={`font-medium ${amount > balance ? 'text-gray-400' : ''}`}>
                    {formatCurrency(amount)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Custom Amount
            </label>
            <input
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 50, message: 'Minimum withdrawal is KES 50' },
                max: { value: balance, message: 'Amount exceeds available balance' }
              })}
              type="number"
              step="1"
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
              placeholder="Enter amount"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Method-specific fields */}
          {selectedMethodData?.fields.includes('phoneNumber') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                {...register('phoneNumber', { 
                  required: selectedMethod === 'mpesa' ? 'Phone number is required' : false,
                  pattern: {
                    value: /^(\+254|0)[17]\d{8}$/,
                    message: 'Please enter a valid Kenyan phone number'
                  }
                })}
                type="tel"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
                placeholder="+254712345678 or 0712345678"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>
          )}

          {selectedMethodData?.fields.includes('bankName') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <select
                {...register('bankName', { 
                  required: selectedMethod === 'bank' ? 'Bank name is required' : false
                })}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              >
                <option value="">Select your bank</option>
                <option value="equity">Equity Bank</option>
                <option value="kcb">KCB Bank</option>
                <option value="coop">Co-operative Bank</option>
                <option value="absa">Absa Bank</option>
                <option value="standard">Standard Chartered</option>
                <option value="dtb">Diamond Trust Bank</option>
                <option value="family">Family Bank</option>
                <option value="ncba">NCBA Bank</option>
              </select>
              {errors.bankName && (
                <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
              )}
            </div>
          )}

          {selectedMethodData?.fields.includes('accountNumber') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                {...register('accountNumber', { 
                  required: selectedMethod === 'bank' ? 'Account number is required' : false
                })}
                type="text"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Enter your account number"
              />
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
              )}
            </div>
          )}

          {/* Fee Breakdown */}
          {feeBreakdown && watchedAmount > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900 mb-3">Withdrawal Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Withdrawal Amount:</span>
                      <span className="font-medium text-amber-900">{formatCurrency(watchedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Processing Fee:</span>
                      <span className="font-medium text-amber-900">{formatCurrency(feeBreakdown.totalFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-200 pt-2">
                      <span className="text-amber-700">Total Deducted:</span>
                      <span className="font-bold text-amber-900">{formatCurrency(feeBreakdown.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">You will receive:</span>
                      <span className="font-bold text-green-700">{formatCurrency(feeBreakdown.netAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !watchedAmount || (feeBreakdown && watchedAmount + feeBreakdown.totalFee > balance)}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
              selectedMethodData 
                ? `bg-gradient-to-r ${selectedMethodData.color} text-white hover:shadow-lg transform hover:scale-105`
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Withdrawal...
              </div>
            ) : (
              <>
                Withdraw {watchedAmount ? formatCurrency(watchedAmount) : 'Money'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Information */}
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <h3 className="font-medium text-red-900 mb-2">Withdrawal Information</h3>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Withdrawal fee: 1.5% + KES 20 (max KES 250)</li>
          <li>• Minimum withdrawal: KES 50</li>
          <li>• M-Pesa withdrawals are processed instantly</li>
          <li>• Bank transfers may take 1-3 business days</li>
          <li>• Ensure your details are correct to avoid delays</li>
        </ul>
      </div>
    </div>
  );
};

export default Withdraw;