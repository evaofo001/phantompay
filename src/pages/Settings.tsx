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
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { user, updateUserPremiumStatus } = useWallet();
  
  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    fullName: user?.displayName || 'John Doe',
    phoneNumber: '+254 712 345 678',
    dateOfBirth: '1990-01-15',
    language: 'English',
    currency: 'KES'
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

  const handleProfileSave = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setEditingField(null);
    toast.success('Profile updated successfully');
  };

  const handleProfileCancel = () => {
    setEditingField(null);
  };

  const handleChangePassword = () => {
    // Simulate password change
    toast.success('Password change email sent to your inbox');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion initiated. You will receive a confirmation email.');
    }
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive a download link via email.');
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
        </div>
      </div>

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
              <p className="text-sm text-gray-600">{profileData.language}</p>
            </div>
            <select
              value={profileData.language}
              onChange={(e) => setProfileData(prev => ({ ...prev, language: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
              <option value="French">French</option>
            </select>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Currency</p>
              <p className="text-sm text-gray-600">{profileData.currency}</p>
            </div>
            <select
              value={profileData.currency}
              onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="KES">Kenyan Shilling (KES)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
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