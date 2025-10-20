export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate to KES
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 1 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.0067 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.0061 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.0053 }
];

export const formatCurrency = (amount: number, currencyCode: string = 'KES'): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'KES' ? 0 : 2
  }).format(amount);
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const fromRate = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1;
  const toRate = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)?.rate || 1;
  
  // Convert to KES first, then to target currency
  const kesAmount = amount / fromRate;
  return kesAmount * toRate;
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)?.symbol || 'KSh';
};