// Mobile Money API Integration Service
// This service handles integration with various mobile money providers

export interface MobileMoneyProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
  supportedServices: ('airtime' | 'data' | 'p2p' | 'bill_payment')[];
}

export interface AirtimeRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  provider: string;
  reference?: string;
}

export interface DataBundleRequest {
  phoneNumber: string;
  bundleId: string;
  provider: string;
  reference?: string;
}

export interface TransactionResponse {
  success: boolean;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  message: string;
  reference?: string;
  timestamp: Date;
}

export interface BalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

// Mock mobile money providers configuration
const MOBILE_MONEY_PROVIDERS: MobileMoneyProvider[] = [
  {
    id: 'safaricom_mpesa',
    name: 'Safaricom M-Pesa',
    apiUrl: process.env.REACT_APP_SAFARICOM_API_URL || 'https://api.safaricom.co.ke',
    apiKey: process.env.REACT_APP_SAFARICOM_API_KEY || 'mock_key',
    isActive: true,
    supportedServices: ['airtime', 'data', 'p2p', 'bill_payment']
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    apiUrl: process.env.REACT_APP_AIRTEL_API_URL || 'https://api.airtel.co.ke',
    apiKey: process.env.REACT_APP_AIRTEL_API_KEY || 'mock_key',
    isActive: true,
    supportedServices: ['airtime', 'data', 'p2p']
  },
  {
    id: 'telkom_tkash',
    name: 'Telkom T-Kash',
    apiUrl: process.env.REACT_APP_TELKOM_API_URL || 'https://api.telkom.co.ke',
    apiKey: process.env.REACT_APP_TELKOM_API_KEY || 'mock_key',
    isActive: true,
    supportedServices: ['airtime', 'data', 'p2p']
  }
];

class MobileMoneyAPIService {
  private providers: MobileMoneyProvider[] = MOBILE_MONEY_PROVIDERS;

  // Get provider by ID
  getProvider(providerId: string): MobileMoneyProvider | null {
    return this.providers.find(p => p.id === providerId) || null;
  }

  // Get all active providers
  getActiveProviders(): MobileMoneyProvider[] {
    return this.providers.filter(p => p.isActive);
  }

  // Check provider status
  async checkProviderStatus(providerId: string): Promise<boolean> {
    const provider = this.getProvider(providerId);
    if (!provider) return false;

    try {
      // In a real implementation, this would make an API call to check status
      const response = await fetch(`${provider.apiUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Provider ${providerId} status check failed:`, error);
      return false;
    }
  }

