# PhantomPay Authentication Guide

## Overview

PhantomPay uses a multi-method authentication system with OTP verification for enhanced security.

## Authentication Methods

### 1. Email & Password with OTP Verification

**Sign Up Flow:**
1. User enters email and password
2. OTP is generated and sent to email (displayed in console for development)
3. User enters 6-digit OTP code
4. Account is created after successful OTP verification
5. User is automatically logged in

**Sign In Flow:**
1. User enters email and password
2. OTP is generated and sent to email (displayed in console for development)
3. User enters 6-digit OTP code
4. User is logged in after successful OTP verification

**OTP Details:**
- 6-digit numeric code
- Valid for 10 minutes
- Maximum 3 attempts
- Encrypted and stored in localStorage

### 2. Passwordless Email Link (Magic Link)

1. User enters email address
2. Click "Send Link" button
3. Check email inbox for sign-in link
4. Click link to automatically sign in
5. No password required

### 3. Google Sign-In

1. Click "Sign in with Google" button
2. Select Google account
3. Grant permissions
4. Automatically signed in

### 4. Phone Number Authentication

1. Enter phone number with country code (e.g., +254712345678)
2. Receive SMS verification code
3. Enter 6-digit code
4. Signed in successfully

## Admin Access

**Admin Email:** phantompaywallet@gmail.com

**Admin Routing:**
- Regular users are redirected to `/` (Dashboard)
- Admin users are redirected to `/admin` (Admin Dashboard)

**Admin Configuration:**
Located in `src/config/adminConfig.ts`:
- Admin emails list
- Secret code for admin operations
- Permissions configuration
- Revenue and expense types

## Password Reset

1. Click "Forgot Password?" on login page
2. Enter email address
3. Receive password reset link via email
4. Click link to reset password
5. Enter new password

## Email Verification

**Note:** Firebase email verification is **disabled** in this implementation. Users can immediately access their accounts after registration.

## Security Features

1. **OTP Verification:** Every login and registration requires OTP verification
2. **Rate Limiting:** Maximum 3 OTP attempts per session
3. **Encrypted Storage:** OTP data is encrypted using AES encryption
4. **Time Expiry:** OTPs expire after 10 minutes
5. **Session Management:** Firebase handles secure session management
6. **Protected Routes:** All app routes require authentication

## Development Setup

### OTP Email Sending

**Console Mode (Default):**
- OTP codes are logged to the browser console
- Look for the "PhantomPay OTP Verification" section in console
- Copy the 6-digit code and enter it in the verification form

**Production Mode (SendGrid):**
1. Get a SendGrid API key from https://sendgrid.com
2. Add to `.env` file:
   ```
   REACT_APP_SENDGRID_API_KEY=your_actual_api_key
   REACT_APP_FROM_EMAIL=noreply@yourdomain.com
   ```
3. Verify your sender email in SendGrid
4. OTP emails will be sent automatically

## Testing Authentication

### Test Regular User Flow:
1. Go to `/login`
2. Click "Don't have an account? Sign up"
3. Enter email: `test@example.com`
4. Enter password: `Test123456`
5. Check console for OTP code
6. Enter OTP code
7. Should redirect to `/` (Dashboard)

### Test Admin Flow:
1. Go to `/login`
2. Enter email: `phantompaywallet@gmail.com`
3. Enter password: `admin_password`
4. Check console for OTP code
5. Enter OTP code
6. Should redirect to `/admin` (Admin Dashboard)

## Troubleshooting

### Blank Page After Login
**Fixed:** The app now immediately sets a default user object to prevent blank pages during data loading.

### Admin Can't Access Admin Dashboard
**Fixed:** Admin routing now checks the email and redirects to `/admin` automatically.

### OTP Not Working
1. Check browser console for OTP code
2. Ensure OTP hasn't expired (10 minutes)
3. Try requesting a new OTP
4. Clear browser localStorage if issues persist

### Firebase Deployment Shows Welcome Page
**Fixed:** Firebase hosting now points to the `dist` directory instead of `public`.

## Firebase Configuration

All Firebase configuration is stored in:
- `src/config/firebase.ts` - Firebase initialization
- `src/config/firebaseConfig.ts` - Firebase credentials
- `.env` - Environment variables

## User Data Structure

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  walletBalance: number;
  savingsBalance: number;
  rewardPoints: number;
  totalEarnedInterest: number;
  premiumStatus: boolean;
  premiumPlan: 'basic' | 'pro' | 'vip';
  referralsCount: number;
  referralEarnings: number;
  kycVerified: boolean;
  createdAt: Date;
}
```

## Support

For authentication issues, check:
1. Browser console for errors
2. Firebase console for authentication logs
3. Network tab for API call failures
4. localStorage for stored OTP data
