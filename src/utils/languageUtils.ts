export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' }
];

export interface Translations {
  [key: string]: {
    [languageCode: string]: string;
  };
}

export const translations: Translations = {
  // Common
  'welcome': {
    'en': 'Welcome',
    'sw': 'Karibu'
  },
  'balance': {
    'en': 'Balance',
    'sw': 'Salio'
  },
  'send_money': {
    'en': 'Send Money',
    'sw': 'Tuma Pesa'
  },
  'withdraw': {
    'en': 'Withdraw',
    'sw': 'Toa Pesa'
  },
  'savings': {
    'en': 'Savings',
    'sw': 'Akiba'
  },
  'loans': {
    'en': 'Loans',
    'sw': 'Mikopo'
  },
  'transactions': {
    'en': 'Transactions',
    'sw': 'Miamala'
  },
  'settings': {
    'en': 'Settings',
    'sw': 'Mipangilio'
  },
  'login': {
    'en': 'Login',
    'sw': 'Ingia'
  },
  'register': {
    'en': 'Register',
    'sw': 'Jisajili'
  },
  'amount': {
    'en': 'Amount',
    'sw': 'Kiasi'
  },
  'recipient': {
    'en': 'Recipient',
    'sw': 'Mpokeaji'
  },
  'description': {
    'en': 'Description',
    'sw': 'Maelezo'
  },
  'confirm': {
    'en': 'Confirm',
    'sw': 'Thibitisha'
  },
  'cancel': {
    'en': 'Cancel',
    'sw': 'Ghairi'
  },
  'success': {
    'en': 'Success',
    'sw': 'Mafanikio'
  },
  'error': {
    'en': 'Error',
    'sw': 'Hitilafu'
  },
  'loading': {
    'en': 'Loading...',
    'sw': 'Inapakia...'
  }
};

export const translate = (key: string, language: string = 'en'): string => {
  return translations[key]?.[language] || translations[key]?.['en'] || key;
};

export const getCurrentLanguage = (): string => {
  return localStorage.getItem('phantompay_language') || 'en';
};

export const setCurrentLanguage = (languageCode: string): void => {
  localStorage.setItem('phantompay_language', languageCode);
};