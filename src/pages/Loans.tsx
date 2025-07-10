import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useLoan } from '../contexts/LoanContext';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

const Loans: React.FC = () => {
  const { user, savingsAccounts, balance, updateUserBalance } = useWallet();
  const { loans, calculateMaxLoanAmount, calculateLoanInterest, applyForLoan, repayLoan, getLoanEligibility, loading } = useLoan();
  const [selectedSavingsId, setSelectedSavingsId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [showApplication, setShowApplication] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');

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

  const premiumTier = getUserPremiumTier();
  const eligibleSavings = savingsAccounts.filter(savings => savings.status === 'active');

  const handleLoanApplication = async () => {
    if (!selectedSavingsId || !loanAmount) {
      toast.error('Please select savings account and enter loan amount');
      return;
    }

    const amount = parseFloat(loanAmount);
    const selectedSavings = savingsAccounts.find(s => s.id === selectedSavingsId);
    
    if (!selectedSavings) {
      toast.error('Selected savings account not found');
      return;
    }

    const eligibility = getLoanEligibility(selectedSavings);
    if (!eligibility.eligible) {
      toast.error(eligibility.reason || 'Not eligible for loan');
      return;
    }

    if (amount > eligibility.maxAmount) {
      toast.error(`Maximum loan amount is ${formatCurrency(eligibility.maxAmount)}`);
      return;
    }

    try {
      await applyForLoan(selectedSavingsId, amount, premiumTier);
      
      // Add loan amount to user's balance
      const newBalance = balance + amount;
      await updateUserBalance(newBalance);
      
      setShowApplication(false);
      setSelectedSavingsId('');
      setLoanAmount('');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to process loan application');
    }
  };

  const handleRepayment = async (loanId: string) => {
    if (!repaymentAmount) {
      toast.error('Please enter repayment amount');
      return;
    }

    const amount = parseFloat(repaymentAmount);
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) {
      toast.error('Loan not found');
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance for repayment');
      return;
    }

    if (amount > loan.remainingAmount) {
      toast.error(`Maximum repayment amount is ${formatCurrency(loan.remainingAmount)}`);
      return;
    }

    try {
      await repayLoan(loanId, amount);
      
      // Deduct repayment from user's balance
      const newBalance = balance - amount;
      await updateUserBalance(newBalance);
      
      setRepaymentAmount('');
      setSelectedLoanId('');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to process repayment');
    }
  };

  const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
  const completedLoans = loans.filter(loan => loan.status === 'repaid');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🎯 Loans</h1>
        <p className="text-gray-600">Get instant loans backed by your savings</p>
      </div>

      {/* Loan Rules Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Loan Rules & Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center text-blue-800">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Must have active savings account
            </div>
            <div className="flex items-center text-blue-800">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Loan ≤ 80% of savings + interest
            </div>
            <div className="flex items-center text-blue-800">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Repayment due before savings maturity
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-blue-800">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Auto-deduction if not repaid on time
            </div>
            <div className="flex items-center text-blue-800">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              No emergency withdrawals with active loans
            </div>
            <div className="flex items-center text-blue-800">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Interest rates: Basic 15%, Plus 12%, VIP 8%
            </div>
          </div>
        </div>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-purple-100 text-sm mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
      </div>

      {/* Loan Application */}
      {eligibleSavings.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">💰 Apply for Loan</h2>
            <button
              onClick={() => setShowApplication(!showApplication)}
              className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-800 transition-all duration-200"
            >
              {showApplication ? 'Cancel' : 'Apply Now'}
            </button>
          </div>

          {showApplication && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Savings Account
                </label>
                <select
                  value={selectedSavingsId}
                  onChange={(e) => setSelectedSavingsId(e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                >
                  <option value="">Choose savings account</option>
                  {eligibleSavings.map((savings) => {
                    const eligibility = getLoanEligibility(savings);
                    return (
                      <option key={savings.id} value={savings.id} disabled={!eligibility.eligible}>
                        {savings.lockPeriod} Month Savings - {formatCurrency(savings.principal)} 
                        {eligibility.eligible ? ` (Max: ${formatCurrency(eligibility.maxAmount)})` : ' (Not eligible)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedSavingsId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount
                    </label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="Enter loan amount"
                      max={(() => {
                        const selectedSavings = savingsAccounts.find(s => s.id === selectedSavingsId);
                        return selectedSavings ? getLoanEligibility(selectedSavings).maxAmount : 0;
                      })()}
                    />
                  </div>

                  {loanAmount && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h3 className="font-medium text-green-900 mb-3">Loan Calculation</h3>
                      {(() => {
                        const amount = parseFloat(loanAmount);
                        if (amount > 0) {
                          const calculation = calculateLoanInterest(amount, premiumTier);
                          return (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-green-700">Loan Amount:</p>
                                <p className="font-semibold text-green-900">{formatCurrency(amount)}</p>
                              </div>
                              <div>
                                <p className="text-green-700">Interest Rate:</p>
                                <p className="font-semibold text-green-900">{calculation.rate}% annual</p>
                              </div>
                              <div>
                                <p className="text-green-700">Total Interest:</p>
                                <p className="font-semibold text-green-900">{formatCurrency(calculation.totalInterest)}</p>
                              </div>
                              <div>
                                <p className="text-green-700">Total Repayment:</p>
                                <p className="font-semibold text-green-900">{formatCurrency(calculation.totalRepayment)}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <button
                    onClick={handleLoanApplication}
                    disabled={loading || !loanAmount}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        Apply for Loan
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🔄 Active Loans</h2>
          
          <div className="space-y-4">
            {activeLoans.map((loan) => {
              const daysUntilDue = differenceInDays(loan.dueDate, new Date());
              const isOverdue = daysUntilDue < 0;
              const progressPercentage = ((loan.repaidAmount / loan.totalRepayment) * 100);

              return (
                <div key={loan.id} className={`border rounded-xl p-6 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Loan #{loan.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Interest Rate: {loan.interestRate}%
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isOverdue ? 'Overdue' : 'Active'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Loan Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Repayment</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(loan.totalRepayment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="font-semibold text-red-600">{formatCurrency(loan.remainingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {format(loan.dueDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Repayment Progress</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Repayment Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex space-x-3">
                      <input
                        type="number"
                        value={selectedLoanId === loan.id ? repaymentAmount : ''}
                        onChange={(e) => {
                          setSelectedLoanId(loan.id);
                          setRepaymentAmount(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        placeholder="Repayment amount"
                        max={Math.min(loan.remainingAmount, balance)}
                      />
                      <button
                        onClick={() => handleRepayment(loan.id)}
                        disabled={loading || !repaymentAmount || selectedLoanId !== loan.id}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {loading && selectedLoanId === loan.id ? 'Processing...' : 'Repay'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Loans */}
      {completedLoans.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">✅ Completed Loans</h2>
          
          <div className="space-y-4">
            {completedLoans.map((loan) => (
              <div key={loan.id} className="border border-green-200 bg-green-50 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Loan #{loan.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Completed on {format(loan.dueDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Repaid
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Paid</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Repaid</p>
                    <p className="font-semibold text-green-600">{formatCurrency(loan.totalRepayment)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Loans State */}
      {loans.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Loans Yet</h3>
          <p className="text-gray-500 mb-4">
            {eligibleSavings.length > 0 
              ? 'Apply for your first loan using your savings as collateral'
              : 'Create a savings account first to become eligible for loans'
            }
          </p>
          {eligibleSavings.length === 0 && (
            <button
              onClick={() => window.location.href = '/savings'}
              className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-800 transition-all duration-200"
            >
              Create Savings Account
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Loans;