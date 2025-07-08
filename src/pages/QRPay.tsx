import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, Scan, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const QRPay: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const { currentUser } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Generate QR code data
  const generateQRData = () => {
    if (!currentUser) return '';
    
    const qrData = {
      type: 'phantompay_payment',
      recipient: currentUser.email,
      amount: amount ? parseFloat(amount) : 0,
      description: description || 'Payment request',
      timestamp: Date.now()
    };
    
    return JSON.stringify(qrData);
  };

  const copyQRLink = async () => {
    const qrData = generateQRData();
    const paymentLink = `https://phantompay.app/pay?data=${encodeURIComponent(qrData)}`;
    
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleScanQR = () => {
    // In a real app, this would open camera for QR scanning
    toast.info('QR Scanner would open here in a real app');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Pay</h1>
        <p className="text-gray-600">Generate or scan QR codes for instant payments</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-purple-500 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <QrCode className="h-5 w-5 inline mr-2" />
            Generate QR
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'scan'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Scan className="h-5 w-5 inline mr-2" />
            Scan QR
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'generate' ? (
            <div className="space-y-6">
              {/* Payment Details Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors"
                    placeholder="Enter amount (leave empty for any amount)"
                    step="0.01"
                  />
                  {amount && (
                    <p className="mt-1 text-sm text-gray-600">
                      Amount: {formatCurrency(parseFloat(amount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors"
                    placeholder="What's this payment for?"
                  />
                </div>
              </div>

              {/* QR Code Display */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                  <QRCode
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={generateQRData()}
                    viewBox={`0 0 256 256`}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Show this QR code to receive payments
                </p>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <button
                  onClick={copyQRLink}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-gray-700">Copy Payment Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Payment Details Summary */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-medium text-purple-900 mb-2">Payment Details</h3>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-purple-700">Recipient:</span>
                    <span className="text-purple-900 font-medium">{currentUser?.email}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-purple-700">Amount:</span>
                    <span className="text-purple-900 font-medium">
                      {amount ? formatCurrency(parseFloat(amount)) : 'Any amount'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-purple-700">Description:</span>
                    <span className="text-purple-900 font-medium">
                      {description || 'Payment request'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              {/* Scan Interface */}
              <div className="bg-gray-100 rounded-2xl p-12 border-2 border-dashed border-gray-300">
                <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Scan QR Code</h3>
                <p className="text-gray-600 mb-6">
                  Point your camera at a PhantomPay QR code to make a payment
                </p>
                <button
                  onClick={handleScanQR}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Open QR Scanner
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-left">
                <h3 className="font-medium text-blue-900 mb-2">How to Scan</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click "Open QR Scanner" above</li>
                  <li>Allow camera access when prompted</li>
                  <li>Point your camera at the QR code</li>
                  <li>Review payment details and confirm</li>
                </ol>
              </div>

              {/* Security Note */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Security Tip:</strong> Always verify the recipient and amount before confirming any payment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRPay;