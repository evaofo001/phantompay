import CryptoJS from 'crypto-js';

// Encryption key - in production, this should be from environment variables
const ENCRYPTION_KEY = 'phantompay-secret-key-2024';

export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return data;
  }
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData;
  }
};

// Fraud detection patterns
export interface FraudPattern {
  type: 'velocity' | 'amount' | 'location' | 'behavior';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const detectSuspiciousActivity = (
  userId: string,
  transactionAmount: number,
  transactionType: string,
  recentTransactions: any[]
): FraudPattern[] => {
  const patterns: FraudPattern[] = [];

  // Velocity check - too many transactions in short time
  const recentCount = recentTransactions.filter(t => 
    Date.now() - new Date(t.timestamp).getTime() < 60 * 60 * 1000 // Last hour
  ).length;

  if (recentCount > 10) {
    patterns.push({
      type: 'velocity',
      description: `${recentCount} transactions in the last hour`,
      severity: 'high'
    });
  } else if (recentCount > 5) {
    patterns.push({
      type: 'velocity',
      description: `${recentCount} transactions in the last hour`,
      severity: 'medium'
    });
  }

  // Amount check - unusually large transaction
  const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
  if (transactionAmount > avgAmount * 5 && transactionAmount > 50000) {
    patterns.push({
      type: 'amount',
      description: `Transaction amount (${transactionAmount}) is ${Math.round(transactionAmount / avgAmount)}x larger than average`,
      severity: 'high'
    });
  }

  // Behavior check - unusual transaction pattern
  const nightTransactions = recentTransactions.filter(t => {
    const hour = new Date(t.timestamp).getHours();
    return hour >= 23 || hour <= 5;
  }).length;

  if (nightTransactions > 3) {
    patterns.push({
      type: 'behavior',
      description: `${nightTransactions} transactions during night hours`,
      severity: 'medium'
    });
  }

  return patterns;
};

export const generateSecurityAuditLog = (
  userId: string,
  action: string,
  details: any,
  ipAddress?: string
) => {
  const auditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    details,
    ipAddress: ipAddress || 'unknown',
    timestamp: new Date(),
    userAgent: navigator.userAgent
  };

  // Store in localStorage (in production, send to secure backend)
  const existingLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
  existingLogs.push(auditEntry);
  
  // Keep only last 1000 entries
  if (existingLogs.length > 1000) {
    existingLogs.splice(0, existingLogs.length - 1000);
  }
  
  localStorage.setItem('security_audit_logs', JSON.stringify(existingLogs));
  
  return auditEntry;
};

export const getSecurityAuditLogs = (userId?: string): any[] => {
  const logs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
  
  if (userId) {
    return logs.filter((log: any) => log.userId === userId);
  }
  
  return logs;
};

// Hash sensitive data
export const hashSensitiveData = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

// Validate transaction integrity
export const validateTransactionIntegrity = (transaction: any): boolean => {
  const requiredFields = ['id', 'amount', 'type', 'timestamp', 'uid'];
  
  for (const field of requiredFields) {
    if (!transaction[field]) {
      return false;
    }
  }

  // Check amount is positive
  if (transaction.amount <= 0) {
    return false;
  }

  // Check timestamp is reasonable (not in future, not too old)
  const now = Date.now();
  const transactionTime = new Date(transaction.timestamp).getTime();
  
  if (transactionTime > now || transactionTime < now - 24 * 60 * 60 * 1000) {
    return false;
  }

  return true;
};