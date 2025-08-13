interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private rules: Map<string, RateLimitRule> = new Map();

  constructor() {
    // Define rate limiting rules
    this.rules.set('login', { maxRequests: 5, windowMs: 15 * 60 * 1000 }); // 5 attempts per 15 minutes
    this.rules.set('transfer', { maxRequests: 10, windowMs: 60 * 1000 }); // 10 transfers per minute
    this.rules.set('withdrawal', { maxRequests: 5, windowMs: 60 * 1000 }); // 5 withdrawals per minute
    this.rules.set('api_call', { maxRequests: 100, windowMs: 60 * 1000 }); // 100 API calls per minute
    this.rules.set('registration', { maxRequests: 3, windowMs: 60 * 60 * 1000 }); // 3 registrations per hour
  }

  isAllowed(identifier: string, action: string): boolean {
    const rule = this.rules.get(action);
    if (!rule) return true; // No rule defined, allow

    const key = `${identifier}:${action}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + rule.windowMs
      });
      return true;
    }

    if (entry.count >= rule.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);
    return true;
  }

  getRemainingTime(identifier: string, action: string): number {
    const key = `${identifier}:${action}`;
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  getRemainingRequests(identifier: string, action: string): number {
    const rule = this.rules.get(action);
    if (!rule) return Infinity;

    const key = `${identifier}:${action}`;
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return rule.maxRequests;
    }

    return Math.max(0, rule.maxRequests - entry.count);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

export const checkRateLimit = (identifier: string, action: string): { allowed: boolean; remainingTime?: number } => {
  const allowed = rateLimiter.isAllowed(identifier, action);
  
  if (!allowed) {
    const remainingTime = rateLimiter.getRemainingTime(identifier, action);
    return { allowed: false, remainingTime };
  }

  return { allowed: true };
};