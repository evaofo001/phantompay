// Airtime and Data Utilities for Dynamic Provider Integration

export interface AirtimeProvider {
  id: string;
  name: string;
  logo: string;
  country: string;
  currency: string;
  status: 'active' | 'inactive' | 'maintenance';
  supportedServices: ('airtime' | 'data')[];
}

export interface AirtimeProduct {
  id: string;
  providerId: string;
  type: 'airtime';
  amount: number;
  currency: string;
  price: number;
  bonus?: number;
  validity?: number; // in days
  isActive: boolean;
  category: 'quick' | 'standard' | 'premium';
}

export interface DataBundle {
  id: string;
  providerId: string;
  type: 'data';
  name: string;
  description: string;
  size: number; // in MB
  validity: number; // in days
  price: number;
  currency: string;
  isActive: boolean;
  category: 'daily' | 'weekly' | 'monthly' | 'unlimited';
  speed?: '2G' | '3G' | '4G' | '5G';
}

export interface AirtimeTransaction {
  id: string;
  userId: string;
  providerId: string;
  phoneNumber: string;
  productId: string;
  amount: number;
  price: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId: string;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// Dynamic airtime providers configuration
export const AIRTIME_PROVIDERS: AirtimeProvider[] = [
  {
    id: 'safaricom',
    name: 'Safaricom',
    logo: '/logos/safaricom.png',
    country: 'KE',
    currency: 'KES',
    status: 'active',
    supportedServices: ['airtime', 'data']
  },
  {
    id: 'airtel',
    name: 'Airtel',
    logo: '/logos/airtel.png',
    country: 'KE',
    currency: 'KES',
    status: 'active',
    supportedServices: ['airtime', 'data']
  },
  {
    id: 'telkom',
    name: 'Telkom',
    logo: '/logos/telkom.png',
    country: 'KE',
    currency: 'KES',
    status: 'active',
    supportedServices: ['airtime', 'data']
  }
];

// Dynamic airtime products (can be fetched from API)
export const getAirtimeProducts = async (providerId?: string): Promise<AirtimeProduct[]> => {
  // In a real implementation, this would fetch from provider APIs
  const products: AirtimeProduct[] = [
    // Safaricom products
    { id: 'saf_50', providerId: 'safaricom', type: 'airtime', amount: 50, currency: 'KES', price: 50, isActive: true, category: 'quick' },
    { id: 'saf_100', providerId: 'safaricom', type: 'airtime', amount: 100, currency: 'KES', price: 100, isActive: true, category: 'quick' },
    { id: 'saf_200', providerId: 'safaricom', type: 'airtime', amount: 200, currency: 'KES', price: 200, isActive: true, category: 'standard' },
    { id: 'saf_500', providerId: 'safaricom', type: 'airtime', amount: 500, currency: 'KES', price: 500, isActive: true, category: 'standard' },
    { id: 'saf_1000', providerId: 'safaricom', type: 'airtime', amount: 1000, currency: 'KES', price: 1000, bonus: 50, isActive: true, category: 'premium' },
    { id: 'saf_2000', providerId: 'safaricom', type: 'airtime', amount: 2000, currency: 'KES', price: 2000, bonus: 200, isActive: true, category: 'premium' },
    
    // Airtel products
    { id: 'air_50', providerId: 'airtel', type: 'airtime', amount: 50, currency: 'KES', price: 50, isActive: true, category: 'quick' },
    { id: 'air_100', providerId: 'airtel', type: 'airtime', amount: 100, currency: 'KES', price: 100, isActive: true, category: 'quick' },
    { id: 'air_200', providerId: 'airtel', type: 'airtime', amount: 200, currency: 'KES', price: 200, isActive: true, category: 'standard' },
    { id: 'air_500', providerId: 'airtel', type: 'airtime', amount: 500, currency: 'KES', price: 500, isActive: true, category: 'standard' },
    { id: 'air_1000', providerId: 'airtel', type: 'airtime', amount: 1000, currency: 'KES', price: 1000, bonus: 100, isActive: true, category: 'premium' },
    
    // Telkom products
    { id: 'tel_50', providerId: 'telkom', type: 'airtime', amount: 50, currency: 'KES', price: 50, isActive: true, category: 'quick' },
    { id: 'tel_100', providerId: 'telkom', type: 'airtime', amount: 100, currency: 'KES', price: 100, isActive: true, category: 'quick' },
    { id: 'tel_200', providerId: 'telkom', type: 'airtime', amount: 200, currency: 'KES', price: 200, isActive: true, category: 'standard' },
    { id: 'tel_500', providerId: 'telkom', type: 'airtime', amount: 500, currency: 'KES', price: 500, isActive: true, category: 'standard' },
  ];

  return providerId ? products.filter(p => p.providerId === providerId) : products;
};

// Dynamic data bundles (can be fetched from API)
export const getDataBundles = async (providerId?: string): Promise<DataBundle[]> => {
  // In a real implementation, this would fetch from provider APIs
  const bundles: DataBundle[] = [
    // Safaricom bundles
    { id: 'saf_100mb_1d', providerId: 'safaricom', type: 'data', name: '100MB - 1 Day', description: '100MB data valid for 1 day', size: 100, validity: 1, price: 20, currency: 'KES', isActive: true, category: 'daily', speed: '4G' },
    { id: 'saf_500mb_3d', providerId: 'safaricom', type: 'data', name: '500MB - 3 Days', description: '500MB data valid for 3 days', size: 500, validity: 3, price: 50, currency: 'KES', isActive: true, category: 'daily', speed: '4G' },
    { id: 'saf_1gb_7d', providerId: 'safaricom', type: 'data', name: '1GB - 7 Days', description: '1GB data valid for 7 days', size: 1024, validity: 7, price: 100, currency: 'KES', isActive: true, category: 'weekly', speed: '4G' },
    { id: 'saf_2gb_14d', providerId: 'safaricom', type: 'data', name: '2GB - 14 Days', description: '2GB data valid for 14 days', size: 2048, validity: 14, price: 200, currency: 'KES', isActive: true, category: 'weekly', speed: '4G' },
    { id: 'saf_5gb_30d', providerId: 'safaricom', type: 'data', name: '5GB - 30 Days', description: '5GB data valid for 30 days', size: 5120, validity: 30, price: 500, currency: 'KES', isActive: true, category: 'monthly', speed: '4G' },
    { id: 'saf_10gb_30d', providerId: 'safaricom', type: 'data', name: '10GB - 30 Days', description: '10GB data valid for 30 days', size: 10240, validity: 30, price: 1000, currency: 'KES', isActive: true, category: 'monthly', speed: '4G' },
    
    // Airtel bundles
    { id: 'air_100mb_1d', providerId: 'airtel', type: 'data', name: '100MB - 1 Day', description: '100MB data valid for 1 day', size: 100, validity: 1, price: 20, currency: 'KES', isActive: true, category: 'daily', speed: '4G' },
    { id: 'air_500mb_3d', providerId: 'airtel', type: 'data', name: '500MB - 3 Days', description: '500MB data valid for 3 days', size: 500, validity: 3, price: 50, currency: 'KES', isActive: true, category: 'daily', speed: '4G' },
    { id: 'air_1gb_7d', providerId: 'airtel', type: 'data', name: '1GB - 7 Days', description: '1GB data valid for 7 days', size: 1024, validity: 7, price: 100, currency: 'KES', isActive: true, category: 'weekly', speed: '4G' },
    { id: 'air_2gb_14d', providerId: 'airtel', type: 'data', name: '2GB - 14 Days', description: '2GB data valid for 14 days', size: 2048, validity: 14, price: 200, currency: 'KES', isActive: true, category: 'weekly', speed: '4G' },
    { id: 'air_5gb_30d', providerId: 'airtel', type: 'data', name: '5GB - 30 Days', description: '5GB data valid for 30 days', size: 5120, validity: 30, price: 500, currency: 'KES', isActive: true, category: 'monthly', speed: '4G' },
    
    // Telkom bundles
    { id: 'tel_100mb_1d', providerId: 'telkom', type: 'data', name: '100MB - 1 Day', description: '100MB data valid for 1 day', size: 100, validity: 1, price: 20, currency: 'KES', isActive: true, category: 'daily', speed: '4G' },
    { id: 'tel_500mb_3d', providerId: 'telkom', type: 'data', name: '500MB - 3 Days', description: '500MB data valid for 3 days', size: 500, validity: 3, price: 50, currency: 'KES', isActive: true, category: 'daily', speed: '4G' },
    { id: 'tel_1gb_7d', providerId: 'telkom', type: 'data', name: '1GB - 7 Days', description: '1GB data valid for 7 days', size: 1024, validity: 7, price: 100, currency: 'KES', isActive: true, category: 'weekly', speed: '4G' },
    { id: 'tel_2gb_14d', providerId: 'telkom', type: 'data', name: '2GB - 14 Days', description: '2GB data valid for 14 days', size: 2048, validity: 14, price: 200, currency: 'KES', isActive: true, category: 'weekly', speed: '4G' },
  ];

  return providerId ? bundles.filter(b => b.providerId === providerId) : bundles;
};

// Utility functions
export const formatDataSize = (sizeInMB: number): string => {
  if (sizeInMB < 1024) {
    return `${sizeInMB}MB`;
  } else {
    return `${(sizeInMB / 1024).toFixed(1)}GB`;
  }
};

export const getProviderByPhoneNumber = (phoneNumber: string): AirtimeProvider | null => {
  // Simple phone number prefix detection
  const prefixes = {
    '254700': 'safaricom',
    '254701': 'safaricom',
    '254702': 'safaricom',
    '254703': 'safaricom',
    '254704': 'safaricom',
    '254705': 'safaricom',
    '254706': 'safaricom',
    '254707': 'safaricom',
    '254708': 'safaricom',
    '254709': 'safaricom',
    '254710': 'safaricom',
    '254711': 'safaricom',
    '254712': 'safaricom',
    '254713': 'safaricom',
    '254714': 'safaricom',
    '254715': 'safaricom',
    '254716': 'safaricom',
    '254717': 'safaricom',
    '254718': 'safaricom',
    '254719': 'safaricom',
    '254740': 'safaricom',
    '254741': 'safaricom',
    '254742': 'safaricom',
    '254743': 'safaricom',
    '254744': 'safaricom',
    '254745': 'safaricom',
    '254746': 'safaricom',
    '254747': 'safaricom',
    '254748': 'safaricom',
    '254749': 'safaricom',
    '254750': 'safaricom',
    '254751': 'safaricom',
    '254752': 'safaricom',
    '254753': 'safaricom',
    '254754': 'safaricom',
    '254755': 'safaricom',
    '254756': 'safaricom',
    '254757': 'safaricom',
    '254758': 'safaricom',
    '254759': 'safaricom',
    '254790': 'safaricom',
    '254791': 'safaricom',
    '254792': 'safaricom',
    '254793': 'safaricom',
    '254794': 'safaricom',
    '254795': 'safaricom',
    '254796': 'safaricom',
    '254797': 'safaricom',
    '254798': 'safaricom',
    '254799': 'safaricom',
    '254730': 'airtel',
    '254731': 'airtel',
    '254732': 'airtel',
    '254733': 'airtel',
    '254734': 'airtel',
    '254735': 'airtel',
    '254736': 'airtel',
    '254737': 'airtel',
    '254738': 'airtel',
    '254739': 'airtel',
    '254770': 'airtel',
    '254771': 'airtel',
    '254772': 'airtel',
    '254773': 'airtel',
    '254774': 'airtel',
    '254775': 'airtel',
    '254776': 'airtel',
    '254777': 'airtel',
    '254778': 'airtel',
    '254779': 'airtel',
    '254720': 'telkom',
    '254721': 'telkom',
    '254722': 'telkom',
    '254723': 'telkom',
    '254724': 'telkom',
    '254725': 'telkom',
    '254726': 'telkom',
    '254727': 'telkom',
    '254728': 'telkom',
    '254729': 'telkom',
  };

  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  const prefix = cleanNumber.substring(0, 6);
  const providerId = prefixes[prefix as keyof typeof prefixes];
  
  return providerId ? AIRTIME_PROVIDERS.find(p => p.id === providerId) || null : null;
};

export const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; error?: string } => {
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  
  if (cleanNumber.length < 12 || cleanNumber.length > 13) {
    return { isValid: false, error: 'Phone number must be 12-13 digits long' };
  }
  
  if (!cleanNumber.startsWith('254')) {
    return { isValid: false, error: 'Phone number must start with 254' };
  }
  
  return { isValid: true };
};

// Transaction processing
export const processAirtimePurchase = async (
  userId: string,
  phoneNumber: string,
  productId: string,
  amount: number
): Promise<AirtimeTransaction> => {
  const transactionId = `airtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const transaction: AirtimeTransaction = {
    id: transactionId,
    userId,
    providerId: 'safaricom', // This would be determined by phone number
    phoneNumber,
    productId,
    amount,
    price: amount,
    currency: 'KES',
    status: 'pending',
    transactionId,
    createdAt: new Date()
  };

  // In a real implementation, this would call the provider's API
  console.log('Processing airtime purchase:', transaction);
  
  return transaction;
};

export const processDataBundlePurchase = async (
  userId: string,
  phoneNumber: string,
  bundleId: string,
  price: number
): Promise<AirtimeTransaction> => {
  const transactionId = `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const transaction: AirtimeTransaction = {
    id: transactionId,
    userId,
    providerId: 'safaricom', // This would be determined by phone number
    phoneNumber,
    productId: bundleId,
    amount: price,
    price,
    currency: 'KES',
    status: 'pending',
    transactionId,
    createdAt: new Date()
  };

  // In a real implementation, this would call the provider's API
  console.log('Processing data bundle purchase:', transaction);
  
  return transaction;
};

