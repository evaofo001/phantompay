// Subscription Processing Service
// Handles premium plan subscriptions, payments, and management

import { Transaction } from '../types/transaction';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface SubscriptionRequest {
  planId: string;
  paymentMethodId: string;
  autoRenew: boolean;
  promoCode?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  status?: 'active' | 'pending' | 'failed' | 'canceled';
  message: string;
  nextBillingDate?: Date;
  amount?: number;
  currency?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  paymentMethod?: string;
}

class SubscriptionService {
  private baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.phantompay.app';
  private apiKey = process.env.REACT_APP_API_KEY || 'mock_api_key';

  // Create a new subscription
  async createSubscription(
    userId: string, 
    request: SubscriptionRequest
  ): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          planId: request.planId,
          paymentMethodId: request.paymentMethodId,
          autoRenew: request.autoRenew,
          promoCode: request.promoCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          subscriptionId: data.subscriptionId,
          status: data.status,
          message: 'Subscription created successfully',
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : undefined,
          amount: data.amount,
          currency: data.currency
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to create subscription'
        };
      }
    } catch (error) {
      console.error('Subscription creation error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Get user's active subscription
  async getActiveSubscription(userId: string): Promise<SubscriptionResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/active/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          subscriptionId: data.subscriptionId,
          status: data.status,
          message: 'Subscription retrieved successfully',
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : undefined,
          amount: data.amount,
          currency: data.currency
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          subscriptionId,
          status: 'canceled',
          message: 'Subscription canceled successfully'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to cancel subscription'
        };
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string, 
    updates: Partial<SubscriptionRequest>
  ): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          subscriptionId,
          status: data.status,
          message: 'Subscription updated successfully',
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : undefined
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to update subscription'
        };
      }
    } catch (error) {
      console.error('Update subscription error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Get payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-methods/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.paymentMethods || [];
      }
      return [];
    } catch (error) {
      console.error('Get payment methods error:', error);
      return [];
    }
  }

  // Add payment method
  async addPaymentMethod(
    userId: string, 
    paymentMethod: Omit<PaymentMethod, 'id'>
  ): Promise<{ success: boolean; paymentMethodId?: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          ...paymentMethod
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          paymentMethodId: data.paymentMethodId,
          message: 'Payment method added successfully'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to add payment method'
        };
      }
    } catch (error) {
      console.error('Add payment method error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Create payment intent for subscription
  async createPaymentIntent(
    planId: string, 
    amount: number, 
    currency: string = 'KES'
  ): Promise<PaymentIntent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          amount,
          currency
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          clientSecret: data.clientSecret,
          paymentMethod: data.paymentMethod
        };
      }
      return null;
    } catch (error) {
      console.error('Create payment intent error:', error);
      return null;
    }
  }

  // Confirm payment
  async confirmPayment(
    paymentIntentId: string, 
    paymentMethodId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-intents/${paymentIntentId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethodId
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Payment confirmed successfully'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Payment confirmation failed'
        };
      }
    } catch (error) {
      console.error('Confirm payment error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/history/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.history || [];
      }
      return [];
    } catch (error) {
      console.error('Get subscription history error:', error);
      return [];
    }
  }

  // Validate promo code
  async validatePromoCode(code: string): Promise<{ valid: boolean; discount?: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          valid: true,
          discount: data.discount,
          message: data.message || 'Promo code applied successfully'
        };
      } else {
        return {
          valid: false,
          message: data.message || 'Invalid promo code'
        };
      }
    } catch (error) {
      console.error('Validate promo code error:', error);
      return {
        valid: false,
        message: 'Network error occurred'
      };
    }
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/analytics/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Get subscription analytics error:', error);
      return null;
    }
  }

  async recordTransaction(transaction: Transaction): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      });

      return response.ok;
    } catch (error) {
      console.error('Record transaction error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
