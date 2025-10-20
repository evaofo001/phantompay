import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, CreditCard, Smartphone, Building, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface DepositForm {
  amount: number;
  method: string;
  phoneNumber?: string;
  accountNumber?: string;
}

const Deposit: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const { balance, depositMoney, loading } = useWallet();
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<DepositForm>();

  const watchedAmount = watch('amount');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const depositMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: Smartphone,
      description: 'Instant deposit via M-Pesa',
      color: 'from-green-500 to-green-600',
      fee: 0,
      fields: ['phoneNumber']
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building,
      description: 'Transfer from your bank account',
      color: 'from-blue-500 to-blue-600',
      fee: 0,
      fields: ['accountNumber']
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: CreditCard,
      description: 'Pay with your card',
      color: 'from-purple-500 to-purple-600',
      fee: 0,
      fields: []
    }
  ];

  const selectedMethodData = depositMethods.find(method => method.id === selectedMethod);

  const onSubmit = async (data: DepositForm) => {
    try {
      await depositMoney(data.amount, selectedMethod);
      toast.success(`Deposit of ${formatCurrency(data.amount)} completed successfully!`);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed');
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Deposit Money</h1>
        <p className="text-gray-600">Add funds to your PhantomPay wallet</p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Current Balance</p>
        <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
      </div>

      {/* Deposit Methods */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Deposit Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {depositMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedMethod === method.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{method.name}</h3>
                <p className="text-xs text-gray-600">{method.description}</p>
                {method.fee === 0 && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      No Fees
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Deposit Form */}
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
                  className="p-3 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
                >
                  <span className="font-medium">{formatCurrency(amount)}</span>
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
                min: { value: 10, message: 'Minimum deposit is KES 10' },
                max: { value: 1000000, message: 'Maximum deposit is KES 1,000,000' }
              })}
              type="number"
              step="1"
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
              placeholder="Enter amount"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
            {watchedAmount > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                You will receive: {formatCurrency(watchedAmount)}
              </p>
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

          {selectedMethodData?.fields.includes('accountNumber') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number
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

          {/* Summary */}
          {watchedAmount > 0 && selectedMethodData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Deposit Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium text-gray-900">{selectedMethodData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(watchedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">You will receive:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(watchedAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
              selectedMethodData 
                ? `bg-gradient-to-r ${selectedMethodData.color} text-white hover:shadow-lg transform hover:scale-105`
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Deposit...
              </div>
            ) : (
              <>
                Deposit {watchedAmount ? formatCurrency(watchedAmount) : 'Money'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Information */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Deposit Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All deposits are processed instantly</li>
          <li>• No fees on deposits from any method</li>
          <li>• Minimum deposit: KES 10</li>
          <li>• Maximum deposit: KES 1,000,000 per transaction</li>
          <li>• Your funds are secured with bank-level encryption</li>
        </ul>
      </div>
    </div>
  );
};

export default Deposit;