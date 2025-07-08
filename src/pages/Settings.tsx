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
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    transactions: true,
    rewards: true,
    security: true,
    marketing: false
  });
  const [showBalance, setShowBalance] = useState(true);
  
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

  const profileSections = [
    {
      title: 'Account Information',
      icon: User,
      items: [
        { label: 'Email', value: currentUser?.email || 'N/A', editable: false },
        { label: 'Phone Number', value: '+254 712 345 678', editable: true },
        { label: 'Full Name', value: 'John Doe', editable: true },
        { label: 'Date of Birth', value: 'Not set', editable: true }
      ]
    }
  ];

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
            <h2 className="text-xl font-bold">John Doe</h2>
            <p className="text-purple-100">{currentUser?.email}</p>
            <p className="text-purple-100 text-sm">Premium Account</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      {profileSections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <Icon className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.value}</p>
                  </div>
                  {item.editable && (
                    <button className="text-purple-600 hover:text-purple-700 p-2">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

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
            <button className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Enabled
            </button>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700 p-2">
              <Edit className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Login Activity</p>
              <p className="text-sm text-gray-600">View recent login attempts</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              View
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
                  {key === 'marketing' ? 'Marketing & Updates' : `${key} Notifications`}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'transactions' && 'Get notified about transaction status'}
                  {key === 'rewards' && 'Receive updates about rewards and offers'}
                  {key === 'security' && 'Important security alerts and updates'}
                  {key === 'marketing' && 'Product updates and promotional offers'}
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
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Show Balance on Dashboard</p>
              <p className="text-sm text-gray-600">Display your wallet balance on the main screen</p>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showBalance ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showBalance ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Data Usage</p>
              <p className="text-sm text-gray-600">View how your data is used</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              View
            </button>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account</p>
            </div>
            <button className="text-red-600 hover:text-red-700 font-medium text-sm">
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
              <p className="text-sm text-gray-600">English</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700 p-2">
              <Edit className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Currency</p>
              <p className="text-sm text-gray-600">Kenyan Shilling (KES)</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700 p-2">
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center py-4 px-6 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl font-medium transition-colors"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;