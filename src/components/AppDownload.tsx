import React, { useState } from 'react';
import { Download, Smartphone, Monitor, Package, CheckCircle, X } from 'lucide-react';
import { androidInstaller, windowsInstaller, linuxInstaller, macosInstaller } from '../utils/appInstaller';
import toast from 'react-hot-toast';

interface AppDownloadProps {
  onClose: () => void;
}

const AppDownload: React.FC<AppDownloadProps> = ({ onClose }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const platforms = [
    {
      id: 'android',
      name: 'Android',
      icon: Smartphone,
      description: 'Download APK for Android devices',
      fileExtension: '.apk',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'windows',
      name: 'Windows',
      icon: Monitor,
      description: 'Download EXE installer for Windows',
      fileExtension: '.exe',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: Package,
      description: 'Download DEB package for Ubuntu/Debian',
      fileExtension: '.deb',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'macos',
      name: 'macOS',
      icon: Monitor,
      description: 'Download DMG for Mac computers',
      fileExtension: '.dmg',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleDownload = async (platform: string) => {
    setDownloading(true);
    setSelectedPlatform(platform);

    try {
      if (platform === 'android' || platform === 'ios') {
        // For mobile, show PWA installation instructions
        toast.success('📱 Installing PhantomPay as a Progressive Web App...', {
          duration: 5000,
        });
        
        // Show PWA installation instructions
        setTimeout(() => {
          showPWAInstallationInstructions(platform);
        }, 1000);
        
        // Try to trigger PWA install prompt
        await triggerPWAInstall();
        
      } else {
        // For desktop platforms, redirect to GitHub releases or provide PWA instructions
        toast.success('🖥️ Desktop app installation instructions...', {
          duration: 5000,
        });
        
        setTimeout(() => {
          showDesktopInstallationInstructions(platform);
        }, 1000);
      }

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to install app. Please try again.');
    } finally {
      setDownloading(false);
      setSelectedPlatform(null);
    }
  };

  const triggerPWAInstall = async () => {
    // Check if PWA can be installed
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
      const deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          
          if (outcome === 'accepted') {
            toast.success('🎉 PhantomPay installed successfully!', {
              duration: 8000,
            });
          } else {
            toast.info('💡 You can install PhantomPay later from your browser menu', {
              duration: 8000,
            });
          }
        } catch (error) {
          console.error('PWA install prompt error:', error);
        }
      }
    } else {
      // Fallback instructions
      toast.info('💡 To install PhantomPay: Use your browser menu "Add to Home Screen" or "Install App"', {
        duration: 8000,
      });
    }
  };

  const showPWAInstallationInstructions = (platform: string) => {
    const instructions = {
      android: '📱 Android: Open Chrome menu → "Add to Home Screen" or "Install App"',
      ios: '🍎 iOS: Tap Share button → "Add to Home Screen"',
    };

    toast.success(instructions[platform as keyof typeof instructions], {
      duration: 10000,
    });
  };

  const showDesktopInstallationInstructions = (platform: string) => {
    const instructions = {
      windows: '🖥️ Windows: Use Chrome/Edge → Menu → "Install PhantomPay" or visit our website for desktop app',
      linux: '🐧 Linux: Use Chrome/Firefox → Menu → "Install PhantomPay" or visit our website for desktop app',
      macos: '🍎 macOS: Use Chrome/Safari → Menu → "Install PhantomPay" or visit our website for desktop app',
    };

    toast.success(instructions[platform as keyof typeof instructions], {
      duration: 10000,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Download className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Download PhantomPay App</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Choose your platform to download the PhantomPay app installer:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === platform.id;
            const isDownloading = downloading && selectedPlatform === platform.id;

            return (
              <button
                key={platform.id}
                onClick={() => handleDownload(platform.id)}
                disabled={downloading}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                } ${downloading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${platform.color} mr-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                    </div>
                  </div>
                  {isDownloading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  ) : (
                    <Download className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">📱 Alternative: Progressive Web App (PWA)</h4>
          <p className="text-sm text-blue-800 mb-3">
            You can also install PhantomPay as a Progressive Web App directly in your browser:
          </p>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Chrome/Edge:</strong> Click the install button in the address bar</p>
            <p>• <strong>Safari (iOS):</strong> Tap Share → Add to Home Screen</p>
            <p>• <strong>Firefox:</strong> Click the install button in the address bar</p>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• These are demo installers for demonstration purposes</p>
            <p>• In production, these would be real, signed installers</p>
            <p>• The PWA version provides the same functionality as native apps</p>
            <p>• All your data is securely synced across all platforms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownload;
