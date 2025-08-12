import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  ActionCodeSettings 
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Action code settings for email link authentication
export const actionCodeSettings: ActionCodeSettings = {
  // URL you want to redirect back to. The domain must be in the authorized domains list in the Firebase Console.
  url: `${window.location.protocol}//${window.location.host}/auth/email-link`,
  // This must be true for email link authentication
  handleCodeInApp: true,
  iOS: {
    bundleId: 'com.phantompay.ios'
  },
  android: {
    packageName: 'com.phantompay.android',
    installApp: true,
    minimumVersion: '12'
  },
  // Optional: Add your dynamic link domain if you have one
  // dynamicLinkDomain: 'phantompay.page.link'
};

/**
 * Send sign-in link to user's email
 */
export const sendEmailLink = async (email: string): Promise<void> => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    // Save the email locally so you don't need to ask the user for it again
    // when they open the link on the same device.
    window.localStorage.setItem('emailForSignIn', email);
    
    console.log('Email link sent successfully');
  } catch (error: any) {
    console.error('Error sending email link:', error);
    throw new Error(error.message || 'Failed to send email link');
  }
};

/**
 * Check if the current URL is a sign-in with email link
 */
export const isEmailLinkSignIn = (): boolean => {
  return isSignInWithEmailLink(auth, window.location.href);
};

/**
 * Complete the sign-in process with email link
 */
export const completeEmailLinkSignIn = async (email?: string): Promise<void> => {
  try {
    // Get the email if it wasn't provided
    let userEmail = email;
    
    if (!userEmail) {
      // Try to get email from localStorage
      userEmail = window.localStorage.getItem('emailForSignIn');
      
      if (!userEmail) {
        // If missing, ask user to provide their email
        userEmail = window.prompt('Please provide your email for confirmation');
      }
    }
    
    if (!userEmail) {
      throw new Error('Email is required to complete sign-in');
    }
    
    // Complete the sign-in
    const result = await signInWithEmailLink(auth, userEmail, window.location.href);
    
    // Clear the email from storage
    window.localStorage.removeItem('emailForSignIn');
    
    console.log('Email link sign-in successful:', result.user);
    
    return result;
  } catch (error: any) {
    console.error('Error completing email link sign-in:', error);
    throw new Error(error.message || 'Failed to complete email link sign-in');
  }
};

/**
 * Get stored email for sign-in
 */
export const getStoredEmailForSignIn = (): string | null => {
  return window.localStorage.getItem('emailForSignIn');
};

/**
 * Clear stored email for sign-in
 */
export const clearStoredEmailForSignIn = (): void => {
  window.localStorage.removeItem('emailForSignIn');
};