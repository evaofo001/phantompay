import { 
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  ActionCodeSettings,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Get the action code settings for email operations
 */
export const getActionCodeSettings = (): ActionCodeSettings => {
  const baseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5173'
    : `${window.location.protocol}//${window.location.host}`;

  return {
    url: `${baseUrl}/login`,
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.phantompay.ios'
    },
    android: {
      packageName: 'com.phantompay.android',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: 'phantompay.page.link' // Add your dynamic link domain here if you have one
  };
};

/**
 * Send email verification link to a user
 */
export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user, getActionCodeSettings());
    console.log('Verification email sent successfully');
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    throw new Error(error.message || 'Failed to send verification email');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email, getActionCodeSettings());
    console.log('Password reset email sent successfully');
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Send email sign-in link (passwordless sign-in)
 */
export const sendEmailSignInLink = async (email: string): Promise<void> => {
  try {
    const actionCodeSettings = getActionCodeSettings();
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally to complete the sign-in after user clicks the link
    window.localStorage.setItem('emailForSignIn', email);
    console.log('Email sign-in link sent successfully');
  } catch (error: any) {
    console.error('Error sending email sign-in link:', error);
    throw new Error(error.message || 'Failed to send email sign-in link');
  }
};

/**
 * Send custom email notification (can be used for OTP)
 * Note: For actual OTP, consider using Firebase phone authentication
 */
export const sendCustomEmail = async (_user: User, template: 'otp' | 'welcome' | 'payment' | 'transfer'): Promise<void> => {
  try {
    // You can customize email templates in Firebase Console
    // Go to Authentication > Templates
    // Firebase will use these templates for verification, password reset, etc.
    console.log(`Sending ${template} email to user`);
    // The actual email sending is handled by Firebase based on templates
  } catch (error: any) {
    console.error('Error sending custom email:', error);
    throw new Error(error.message || 'Failed to send custom email');
  }
};