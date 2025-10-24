import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Globe,
  Moon,
  Sun,
  LogOut,
  Edit,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  Mail,
  Phone,
  Calendar,
  Lock,
  Smartphone,
  Building,
  Plus,
  Trash2,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { SUPPORTED_LANGUAGES, getCurrentLanguage, setCurrentLanguage, translate } from '../utils/languageUtils';
import { SUPPORTED_CURRENCIES } from '../utils/currencyUtils';
import { 
  updateUserProfile, 
  addWithdrawalMethod, 
  removeWithdrawalMethod, 
  setDefaultWithdrawalMethod,
  updateNotificationPreferences,
  updateSecuritySettings,
  uploadProfilePicture,
  getKYCStatus,
  submitKYCDocument,
  validatePersonalInfo,
  validateWithdrawalMethod,
  getDefaultProfile,
  type UserProfile,
  type WithdrawalMethod,
  type NotificationPreferences,
  type KYCStatus
} from '../utils/profileUtils';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { currentUser, logout, updatePassword } = useAuth();
  const { user, updateUserPremiumStatus } = useWallet();
  
  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showKYCUpload, setShowKYCUpload] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState<'bank' | 'mobile' | 'card'>('mobile');
  const [currentLanguage, setCurrentLang] = useState(getCurrentLanguage());
  const [currentCurrency, setCurrentCurrency] = useState('KES');
  const [kycStatus, setKycStatus] = useState<KYCStatus>({ status: 'not_submitted', documents: {} });
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    fullName: user?.displayName || 'John Doe',
    phoneNumber: user?.phoneNumber || '+254 712 345 678',
    dateOfBirth: '1990-01-15',
    address: '123 Nairobi Street, Kenya',
    idNumber: 'ID123456789',
    language: currentLanguage,
    currency: currentCurrency
  });

  // Password Change Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Withdrawal Methods
  const [withdrawalMethods, setWithdrawalMethods] = useState([
    {
      id: '1',
      type: 'mobile' as const,
      name: 'My M-Pesa',
      details: { phoneNumber: '+254 712 345 678', provider: 'mpesa', accountName: 'John Doe' },
      isDefault: true,
      verified: true
    },
    {
      id: '2', 
      type: 'bank' as const,
      name: 'Equity Bank',
      details: { bankName: 'Equity Bank', accountNumber: '1234567890', accountHolderName: 'John Doe' },
      isDefault: false,
      verified: true
    }
  ]);

  const [newWithdrawalMethod, setNewWithdrawalMethod] = useState({
    name: '',
    phoneNumber: '',
    provider: 'mpesa',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    cardType: 'visa',
    cardNumber: '',
    expiryDate: '',
    cardHolderName: ''
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    transactions: true,
    rewards: true,
    security: true,
    marketing: false,
    email: true,
    sms: true,
    push: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    biometricAuth: false,
    sessionTimeout: '30',
    loginAlerts: true
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    showBalance: true,
    showActivity: true,
    dataSharing: false,
    analyticsOptOut: false
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    toast.success('Notification preferences updated');
  };

  const handleSecurityChange = (type: keyof typeof securitySettings, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [type]: value
    }));
    toast.success('Security settings updated');
  };

  const handlePrivacyChange = (type: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    toast.success('Privacy settings updated');
  };

  const handleProfileEdit = (field: string) => {
    setEditingField(field);
  };

  const handleProfileSave = async (field: string, value: string) => {
    try {
      // Validate the field if it's personal info
      if (['fullName', 'phoneNumber', 'dateOfBirth', 'address', 'idNumber'].includes(field)) {
        const validationErrors = validatePersonalInfo({
          ...profileData,
          [field]: value
        });
        
        if (validationErrors.length > 0) {
          toast.error(validationErrors[0]);
          return;
        }
      }

      // Update local state
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));

      // Update in database
      if (currentUser) {
        await updateUserProfile(currentUser.uid, {
          personalInfo: {
            ...profileData,
            [field]: value
          }
        });
      }

      setEditingField(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleProfileCancel = () => {
    setEditingField(null);
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    // Reset password form data
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion initiated. You will receive a confirmation email.');
    }
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive a download link via email.');
  };

  const handleAddWithdrawalMethod = () => {
    if (!newWithdrawalMethod.name) {
      toast.error('Please enter a name for this method');
      return;
    }

    const newMethod = {
      id: Date.now().toString(),
      type: withdrawalType,
      name: newWithdrawalMethod.name,
      details: withdrawalType === 'mobile' ? {
        phoneNumber: newWithdrawalMethod.phoneNumber,
        provider: newWithdrawalMethod.provider,
        accountName: newWithdrawalMethod.accountHolderName
      } : withdrawalType === 'bank' ? {
        bankName: newWithdrawalMethod.bankName,
        accountNumber: newWithdrawalMethod.accountNumber,
        accountHolderName: newWithdrawalMethod.accountHolderName
      } : {
        cardType: newWithdrawalMethod.cardType,
        cardNumber: `****-****-****-${newWithdrawalMethod.cardNumber.slice(-4)}`,
        expiryDate: newWithdrawalMethod.expiryDate,
        cardHolderName: newWithdrawalMethod.cardHolderName
      },
      isDefault: withdrawalMethods.length === 0,
      verified: false
    };

    setWithdrawalMethods([...withdrawalMethods, newMethod]);
    setShowAddWithdrawal(false);
    setNewWithdrawalMethod({
      name: '', phoneNumber: '', provider: 'mpesa', bankName: '', accountNumber: '', 
      accountHolderName: '', cardType: 'visa', cardNumber: '', expiryDate: '', cardHolderName: ''
    });
    toast.success('Withdrawal method added successfully');
  };

  const handleDeleteWithdrawalMethod = (id: string) => {
    if (window.confirm('Are you sure you want to delete this withdrawal method?')) {
      setWithdrawalMethods(withdrawalMethods.filter(method => method.id !== id));
      toast.success('Withdrawal method deleted');
    }
  };

  const handleSetDefaultWithdrawal = (id: string) => {
    setWithdrawalMethods(withdrawalMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
    toast.success('Default withdrawal method updated');
  };

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    setCurrentLang(languageCode);
    setProfileData(prev => ({ ...prev, language: languageCode }));
    toast.success('Language updated successfully');
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrentCurrency(currencyCode);
    setProfileData(prev => ({ ...prev, currency: currencyCode }));
    toast.success('Currency updated successfully');
  };

  // KYC Management Functions
  const handleKYCUpload = async (documentType: keyof KYCStatus['documents'], file: File) => {
    try {
      if (currentUser) {
        await submitKYCDocument(currentUser.uid, documentType, file);
        setKycStatus(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: URL.createObjectURL(file)
          }
        }));
        toast.success('Document uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleKYCStatusCheck = async () => {
    try {
      const status = await getKYCStatus();
      setKycStatus(status);
    } catch (error) {
      toast.error('Failed to fetch KYC status');
    }
  };

  // Enhanced withdrawal method management
  const handleAddWithdrawalMethodEnhanced = async () => {
    try {
      if (!newWithdrawalMethod.name) {
        toast.error('Please enter a name for this method');
        return;
      }

      const methodData = {
        type: withdrawalType,
        name: newWithdrawalMethod.name,
        details: withdrawalType === 'mobile' ? {
          phoneNumber: newWithdrawalMethod.phoneNumber,
          provider: newWithdrawalMethod.provider,
          accountName: newWithdrawalMethod.accountHolderName
        } : withdrawalType === 'bank' ? {
          bankName: newWithdrawalMethod.bankName,
          accountNumber: newWithdrawalMethod.accountNumber,
          accountHolderName: newWithdrawalMethod.accountHolderName
        } : {
          cardType: newWithdrawalMethod.cardType,
          cardNumber: newWithdrawalMethod.cardNumber,
          expiryDate: newWithdrawalMethod.expiryDate,
          cardHolderName: newWithdrawalMethod.cardHolderName
        },
        isDefault: withdrawalMethods.length === 0,
        verified: false
      };

      // Validate withdrawal method
      const validationErrors = validateWithdrawalMethod(methodData);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      // Add to database
      if (currentUser) {
        const methodId = await addWithdrawalMethod(currentUser.uid, methodData);
        
        // Update local state
        const newMethod = {
          id: methodId,
          ...methodData,
          createdAt: new Date()
        };
        setWithdrawalMethods([...withdrawalMethods, newMethod]);
      }

      setShowAddWithdrawal(false);
      setNewWithdrawalMethod({
        name: '', phoneNumber: '', provider: 'mpesa', bankName: '', accountNumber: '', 
        accountHolderName: '', cardType: 'visa', cardNumber: '', expiryDate: '', cardHolderName: ''
      });
      toast.success('Withdrawal method added successfully');
    } catch (error) {
      toast.error('Failed to add withdrawal method');
    }
  };

  const handleDeleteWithdrawalMethodEnhanced = async (id: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this withdrawal method?')) {
        if (currentUser) {
          await removeWithdrawalMethod(currentUser.uid, id);
        }
        setWithdrawalMethods(withdrawalMethods.filter(method => method.id !== id));
        toast.success('Withdrawal method deleted');
      }
    } catch (error) {
      toast.error('Failed to delete withdrawal method');
    }
  };

  const handleSetDefaultWithdrawalEnhanced = async (id: string) => {
    try {
      if (currentUser) {
        await setDefaultWithdrawalMethod(currentUser.uid, id);
      }
      setWithdrawalMethods(withdrawalMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      })));
      toast.success('Default withdrawal method updated');
    } catch (error) {
      toast.error('Failed to update default withdrawal method');
    }
  };

  const EditableField = ({ field, value, type = 'text', placeholder }: any) => {
    const [tempValue, setTempValue] = useState(value);
    
    if (editingField === field) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder={placeholder}
          />
          <button
            onClick={() => handleProfileSave(field, tempValue)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleProfileCancel}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{value}</span>
        <button
          onClick={() => handleProfileEdit(field)}
          className="text-purple-600 hover:text-purple-700 p-2"
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <SettingsIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profileData.fullName}</h2>
            <p className="text-purple-100">{currentUser?.email}</p>
            <div className="flex items-center mt-1">
              <span className="text-purple-100 text-sm mr-2">
                {user?.premiumStatus ? 'Premium Account' : 'Basic Account'}
              </span>
              {user?.premiumStatus && (
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full">
                  {(user as any)?.premiumPlan?.toUpperCase() || 'PLUS'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Status */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-gray-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Identity Verification (KYC)</h2>
          </div>
          <button
            onClick={handleKYCStatusCheck}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Refresh Status
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Verification Status</p>
              <p className="text-sm text-gray-600">
                {kycStatus.status === 'verified' && 'Your identity has been verified'}
                {kycStatus.status === 'pending' && 'Your documents are under review'}
                {kycStatus.status === 'rejected' && 'Your documents were rejected'}
                {kycStatus.status === 'not_submitted' && 'Please submit your documents'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              kycStatus.status === 'verified' ? 'bg-green-100 text-green-800' :
              kycStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              kycStatus.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {kycStatus.status.toUpperCase()}
            </span>
          </div>

          {kycStatus.status === 'rejected' && kycStatus.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Rejection Reason:</strong> {kycStatus.rejectionReason}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'idFront', label: 'ID Front', icon: '🆔' },
              { key: 'idBack', label: 'ID Back', icon: '🆔' },
              { key: 'selfie', label: 'Selfie', icon: '📸' },
              { key: 'proofOfAddress', label: 'Proof of Address', icon: '🏠' }
            ].map((doc) => (
              <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{doc.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    kycStatus.documents[doc.key as keyof typeof kycStatus.documents] 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {kycStatus.documents[doc.key as keyof typeof kycStatus.documents] ? 'Uploaded' : 'Missing'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleKYCUpload(doc.key as keyof KYCStatus['documents'], file);
                    }
                  }}
                  className="mt-2 text-xs text-gray-600"
                />
              </div>
            ))}
          </div>

          {kycStatus.status === 'not_submitted' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Complete KYC:</strong> Upload all required documents to verify your identity and unlock full account features.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Email Address</p>
              <p className="text-sm text-gray-600">{currentUser?.email || 'N/A'}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Verified
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Full Name</p>
              <EditableField 
                field="fullName" 
                value={profileData.fullName} 
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Phone Number</p>
              <EditableField 
                field="phoneNumber" 
                value={profileData.phoneNumber} 
                type="tel"
                placeholder="+254 712 345 678"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Date of Birth</p>
              <EditableField 
                field="dateOfBirth" 
                value={profileData.dateOfBirth} 
                type="date"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Address</p>
              <EditableField 
                field="address" 
                value={profileData.address} 
                placeholder="Enter your address"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">ID Number</p>
              <EditableField 
                field="idNumber" 
                value={profileData.idNumber} 
                placeholder="Enter your ID number"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal & Deposit Destinations */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-gray-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Withdrawal & Deposit Methods</h2>
          </div>
          <button
            onClick={() => setShowAddWithdrawal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Method
          </button>
        </div>

        <div className="space-y-4">
          {withdrawalMethods.map((method) => (
            <div key={method.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    {method.type === 'mobile' && <Smartphone className="h-5 w-5 text-green-600" />}
                    {method.type === 'bank' && <Building className="h-5 w-5 text-blue-600" />}
                    {method.type === 'card' && <CreditCard className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{method.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                  {method.verified ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteWithdrawalMethodEnhanced(method.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                {method.type === 'mobile' && (
                  <>
                    <p>Phone: {(method.details as any).phoneNumber}</p>
                    <p>Provider: {(method.details as any).provider.toUpperCase()}</p>
                  </>
                )}
                {method.type === 'bank' && (
                  <>
                    <p>Bank: {(method.details as any).bankName}</p>
                    <p>Account: ****{(method.details as any).accountNumber.slice(-4)}</p>
                  </>
                )}
                {method.type === 'card' && (
                  <>
                    <p>Card: {(method.details as any).cardNumber}</p>
                    <p>Expires: {(method.details as any).expiryDate}</p>
                  </>
                )}
              </div>

              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefaultWithdrawalEnhanced(method.id)}
                  className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}

          {withdrawalMethods.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No withdrawal methods added yet</p>
              <p className="text-sm text-gray-400 mt-1">Add a method to enable withdrawals</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Withdrawal Method Modal */}
      {showAddWithdrawal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Withdrawal Method</h3>
              <button
                onClick={() => setShowAddWithdrawal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Method Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Method Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'mobile', name: 'Mobile Money', icon: Smartphone },
                    { id: 'bank', name: 'Bank Account', icon: Building },
                    { id: 'card', name: 'Card', icon: CreditCard }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setWithdrawalType(type.id as any)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          withdrawalType === type.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-xs font-medium">{type.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method Name
                </label>
                <input
                  type="text"
                  value={newWithdrawalMethod.name}
                  onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, name: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  placeholder="e.g., My M-Pesa, Main Bank Account"
                />
              </div>

              {/* Mobile Money Fields */}
              {withdrawalType === 'mobile' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newWithdrawalMethod.phoneNumber}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, phoneNumber: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="+254 712 345 678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider
                    </label>
                    <select
                      value={newWithdrawalMethod.provider}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, provider: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="mtn">MTN Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={newWithdrawalMethod.accountHolderName}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, accountHolderName: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Account holder name"
                    />
                  </div>
                </>
              )}

              {/* Bank Account Fields */}
              {withdrawalType === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <select
                      value={newWithdrawalMethod.bankName}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, bankName: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="">Select Bank</option>
                      <option value="Equity Bank">Equity Bank</option>
                      <option value="KCB Bank">KCB Bank</option>
                      <option value="Co-operative Bank">Co-operative Bank</option>
                      <option value="Absa Bank">Absa Bank</option>
                      <option value="Standard Chartered">Standard Chartered</option>
                      <option value="Diamond Trust Bank">Diamond Trust Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={newWithdrawalMethod.accountNumber}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, accountNumber: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={newWithdrawalMethod.accountHolderName}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, accountHolderName: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Account holder name"
                    />
                  </div>
                </>
              )}

              {/* Card Fields */}
              {withdrawalType === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Type
                    </label>
                    <select
                      value={newWithdrawalMethod.cardType}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, cardType: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={newWithdrawalMethod.cardNumber}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, cardNumber: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={newWithdrawalMethod.expiryDate}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, expiryDate: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      value={newWithdrawalMethod.cardHolderName}
                      onChange={(e) => setNewWithdrawalMethod({...newWithdrawalMethod, cardHolderName: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Card holder name"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddWithdrawalMethodEnhanced}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Method
              </button>
              <button
                onClick={() => setShowAddWithdrawal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add extra security to your account</p>
            </div>
            <button
              onClick={() => handleSecurityChange('twoFactorAuth', !securitySettings.twoFactorAuth)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securitySettings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Biometric Authentication</p>
              <p className="text-sm text-gray-600">Use fingerprint or face recognition</p>
            </div>
            <button
              onClick={() => handleSecurityChange('biometricAuth', !securitySettings.biometricAuth)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securitySettings.biometricAuth ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.biometricAuth ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Session Timeout</p>
              <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
            </div>
            <select
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button
              onClick={handleChangePassword}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Change
            </button>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Login Alerts</p>
              <p className="text-sm text-gray-600">Get notified of new logins</p>
            </div>
            <button
              onClick={() => handleSecurityChange('loginAlerts', !securitySettings.loginAlerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securitySettings.loginAlerts ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {key === 'marketing' ? 'Marketing & Updates' : 
                   key === 'sms' ? 'SMS Notifications' :
                   key === 'push' ? 'Push Notifications' :
                   `${key} Notifications`}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'transactions' && 'Get notified about transaction status'}
                  {key === 'rewards' && 'Receive updates about rewards and offers'}
                  {key === 'security' && 'Important security alerts and updates'}
                  {key === 'marketing' && 'Product updates and promotional offers'}
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'sms' && 'Receive notifications via SMS'}
                  {key === 'push' && 'Receive push notifications on your device'}
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <Eye className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(privacySettings).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">
                  {key === 'showBalance' && 'Show Balance on Dashboard'}
                  {key === 'showActivity' && 'Show Activity Status'}
                  {key === 'dataSharing' && 'Data Sharing with Partners'}
                  {key === 'analyticsOptOut' && 'Opt-out of Analytics'}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'showBalance' && 'Display your wallet balance on the main screen'}
                  {key === 'showActivity' && 'Show when you were last active'}
                  {key === 'dataSharing' && 'Allow sharing anonymized data with partners'}
                  {key === 'analyticsOptOut' && 'Disable usage analytics collection'}
                </p>
              </div>
              <button
                onClick={() => handlePrivacyChange(key as keyof typeof privacySettings)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-600">Download all your data</p>
            </div>
            <button
              onClick={handleExportData}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Export
            </button>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <Globe className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-sm text-gray-600">Switch between light and dark themes</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Language</p>
              <p className="text-sm text-gray-600">
                {SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.nativeName || 'English'}
              </p>
            </div>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Currency</p>
              <p className="text-sm text-gray-600">
                {SUPPORTED_CURRENCIES.find(c => c.code === currentCurrency)?.name || 'Kenyan Shilling'}
              </p>
            </div>
            <select
              value={currentCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              {SUPPORTED_CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h2>
        <div className="space-y-3">
          <button
            onClick={() => toast.info('Backup initiated. Check your email for download link.')}
            className="w-full flex items-center justify-center py-3 px-6 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-xl font-medium transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            Backup Account Data
          </button>
          
          <button
            onClick={() => toast.info('Account verification email sent.')}
            className="w-full flex items-center justify-center py-3 px-6 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-xl font-medium transition-colors"
          >
            <Check className="h-5 w-5 mr-2" />
            Verify Account
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-4 px-6 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl font-medium transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;