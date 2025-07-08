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
    percent = 0.01;
    fixed = 2;
    cap = 20;
  } else if (amount >= 501 && amount <= 1000) {
    percent = 0.009;
    fixed = 5;
    cap = 40;
  } else if (amount >= 1001 && amount <= 5000) {
    percent = 0.0075;
    fixed = 7;
    cap = 80;
  } else if (amount >= 5001 && amount <= 10000) {
    percent = 0.005;
    fixed = 10;
    cap = 150;
  } else if (amount >= 10001 && amount <= 50000) {
    percent = 0.003;
    fixed = 15;
    cap = 300;
  } else {
    // 50,001+
    percent = 0.002;
    fixed = 20;
    cap = 600;
  }

  let rawFee = (amount * percent) + fixed;
  return Math.min(Math.round(rawFee), cap);
}

// Apply premium tier discounts
export function applyPremiumDiscount(baseFee: number, transactionType: string, premiumTier: string): number {
  const discounts = {
    basic: {
      p2p: 0,
      withdrawal: 0,
      scheduled: 0,
      merchant_qr: 0
    },
    plus: {
      p2p: 0.25,
      withdrawal: 0.30,
      scheduled: 0,
      merchant_qr: 0.25
    },
    vip: {
      p2p: 0.50,
      withdrawal: 0.60,
      scheduled: 1.0, // Free
      merchant_qr: 0.50
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
  airtime: { percent: 0, fixed: 0 },
  data: { percent: 0, fixed: 0 },
  deposit: { percent: 0, fixed: 0 },
  withdrawal: { percent: 0.015, fixed: 20, cap: 250 },
  merchant_qr: (amount: number): FeeRule => {
    const baseFee = Math.min(amount * 0.0075 + 5, 50);
    return { percent: 0, fixed: baseFee };
  },
  scheduled: { percent: 0.005, fixed: 0 }
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

  return {
    percentageFee: Math.round(percentageFee * 100) / 100,
    fixedFee,
    totalFee: Math.round(finalFee * 100) / 100,
    netAmount: Math.round((amount - finalFee) * 100) / 100,
    feeRule,
    premiumDiscount: Math.round(premiumDiscount * 100) / 100
  };
}