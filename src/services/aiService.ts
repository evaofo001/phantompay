import { User, Transaction } from '../types';

export interface AIResponse {
  response: string;
  suggestions: string[];
  confidence: number;
  context: string;
}

export interface FinancialAnalysis {
  spendingPattern: 'conservative' | 'moderate' | 'aggressive';
  riskTolerance: 'low' | 'medium' | 'high';
  financialHealth: 'poor' | 'fair' | 'good' | 'excellent';
  recommendations: string[];
  insights: string[];
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseUrl = process.env.REACT_APP_AI_SERVICE_URL || 'https://api.openai.com/v1';
  }

  /**
   * Generate AI response based on user message and financial context
   */
  async generateResponse(
    message: string,
    user: User,
    transactions: Transaction[],
    context?: any
  ): Promise<AIResponse> {
    try {
      // If no API key, use enhanced local logic
      if (!this.apiKey) {
        return this.generateLocalResponse(message, user, transactions, context);
      }

      // Use OpenAI API for dynamic responses
      const prompt = this.buildPrompt(message, user, transactions, context);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are EVA, an AI financial coach for PhantomPay. Provide personalized, actionable financial advice based on user data. Be encouraging, specific, and practical.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return {
        response: aiResponse,
        suggestions: this.generateSuggestions(message, user),
        confidence: 0.9,
        context: 'ai_generated'
      };

    } catch (error) {
      console.error('AI service error:', error);
      return this.generateLocalResponse(message, user, transactions, context);
    }
  }

  /**
   * Enhanced local response generation with dynamic analysis
   */
  private generateLocalResponse(
    message: string,
    user: User,
    transactions: Transaction[],
    context?: any
  ): AIResponse {
    const lowerMessage = message.toLowerCase();
    const analysis = this.analyzeFinancialData(user, transactions);

    // Dynamic response based on actual user data
    if (lowerMessage.includes('balance') || lowerMessage.includes('money')) {
      return this.generateBalanceResponse(user, analysis);
    }

    if (lowerMessage.includes('savings') || lowerMessage.includes('save')) {
      return this.generateSavingsResponse(user, analysis);
    }

    if (lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return this.generateSpendingResponse(user, transactions, analysis);
    }

    if (lowerMessage.includes('loan') || lowerMessage.includes('borrow')) {
      return this.generateLoanResponse(user, analysis);
    }

    if (lowerMessage.includes('premium') || lowerMessage.includes('upgrade')) {
      return this.generatePremiumResponse(user, analysis);
    }

    if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
      return this.generateGoalResponse(user, analysis);
    }

    // Default dynamic response
    return this.generateDefaultResponse(user, analysis);
  }

  private generateBalanceResponse(user: User, analysis: FinancialAnalysis): AIResponse {
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;
    const total = balance + savings;

    let response = `💰 **Your Financial Overview**\n\n`;
    response += `**Current Balance:** KES ${balance.toLocaleString()}\n`;
    response += `**Savings:** KES ${savings.toLocaleString()}\n`;
    response += `**Total Assets:** KES ${total.toLocaleString()}\n\n`;

    if (balance < 1000) {
      response += `⚠️ **Low Balance Alert**\n`;
      response += `Your balance is quite low. Consider:\n`;
      response += `• Adding funds from your bank account\n`;
      response += `• Reducing unnecessary expenses\n`;
      response += `• Setting up automatic deposits\n\n`;
    } else if (balance > 50000) {
      response += `🎉 **Great Balance!**\n`;
      response += `You have a healthy balance. Consider:\n`;
      response += `• Moving excess funds to savings (${analysis.financialHealth === 'excellent' ? '18%' : '12%'} interest)\n`;
      response += `• Exploring investment opportunities\n`;
      response += `• Setting financial goals\n\n`;
    }

    response += `**Financial Health:** ${analysis.financialHealth.toUpperCase()}\n`;
    response += `**Risk Tolerance:** ${analysis.riskTolerance.toUpperCase()}\n\n`;

    if (analysis.recommendations.length > 0) {
      response += `**My Recommendations:**\n`;
      analysis.recommendations.slice(0, 3).forEach(rec => {
        response += `• ${rec}\n`;
      });
    }

    return {
      response,
      suggestions: [
        'How can I increase my savings?',
        'What are the best investment options?',
        'Should I upgrade to premium?',
        'Help me create a budget'
      ],
      confidence: 0.8,
      context: 'balance_analysis'
    };
  }

  private generateSavingsResponse(user: User, analysis: FinancialAnalysis): AIResponse {
    const savings = user.savingsBalance || 0;
    const premiumTier = user.premiumPlan || 'basic';
    const interestRate = premiumTier === 'vip' ? 18 : premiumTier === 'plus' ? 12 : 6;

    let response = `🏦 **Savings Strategy**\n\n`;

    if (savings === 0) {
      response += `You haven't started saving yet! Here's why you should:\n\n`;
      response += `**Benefits of Saving with PhantomPay:**\n`;
      response += `• Earn ${interestRate}% annual interest (${premiumTier.toUpperCase()} tier)\n`;
      response += `• Compound interest grows your money\n`;
      response += `• Secure and insured savings\n`;
      response += `• Flexible terms (1-12 months)\n\n`;
      response += `**Start Small:**\n`;
      response += `• Begin with KES 500 minimum\n`;
      response += `• Set up automatic monthly deposits\n`;
      response += `• Choose a 3-6 month term initially\n\n`;
    } else {
      response += `**Current Savings:** KES ${savings.toLocaleString()}\n`;
      response += `**Interest Rate:** ${interestRate}% annually\n`;
      response += `**Estimated Annual Interest:** KES ${Math.round(savings * interestRate / 100).toLocaleString()}\n\n`;

      if (premiumTier === 'basic') {
        response += `💡 **Upgrade Tip:**\n`;
        response += `Upgrade to Plus (KES 200/month) to earn 12% interest instead of 6%!\n`;
        response += `That's an extra KES ${Math.round(savings * 0.06).toLocaleString()} per year!\n\n`;
      }
    }

    response += `**Savings Goals:**\n`;
    response += `• Emergency fund: 6 months of expenses\n`;
    response += `• Short-term goals: 1-2 years\n`;
    response += `• Long-term goals: 5+ years\n\n`;

    return {
      response,
      suggestions: [
        'How much should I save monthly?',
        "What's the best savings term?",
        'Should I upgrade for higher interest?',
        'Help me set savings goals'
      ],
      confidence: 0.9,
      context: 'savings_advice'
    };
  }

  private generateSpendingResponse(user: User, transactions: Transaction[], analysis: FinancialAnalysis): AIResponse {
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const totalSpent = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgDaily = totalSpent / 30;

    let response = `📊 **Spending Analysis**\n\n`;
    response += `**Last 30 Days:**\n`;
    response += `• Total Spent: KES ${totalSpent.toLocaleString()}\n`;
    response += `• Daily Average: KES ${Math.round(avgDaily).toLocaleString()}\n`;
    response += `• Transactions: ${recentTransactions.length}\n\n`;

    // Analyze spending categories
    const categories = this.analyzeSpendingCategories(recentTransactions);
    if (categories.length > 0) {
      response += `**Top Spending Categories:**\n`;
      categories.slice(0, 3).forEach(cat => {
        response += `• ${cat.category}: KES ${cat.amount.toLocaleString()} (${cat.percentage}%)\n`;
      });
      response += `\n`;
    }

    response += `**Spending Pattern:** ${analysis.spendingPattern.toUpperCase()}\n\n`;

    if (analysis.spendingPattern === 'aggressive') {
      response += `⚠️ **High Spending Alert**\n`;
      response += `You're spending more than recommended. Consider:\n`;
      response += `• Creating a monthly budget\n`;
      response += `• Tracking daily expenses\n`;
      response += `• Setting spending limits\n`;
      response += `• Using the 50/30/20 rule\n\n`;
    } else if (analysis.spendingPattern === 'conservative') {
      response += `✅ **Great Spending Control**\n`;
      response += `You're managing your expenses well! Consider:\n`;
      response += `• Investing excess funds\n`;
      response += `• Building emergency savings\n`;
      response += `• Setting financial goals\n\n`;
    }

    return {
      response,
      suggestions: [
        'Help me create a budget',
        'How can I reduce expenses?',
        "What's the 50/30/20 rule?",
        'Show me spending trends'
      ],
      confidence: 0.85,
      context: 'spending_analysis'
    };
  }

  private generateLoanResponse(user: User, analysis: FinancialAnalysis): AIResponse {
    const savings = user.savingsBalance || 0;
    const premiumTier = user.premiumPlan || 'basic';
    const interestRate = premiumTier === 'vip' ? 15 : premiumTier === 'plus' ? 18 : 20;

    let response = `🎯 **Loan Information**\n\n`;

    if (savings === 0) {
      response += `**Loan Eligibility:** Not Available\n\n`;
      response += `To qualify for loans, you need:\n`;
      response += `• Active savings account with minimum KES 500\n`;
      response += `• No existing active loans\n`;
      response += `• Good transaction history\n\n`;
      response += `**Start Saving:**\n`;
      response += `• Open a savings account today\n`;
      response += `• Build your savings balance\n`;
      response += `• Unlock loan access\n\n`;
    } else {
      const maxLoan = Math.floor((savings - 1) / (1 + interestRate * 0.5 / 100));
      
      response += `**Loan Eligibility:** Available\n`;
      response += `**Maximum Loan:** KES ${maxLoan.toLocaleString()}\n`;
      response += `**Interest Rate:** ${interestRate}% (6 months)\n`;
      response += `**Secured By:** Your savings (KES ${savings.toLocaleString()})\n\n`;

      if (maxLoan > 0) {
        response += `**Loan Benefits:**\n`;
        response += `• No credit checks required\n`;
        response += `• Low interest rates\n`;
        response += `• Flexible repayment\n`;
        response += `• Auto-deduction available\n\n`;

        if (premiumTier === 'basic') {
          response += `💡 **Upgrade Tip:**\n`;
          response += `Upgrade to Plus for 18% interest or VIP for 15%!\n\n`;
        }
      }
    }

    return {
      response,
      suggestions: [
        'How do I apply for a loan?',
        'What are the loan terms?',
        'How is interest calculated?',
        'Can I repay early?'
      ],
      confidence: 0.9,
      context: 'loan_info'
    };
  }

  private generatePremiumResponse(user: User, analysis: FinancialAnalysis): AIResponse {
    const currentTier = user.premiumPlan || 'basic';
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;

    let response = `👑 **Premium Analysis**\n\n`;

    if (currentTier === 'basic') {
      response += `**Current Plan:** Basic (Free)\n\n`;
      response += `**Upgrade Benefits:**\n\n`;
      response += `**Plus (KES 200/month):**\n`;
      response += `• 25% off P2P transfers\n`;
      response += `• 30% off withdrawals\n`;
      response += `• 12% savings interest (vs 6%)\n`;
      response += `• 2% cashback on purchases\n`;
      response += `• 24/7 chat support\n\n`;

      response += `**VIP (KES 500/month):**\n`;
      response += `• 50% off P2P transfers\n`;
      response += `• 60% off withdrawals\n`;
      response += `• 18% savings interest (vs 6%)\n`;
      response += `• 5% cashback on purchases\n`;
      response += `• Free scheduled payments\n`;
      response += `• AI financial coach\n\n`;

      // Calculate ROI
      const monthlyTransactions = 10; // Estimate
      const avgTransaction = 5000;
      const monthlyFees = monthlyTransactions * avgTransaction * 0.01; // 1% average fee
      const plusSavings = monthlyFees * 0.25; // 25% discount
      const vipSavings = monthlyFees * 0.50; // 50% discount

      response += `**ROI Analysis:**\n`;
      response += `• Plus savings: ~KES ${Math.round(plusSavings)}/month\n`;
      response += `• VIP savings: ~KES ${Math.round(vipSavings)}/month\n`;
      response += `• Plus cost: KES 200/month\n`;
      response += `• VIP cost: KES 500/month\n\n`;

      if (balance > 10000 || savings > 5000) {
        response += `💡 **Recommendation:**\n`;
        response += `With your balance (KES ${balance.toLocaleString()}), Plus would be beneficial!\n`;
        response += `You'd save more on fees than the subscription cost.\n\n`;
      }
    } else {
      response += `**Current Plan:** ${currentTier.toUpperCase()}\n\n`;
      response += `**Your Benefits:**\n`;
      
      if (currentTier === 'plus') {
        response += `• 25% off P2P transfers\n`;
        response += `• 12% savings interest\n`;
        response += `• 2% cashback\n`;
        response += `• 24/7 support\n\n`;
        response += `**Consider VIP:**\n`;
        response += `• Double your savings interest (18%)\n`;
        response += `• Double your fee discounts (50%)\n`;
        response += `• Get AI financial coach\n\n`;
      } else if (currentTier === 'vip') {
        response += `• 50% off P2P transfers\n`;
        response += `• 18% savings interest\n`;
        response += `• 5% cashback\n`;
        response += `• AI financial coach\n`;
        response += `• Free scheduled payments\n\n`;
        response += `🎉 **You're getting maximum value!**\n\n`;
      }
    }

    return {
      response,
      suggestions: [
        'How do I upgrade?',
        'What are the exact savings?',
        'Can I downgrade anytime?',
        'Show me feature comparison'
      ],
      confidence: 0.9,
      context: 'premium_analysis'
    };
  }

  private generateGoalResponse(user: User, analysis: FinancialAnalysis): AIResponse {
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;
    const total = balance + savings;

    let response = `🎯 **Financial Goals**\n\n`;

    response += `**SMART Goals Framework:**\n`;
    response += `• **Specific:** Clear target amount and purpose\n`;
    response += `• **Measurable:** Track progress regularly\n`;
    response += `• **Achievable:** Realistic based on income\n`;
    response += `• **Relevant:** Aligned with your priorities\n`;
    response += `• **Time-bound:** Set deadlines\n\n`;

    response += `**Popular Goals:**\n`;
    response += `• Emergency fund: 6 months expenses\n`;
    response += `• House down payment: 20% of property value\n`;
    response += `• Vacation fund: Set amount by specific date\n`;
    response += `• Retirement: Start early for compound growth\n\n`;

    // Personalized recommendations
    if (total < 10000) {
      response += `**For You (KES ${total.toLocaleString()} total):**\n`;
      response += `• Start with emergency fund: KES 5,000\n`;
      response += `• Save KES 500-1,000 monthly\n`;
      response += `• Use 3-month savings term\n\n`;
    } else if (total < 100000) {
      response += `**For You (KES ${total.toLocaleString()} total):**\n`;
      response += `• Build emergency fund: KES 20,000\n`;
      response += `• Start house savings: KES 50,000\n`;
      response += `• Consider 6-month savings terms\n\n`;
    } else {
      response += `**For You (KES ${total.toLocaleString()} total):**\n`;
      response += `• Emergency fund: KES 50,000+\n`;
      response += `• Investment portfolio: KES 100,000+\n`;
      response += `• Long-term savings: 12-month terms\n\n`;
    }

    response += `**Action Steps:**\n`;
    response += `1. Choose your top 3 financial goals\n`;
    response += `2. Calculate required monthly savings\n`;
    response += `3. Set up automatic transfers\n`;
    response += `4. Review progress monthly\n\n`;

    return {
      response,
      suggestions: [
        'Help me set emergency fund goal',
        'Calculate house down payment',
        'Create vacation savings plan',
        'Set up automatic savings'
      ],
      confidence: 0.85,
      context: 'goal_setting'
    };
  }

  private generateDefaultResponse(user: User, analysis: FinancialAnalysis): AIResponse {
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;
    const premiumTier = user.premiumPlan || 'basic';

    let response = `🤖 **Hello! I'm EVA, your AI financial coach.**\n\n`;
    response += `I can help you with:\n\n`;

    response += `💰 **Budgeting & Spending**\n`;
    response += `• Analyze your transaction patterns\n`;
    response += `• Create personalized budgets\n`;
    response += `• Track expenses and set limits\n\n`;

    response += `🏦 **Savings & Investments**\n`;
    response += `• Savings strategies and goals\n`;
    response += `• Interest rate optimization\n`;
    response += `• Investment guidance\n\n`;

    response += `🎯 **Loans & Credit**\n`;
    response += `• Loan calculations and advice\n`;
    response += `• Repayment strategies\n`;
    response += `• Credit building tips\n\n`;

    if (premiumTier === 'vip') {
      response += `👑 **Premium Features**\n`;
      response += `• Advanced financial analysis\n`;
      response += `• Personalized investment advice\n`;
      response += `• Market insights and trends\n\n`;
    } else {
      response += `👑 **Premium Features**\n`;
      response += `• Tier comparison and ROI analysis\n`;
      response += `• Feature recommendations\n`;
      response += `• Upgrade benefits\n\n`;
    }

    response += `**Your Current Status:**\n`;
    response += `• Balance: KES ${balance.toLocaleString()}\n`;
    response += `• Savings: KES ${savings.toLocaleString()}\n`;
    response += `• Plan: ${premiumTier.toUpperCase()}\n`;
    response += `• Financial Health: ${analysis.financialHealth.toUpperCase()}\n\n`;

    response += `What specific area would you like help with?`;

    return {
      response,
      suggestions: [
        'Analyze my spending patterns',
        'Help me create a savings plan',
        'What are my investment options?',
        premiumTier === 'basic' ? 'Should I upgrade to premium?' : 'Show me advanced features'
      ],
      confidence: 0.8,
      context: 'general_help'
    };
  }

  private analyzeFinancialData(user: User, transactions: Transaction[]): FinancialAnalysis {
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;
    const total = balance + savings;

    // Analyze spending pattern
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );
    const totalSpent = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgDaily = totalSpent / 30;

    let spendingPattern: 'conservative' | 'moderate' | 'aggressive';
    if (avgDaily < 500) spendingPattern = 'conservative';
    else if (avgDaily < 2000) spendingPattern = 'moderate';
    else spendingPattern = 'aggressive';

    // Determine risk tolerance
    let riskTolerance: 'low' | 'medium' | 'high';
    if (savings > total * 0.5) riskTolerance = 'low';
    else if (savings > total * 0.2) riskTolerance = 'medium';
    else riskTolerance = 'high';

    // Calculate financial health
    let financialHealth: 'poor' | 'fair' | 'good' | 'excellent';
    if (total < 5000) financialHealth = 'poor';
    else if (total < 20000) financialHealth = 'fair';
    else if (total < 100000) financialHealth = 'good';
    else financialHealth = 'excellent';

    // Generate recommendations
    const recommendations: string[] = [];
    if (balance < 1000) recommendations.push('Add funds to your wallet');
    if (savings === 0) recommendations.push('Start a savings account');
    if (user.premiumPlan === 'basic' && total > 10000) recommendations.push('Consider upgrading to Plus');
    if (spendingPattern === 'aggressive') recommendations.push('Create a monthly budget');
    if (savings < total * 0.1) recommendations.push('Increase your savings rate');

    // Generate insights
    const insights: string[] = [];
    if (total > 50000) insights.push('You have strong financial foundation');
    if (recentTransactions.length > 20) insights.push('You make frequent transactions');
    if (user.premiumStatus) insights.push('You value premium features');

    return {
      spendingPattern,
      riskTolerance,
      financialHealth,
      recommendations,
      insights
    };
  }

  private analyzeSpendingCategories(transactions: Transaction[]) {
    const categories: { [key: string]: number } = {};
    
    transactions.forEach(t => {
      const description = t.description.toLowerCase();
      let category = 'other';
      
      if (description.includes('food') || description.includes('restaurant')) {
        category = 'food';
      } else if (description.includes('transport') || description.includes('uber')) {
        category = 'transport';
      } else if (description.includes('bill') || description.includes('utility')) {
        category = 'utilities';
      }
      
      categories[category] = (categories[category] || 0) + (t.amount || 0);
    });

    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / total) * 100)
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private buildPrompt(message: string, user: User, transactions: Transaction[], context?: any): string {
    const recentTransactions = transactions.slice(0, 10);
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;
    const premiumTier = user.premiumPlan || 'basic';

    return `
User Message: "${message}"

User Financial Data:
- Balance: KES ${balance.toLocaleString()}
- Savings: KES ${savings.toLocaleString()}
- Premium Tier: ${premiumTier}
- Recent Transactions: ${recentTransactions.length}

Recent Transactions:
${recentTransactions.map(t => `- ${t.type}: KES ${t.amount} (${t.description})`).join('\n')}

Context: ${JSON.stringify(context || {})}

Please provide personalized financial advice based on this data. Be specific, actionable, and encouraging.
    `.trim();
  }

  private generateSuggestions(message: string, user: User): string[] {
    const lowerMessage = message.toLowerCase();
    const balance = user.walletBalance || 0;
    const savings = user.savingsBalance || 0;
    const premiumTier = user.premiumPlan || 'basic';

    if (lowerMessage.includes('balance')) {
      return [
        'How can I increase my balance?',
        'What should I do with excess funds?',
        'Help me create a budget'
      ];
    }

    if (lowerMessage.includes('savings')) {
      return [
        'What\'s the best savings strategy?',
        'How much should I save monthly?',
        'Should I upgrade for higher interest?'
      ];
    }

    if (lowerMessage.includes('spending')) {
      return [
        'Help me reduce expenses',
        'Create a spending plan',
        'Show me spending trends'
      ];
    }

    if (lowerMessage.includes('loan')) {
      return [
        'How do I qualify for loans?',
        'What are the loan terms?',
        'Calculate loan payments'
      ];
    }

    if (lowerMessage.includes('premium')) {
      return [
        'Show me upgrade benefits',
        'Calculate ROI of premium',
        'Compare all plans'
      ];
    }

    // Default suggestions based on user status
    if (balance < 1000) {
      return [
        'How can I add funds?',
        'Help me create a budget',
        'What are the best savings options?'
      ];
    }

    if (savings === 0) {
      return [
        'Start my first savings account',
        'How much should I save?',
        'What are savings benefits?'
      ];
    }

    if (premiumTier === 'basic') {
      return [
        'Should I upgrade to Plus?',
        'What are premium benefits?',
        'Calculate upgrade savings'
      ];
    }

    return [
      'Analyze my financial health',
      'Help me set financial goals',
      'Show me investment options',
      'Create a financial plan'
    ];
  }
}

export const aiService = new AIService();