  // Purchase airtime
  async purchaseAirtime(request: AirtimeRequest): Promise<TransactionResponse> {
    const provider = this.getProvider(request.provider);
    if (!provider) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Provider not found',
        timestamp: new Date()
      };
    }

    try {
      // In a real implementation, this would make an API call to the provider
      const response = await fetch(`${provider.apiUrl}/airtime/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: request.phoneNumber,
          amount: request.amount,
          currency: request.currency,
          reference: request.reference || `airtime_${Date.now()}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          transactionId: data.transactionId || `airtime_${Date.now()}`,
          status: 'completed',
          message: 'Airtime purchased successfully',
          reference: data.reference,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          transactionId: '',
          status: 'failed',
          message: data.message || 'Airtime purchase failed',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Airtime purchase error:', error);
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Network error occurred',
        timestamp: new Date()
      };
    }
  }

  // Purchase data bundle
  async purchaseDataBundle(request: DataBundleRequest): Promise<TransactionResponse> {
    const provider = this.getProvider(request.provider);
    if (!provider) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Provider not found',
        timestamp: new Date()
      };
    }

    try {
      // In a real implementation, this would make an API call to the provider
      const response = await fetch(`${provider.apiUrl}/data/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: request.phoneNumber,
          bundleId: request.bundleId,
          reference: request.reference || `data_${Date.now()}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          transactionId: data.transactionId || `data_${Date.now()}`,
          status: 'completed',
          message: 'Data bundle purchased successfully',
          reference: data.reference,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          transactionId: '',
          status: 'failed',
          message: data.message || 'Data bundle purchase failed',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Data bundle purchase error:', error);
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Network error occurred',
        timestamp: new Date()
      };
    }
  }

  // Check transaction status
  async checkTransactionStatus(providerId: string, transactionId: string): Promise<TransactionResponse> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: 'Provider not found',
        timestamp: new Date()
      };
    }

    try {
      const response = await fetch(`${provider.apiUrl}/transactions/${transactionId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: data.success || false,
          transactionId: data.transactionId || transactionId,
          status: data.status || 'pending',
          message: data.message || 'Status checked',
          reference: data.reference,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          transactionId,
          status: 'failed',
          message: data.message || 'Status check failed',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Transaction status check error:', error);
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: 'Network error occurred',
        timestamp: new Date()
      };
    }
  }

  // Get provider balance
  async getProviderBalance(providerId: string): Promise<BalanceResponse> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        success: false,
        balance: 0,
        currency: 'KES',
        lastUpdated: new Date()
      };
    }

    try {
      const response = await fetch(`${provider.apiUrl}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          balance: data.balance || 0,
          currency: data.currency || 'KES',
          lastUpdated: new Date()
        };
      } else {
        return {
          success: false,
          balance: 0,
          currency: 'KES',
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('Balance check error:', error);
      return {
        success: false,
        balance: 0,
        currency: 'KES',
        lastUpdated: new Date()
      };
    }
  }

  // Validate phone number for provider
  validatePhoneNumber(phoneNumber: string, providerId: string): { isValid: boolean; error?: string } {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return { isValid: false, error: 'Provider not found' };
    }

    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Basic validation
    if (cleanNumber.length < 12 || cleanNumber.length > 13) {
      return { isValid: false, error: 'Phone number must be 12-13 digits long' };
    }

    if (!cleanNumber.startsWith('254')) {
      return { isValid: false, error: 'Phone number must start with 254' };
    }

    // Provider-specific validation
    switch (providerId) {
      case 'safaricom_mpesa':
        // M-Pesa number validation
        const mpesaPrefixes = ['254700', '254701', '254702', '254703', '254704', '254705', '254706', '254707', '254708', '254709', '254710', '254711', '254712', '254713', '254714', '254715', '254716', '254717', '254718', '254719', '254740', '254741', '254742', '254743', '254744', '254745', '254746', '254747', '254748', '254749', '254750', '254751', '254752', '254753', '254754', '254755', '254756', '254757', '254758', '254759', '254790', '254791', '254792', '254793', '254794', '254795', '254796', '254797', '254798', '254799'];
        const mpesaPrefix = cleanNumber.substring(0, 6);
        if (!mpesaPrefixes.includes(mpesaPrefix)) {
          return { isValid: false, error: 'Invalid M-Pesa number' };
        }
        break;
      
      case 'airtel_money':
        // Airtel Money number validation
        const airtelPrefixes = ['254730', '254731', '254732', '254733', '254734', '254735', '254736', '254737', '254738', '254739', '254770', '254771', '254772', '254773', '254774', '254775', '254776', '254777', '254778', '254779'];
        const airtelPrefix = cleanNumber.substring(0, 6);
        if (!airtelPrefixes.includes(airtelPrefix)) {
          return { isValid: false, error: 'Invalid Airtel Money number' };
        }
        break;
      
      case 'telkom_tkash':
        // T-Kash number validation
        const tkashPrefixes = ['254720', '254721', '254722', '254723', '254724', '254725', '254726', '254727', '254728', '254729'];
        const tkashPrefix = cleanNumber.substring(0, 6);
        if (!tkashPrefixes.includes(tkashPrefix)) {
          return { isValid: false, error: 'Invalid T-Kash number' };
        }
        break;
    }

    return { isValid: true };
  }

  // Get available airtime products for provider
  async getAirtimeProducts(providerId: string): Promise<any[]> {
    const provider = this.getProvider(providerId);
    if (!provider) return [];

    try {
      const response = await fetch(`${provider.apiUrl}/airtime/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.products || [];
      }
    } catch (error) {
      console.error('Failed to fetch airtime products:', error);
    }

    return [];
  }

  // Get available data bundles for provider
  async getDataBundles(providerId: string): Promise<any[]> {
    const provider = this.getProvider(providerId);
    if (!provider) return [];

    try {
      const response = await fetch(`${provider.apiUrl}/data/bundles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.bundles || [];
      }
    } catch (error) {
      console.error('Failed to fetch data bundles:', error);
    }

    return [];
  }
}

// Export singleton instance
export const mobileMoneyAPI = new MobileMoneyAPIService();
export default mobileMoneyAPI;
