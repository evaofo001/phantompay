export interface FeeRule {
  percent: number;
  fixed: number;
  cap?: number;
}

export interface FeeTable {
  [key: string]: FeeRule | ((amount: number) => FeeRule);
}

// Updated P2P fee calculation based on your specifications
export function calculateP2PFee(amount: number): number {
  if (amount <= 100) return 0;

  let percent = 0;
  let fixed = 0;
  let cap = 0;

  if (amount >= 101 && amount <= 500) {
    percent = 0.01; // 1%
    fixed = 2;
    cap = 20;
  } else if (amount >= 501 && amount <= 1000) {
    percent = 0.009; // 0.9%
    fixed = 5;
    cap = 40;
  } else if (amount >= 1001 && amount <= 5000) {
    percent = 0.0075; // 0.75%
    fixed = 7;
    cap = 80;
  } else if (amount >= 5001 && amount <= 10000) {
    percent = 0.005; // 0.5%
    fixed = 10;
    cap = 150;
  } else if (amount >= 10001 && amount <= 50000) {
    percent = 0.003; // 0.3%
    fixed = 15;
    cap = 300;
  } else {
    // 50,001+
    percent = 0.002; // 0.2%
    fixed = 20;
    cap = 600;
  }

  const rawFee = (amount * percent) + fixed;
  return Math.min(Math.round(rawFee), cap);
}

// Apply premium tier discounts based on your specifications
export function applyPremiumDiscount(baseFee: number, transactionType: string, premiumTier: string): number {
  const discounts = {
    basic: {
      p2p: 0,
      withdrawal: 0,
      scheduled: 0,
      merchant_qr: 0
    },
    plus: {
      p2p: 0.25, // 25% off P2P transfers
      withdrawal: 0.30, // 30% off withdrawals
      scheduled: 0, // No discount for scheduled payments
      merchant_qr: 0.25 // 25% off merchant QR payments
    },
    vip: {
      p2p: 0.50, // 50% off P2P transfers
      withdrawal: 0.60, // 60% off withdrawals
      scheduled: 1.0, // Free scheduled payments
      merchant_qr: 0.50 // 50% off merchant QR payments
    }
  };

  const discount = discounts[premiumTier as keyof typeof discounts]?.[transactionType as keyof typeof discounts.basic] || 0;
  return Math.round(baseFee * (1 - discount));
}

export const FEE_TABLE: FeeTable = {
  p2p: (amount: number): FeeRule => {
    const fee = calculateP2PFee(amount);
    return { percent: 0, fixed: fee };
  },
  airtime: { percent: 0, fixed: 0 }, // Free
  data: { percent: 0, fixed: 0 }, // Free
  deposit: { percent: 0, fixed: 0 }, // Free
  withdrawal: { percent: 0.015, fixed: 20, cap: 250 }, // 1.5% + KES 20 (capped at KES 250)
  merchant_qr: (amount: number): FeeRule => {
    const baseFee = Math.min(amount * 0.0075 + 5, 50); // 0.75% + KES 5 (capped at KES 50)
    return { percent: 0, fixed: baseFee };
  },
  scheduled: { percent: 0, fixed: 0 } // Free for VIP, regular fee for others
};

export function calculateFee(amount: number, transactionType: string, premiumTier: string = 'basic'): number {
  const rule = FEE_TABLE[transactionType];
  
  if (!rule) {
    return 0;
  }

  const feeRule = typeof rule === 'function' ? rule(amount) : rule;
  let fee = (amount * feeRule.percent) + feeRule.fixed;
  
  if (feeRule.cap && fee > feeRule.cap) {
    fee = feeRule.cap;
  }

  // Apply premium discount
  fee = applyPremiumDiscount(fee, transactionType, premiumTier);

  return Math.round(fee * 100) / 100;
}

export function getFeeBreakdown(amount: number, transactionType: string, premiumTier: string = 'basic') {
  const rule = FEE_TABLE[transactionType];
  
  if (!rule) {
    return {
      percentageFee: 0,
      fixedFee: 0,
      totalFee: 0,
      netAmount: amount,
      totalAmount: amount, // Total amount user pays (amount + fee)
      feeRule: null,
      premiumDiscount: 0
    };
  }

  const feeRule = typeof rule === 'function' ? rule(amount) : rule;
  const percentageFee = amount * feeRule.percent;
  const fixedFee = feeRule.fixed;
  let baseFee = percentageFee + fixedFee;
  
  if (feeRule.cap && baseFee > feeRule.cap) {
    baseFee = feeRule.cap;
  }

  const finalFee = applyPremiumDiscount(baseFee, transactionType, premiumTier);
  const premiumDiscount = baseFee - finalFee;

  // For different transaction types, calculate net amount differently
  let netAmount = amount;
  let totalAmount = amount + finalFee;

  if (transactionType === 'withdrawal') {
    // For withdrawals, user receives amount - fee
    netAmount = amount - finalFee;
    totalAmount = amount; // User pays the full amount, receives net amount
  } else if (transactionType === 'deposit') {
    // For deposits, user pays amount + fee, receives full amount
    netAmount = amount;
    totalAmount = amount + finalFee;
  } else if (transactionType === 'p2p' || transactionType === 'merchant_qr') {
    // For transfers, user pays amount + fee, recipient receives full amount
    netAmount = amount; // Recipient receives this amount
    totalAmount = amount + finalFee; // Sender pays this total
  }

  return {
    percentageFee: Math.round(percentageFee * 100) / 100,
    fixedFee,
    totalFee: Math.round(finalFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    feeRule,
    premiumDiscount: Math.round(premiumDiscount * 100) / 100
  };
}