import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Phone, Smartphone, Wifi, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface AirtimeForm {
  phoneNumber: string;
  amount: number;
}

interface DataForm {
  phoneNumber: string;
  bundle: string;
  amount: number;
}

const Airtime: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'airtime' | 'data'>('airtime');
  const { balance, buyAirtime, buyData, loading } = useWallet();
  
  const airtimeForm = useForm<AirtimeForm>();
  const dataForm = useForm<DataForm>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const airtimeAmounts = [50, 100, 200, 500, 1000, 2000];
  
  const dataBundles = [
    { name: '100MB - 1 Day', amount: 20 },
    { name: '500MB - 3 Days', amount: 50 },
    { name: '1GB - 7 Days', amount: 100 },
    { name: '2GB - 14 Days', amount: 200 },
    { name: '5GB - 30 Days', amount: 500 },
    { name: '10GB - 30 Days', amount: 1000 },
  ];

  const onSubmitAirtime = async (data: AirtimeForm) => {
    try {
      await buyAirtime(data.amount, data.phoneNumber);
      toast.success(`Airtime of ${formatCurrency(data.amount)} sent successfully!`);
      airtimeForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to buy airtime');
    }
  };

  const onSubmitData = async (data: DataForm) => {
    try {
      const selectedBundle = dataBundles.find(b => b.name === data.bundle);
      if (!selectedBundle) return;
      
      await buyData(selectedBundle.amount, data.phoneNumber, data.bundle);
      toast.success(`Data bundle purchased successfully!`);
      dataForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to buy data bundle');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Airtime & Data</h1>
        <p className="text-gray-600">Buy airtime and data bundles instantly</p>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-purple-100 text-sm mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('airtime')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'airtime'
                ? 'border-green-500 text-green-600 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="h-5 w-5 inline mr-2" />
            Airtime
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Wifi className="h-5 w-5 inline mr-2" />
            Data Bundles
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'airtime' ? (
            <form onSubmit={airtimeForm.handleSubmit(onSubmitAirtime)} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...airtimeForm.register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^(\+254|0)[17]\d{8}$/,
                        message: 'Please enter a valid Kenyan phone number'
                      }
                    })}
                    type="tel"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
                    placeholder="+254712345678 or 0712345678"
                  />
                </div>
                {airtimeForm.formState.errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {airtimeForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Quick Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {airtimeAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => airtimeForm.setValue('amount', amount)}
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
                  {...airtimeForm.register('amount', { 
                    required: 'Amount is required',
                    min: { value: 5, message: 'Minimum amount is KES 5' },
                    max: { value: balance, message: 'Amount exceeds available balance' }
                  })}
                  type="number"
                  step="1"
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
                  placeholder="Enter amount"
                />
                {airtimeForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {airtimeForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    Buy Airtime
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={dataForm.handleSubmit(onSubmitData)} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...dataForm.register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^(\+254|0)[17]\d{8}$/,
                        message: 'Please enter a valid Kenyan phone number'
                      }
                    })}
                    type="tel"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                    placeholder="+254712345678 or 0712345678"
                  />
                </div>
                {dataForm.formState.errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {dataForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Data Bundle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Data Bundle
                </label>
                <div className="space-y-3">
                  {dataBundles.map((bundle) => (
                    <label
                      key={bundle.name}
                      className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center">
                        <input
                          {...dataForm.register('bundle', { required: 'Please select a data bundle' })}
                          type="radio"
                          value={bundle.name}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{bundle.name}</p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(bundle.amount)}
                      </span>
                    </label>
                  ))}
                </div>
                {dataForm.formState.errors.bundle && (
                  <p className="mt-1 text-sm text-red-600">
                    {dataForm.formState.errors.bundle.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    Buy Data Bundle
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Airtime;