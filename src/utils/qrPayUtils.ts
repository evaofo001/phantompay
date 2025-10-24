// QR Pay Utilities for Dynamic QR Code Generation and Processing

export interface QRPaymentData {
  type: 'phantompay_payment';
  recipient: string;
  amount?: number;
  description?: string;
  timestamp: number;
  transactionId?: string;
  currency: string;
  merchantInfo?: {
    name?: string;
    location?: string;
    category?: string;
  };
}

export interface QRScanResult {
  isValid: boolean;
  data?: QRPaymentData;
  error?: string;
}

// Generate dynamic QR payment data
export const generateQRPaymentData = (
  recipient: string,
  amount?: number,
  description?: string,
  merchantInfo?: QRPaymentData['merchantInfo']
): QRPaymentData => {
  return {
    type: 'phantompay_payment',
    recipient,
    amount,
    description: description || 'Payment request',
    timestamp: Date.now(),
    transactionId: generateTransactionId(),
    currency: 'KES',
    merchantInfo
  };
};

// Generate unique transaction ID
const generateTransactionId = (): string => {
  return `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate QR code data
export const validateQRPaymentData = (data: unknown): QRScanResult => {
  try {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid QR code format' };
    }

    if (data.type !== 'phantompay_payment') {
      return { isValid: false, error: 'Not a PhantomPay QR code' };
    }

    if (!data.recipient) {
      return { isValid: false, error: 'Missing recipient information' };
    }

    if (data.amount && (isNaN(data.amount) || data.amount < 0)) {
      return { isValid: false, error: 'Invalid amount' };
    }

    return { isValid: true, data: data as QRPaymentData };
  } catch {
    return { isValid: false, error: 'Failed to parse QR code' };
  }
};

// Create payment link with dynamic parameters
export const createPaymentLink = (qrData: QRPaymentData): string => {
  const baseUrl = process.env.REACT_APP_PAYMENT_BASE_URL || 'https://phantompay.app';
  const encodedData = encodeURIComponent(JSON.stringify(qrData));
  return `${baseUrl}/pay?data=${encodedData}`;
};

// Process scanned QR code
export const processScannedQR = async (qrCodeString: string): Promise<QRScanResult> => {
  try {
    const data = JSON.parse(qrCodeString);
    const validation = validateQRPaymentData(data);
    
    if (!validation.isValid) {
      return validation;
    }

    // Additional security checks
    if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return { isValid: false, error: 'QR code has expired (24 hours)' };
    }

    return validation;
  } catch {
    return { isValid: false, error: 'Invalid QR code format' };
  }
};

// Generate merchant QR code
export const generateMerchantQR = (
  merchantInfo: {
    name: string;
    location?: string;
    category?: string;
    phone?: string;
  },
  defaultAmount?: number
): QRPaymentData => {
  return generateQRPaymentData(
    merchantInfo.phone || merchantInfo.name,
    defaultAmount,
    `Payment to ${merchantInfo.name}`,
    merchantInfo
  );
};

// QR code expiration utilities
export const isQRCodeExpired = (timestamp: number, expirationHours: number = 24): boolean => {
  return Date.now() - timestamp > expirationHours * 60 * 60 * 1000;
};

export const getQRCodeExpirationTime = (timestamp: number, expirationHours: number = 24): Date => {
  return new Date(timestamp + expirationHours * 60 * 60 * 1000);
};

