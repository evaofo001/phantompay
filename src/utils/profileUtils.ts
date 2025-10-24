// Profile Management Utilities for Dynamic User Settings

export interface UserProfile {
  uid: string;
  personalInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    address: string;
    idNumber: string;
    profilePicture?: string;
  };
  preferences: {
    language: string;
    currency: string;
    darkMode: boolean;
    showBalance: boolean;
    notifications: NotificationPreferences;
  };
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    pinEnabled: boolean;
    lastPasswordChange: Date;
  };
  withdrawalMethods: WithdrawalMethod[];
  kycStatus: KYCStatus;
}

export interface WithdrawalMethod {
  id: string;
  type: 'mobile' | 'bank' | 'card';
  name: string;
  details: Record<string, unknown>;
  isDefault: boolean;
  verified: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface NotificationPreferences {
  email: {
    transactions: boolean;
    promotions: boolean;
    security: boolean;
    weeklyReports: boolean;
  };
  push: {
    transactions: boolean;
    promotions: boolean;
    security: boolean;
    achievements: boolean;
  };
  sms: {
    transactions: boolean;
    security: boolean;
  };
}

export interface KYCStatus {
  status: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  submittedAt?: Date;
  verifiedAt?: Date;
  documents: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
    proofOfAddress?: string;
  };
  rejectionReason?: string;
}

// Profile validation functions
export const validatePersonalInfo = (info: UserProfile['personalInfo']): string[] => {
  const errors: string[] = [];

  if (!info.fullName || info.fullName.length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (!info.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    errors.push('Valid email address is required');
  }

  if (!info.phoneNumber || !/^\+?[\d\s-()]+$/.test(info.phoneNumber)) {
    errors.push('Valid phone number is required');
  }

  if (info.dateOfBirth) {
    const birthDate = new Date(info.dateOfBirth);
    const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) {
      errors.push('Must be at least 18 years old');
    }
  }

  return errors;
};

export const validateWithdrawalMethod = (method: Omit<WithdrawalMethod, 'id' | 'createdAt' | 'lastUsed'>): string[] => {
  const errors: string[] = [];

  if (!method.name || method.name.length < 2) {
    errors.push('Method name is required');
  }

  switch (method.type) {
    case 'mobile':
      if (!method.details.phoneNumber || !/^\+?[\d\s-()]+$/.test(method.details.phoneNumber)) {
        errors.push('Valid phone number is required for mobile money');
      }
      if (!method.details.provider) {
        errors.push('Mobile money provider is required');
      }
      break;
    case 'bank':
      if (!method.details.bankName) {
        errors.push('Bank name is required');
      }
      if (!method.details.accountNumber || method.details.accountNumber.length < 5) {
        errors.push('Valid account number is required');
      }
      if (!method.details.accountHolderName) {
        errors.push('Account holder name is required');
      }
      break;
    case 'card':
      if (!method.details.cardNumber || method.details.cardNumber.length < 13) {
        errors.push('Valid card number is required');
      }
      if (!method.details.cardHolderName) {
        errors.push('Card holder name is required');
      }
      if (!method.details.expiryDate) {
        errors.push('Card expiry date is required');
      }
      break;
  }

  return errors;
};

// Profile update functions
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  // This would integrate with Firestore to update user profile
  console.log('Updating user profile:', { uid, updates });
  // Implementation would go here
};

export const addWithdrawalMethod = async (uid: string, method: Omit<WithdrawalMethod, 'id' | 'createdAt' | 'lastUsed'>): Promise<string> => {
  const methodId = `method_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newMethod: WithdrawalMethod = {
    ...method,
    id: methodId,
    createdAt: new Date(),
  };

  // This would integrate with Firestore to add withdrawal method
  console.log('Adding withdrawal method:', { uid, newMethod });
  return methodId;
};

export const removeWithdrawalMethod = async (uid: string, methodId: string): Promise<void> => {
  // This would integrate with Firestore to remove withdrawal method
  console.log('Removing withdrawal method:', { uid, methodId });
};

export const setDefaultWithdrawalMethod = async (uid: string, methodId: string): Promise<void> => {
  // This would integrate with Firestore to set default withdrawal method
  console.log('Setting default withdrawal method:', { uid, methodId });
};

// KYC management functions
export const submitKYCDocument = async (uid: string, documentType: keyof KYCStatus['documents'], file: File): Promise<void> => {
  // This would handle file upload and KYC submission
  console.log('Submitting KYC document:', { uid, documentType, fileName: file.name });
};

export const getKYCStatus = async (): Promise<KYCStatus> => {
  // This would fetch KYC status from Firestore
  return {
    status: 'not_submitted',
    documents: {}
  };
};

// Notification preferences management
export const updateNotificationPreferences = async (uid: string, preferences: Partial<NotificationPreferences>): Promise<void> => {
  // This would update notification preferences in Firestore
  console.log('Updating notification preferences:', { uid, preferences });
};

// Security settings management
export const updateSecuritySettings = async (uid: string, security: Partial<UserProfile['security']>): Promise<void> => {
  // This would update security settings in Firestore
  console.log('Updating security settings:', { uid, security });
};

// Profile picture management
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  // This would handle profile picture upload to Firebase Storage
  const imageUrl = `https://example.com/profile-pictures/${uid}_${Date.now()}.jpg`;
  console.log('Uploading profile picture:', { uid, fileName: file.name, imageUrl });
  return imageUrl;
};

export const deleteProfilePicture = async (uid: string, imageUrl: string): Promise<void> => {
  // This would delete profile picture from Firebase Storage
  console.log('Deleting profile picture:', { uid, imageUrl });
};

// Export default profile template
export const getDefaultProfile = (uid: string, email: string): UserProfile => {
  return {
    uid,
    personalInfo: {
      fullName: '',
      email,
      phoneNumber: '',
      dateOfBirth: '',
      address: '',
      idNumber: '',
    },
    preferences: {
      language: 'en',
      currency: 'KES',
      darkMode: false,
      showBalance: true,
      notifications: {
        email: {
          transactions: true,
          promotions: false,
          security: true,
          weeklyReports: true,
        },
        push: {
          transactions: true,
          promotions: false,
          security: true,
          achievements: true,
        },
        sms: {
          transactions: false,
          security: true,
        },
      },
    },
    security: {
      twoFactorEnabled: false,
      biometricEnabled: false,
      pinEnabled: false,
      lastPasswordChange: new Date(),
    },
    withdrawalMethods: [],
    kycStatus: {
      status: 'not_submitted',
      documents: {},
    },
  };
};

