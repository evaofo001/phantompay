import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  ActionCodeSettings 
} from 'firebase/auth';
import { auth } from '../config/firebase';

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
    }
  };
};

export const sendEmailLink = async (email: string): Promise<void> => {
  try {
    const actionCodeSettings = getActionCodeSettings();
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    console.log('Email link sent successfully to:', email);
  } catch (error: any) {
    console.error('Error sending email link:', error);
    throw new Error(error.message || 'Failed to send email link');
  }
};

export const isEmailLinkSignIn = (): boolean => {
  return isSignInWithEmailLink(auth, window.location.href);
};

export const completeEmailLinkSignIn = async (email?: string): Promise<void> => {
  try {
    let userEmail = email;
    
    if (!userEmail) {
      userEmail = window.localStorage.getItem('emailForSignIn');
      
      if (!userEmail) {
        userEmail = window.prompt('Please provide your email for confirmation');
      }
    }
    
    if (!userEmail) {
      throw new Error('Email is required to complete sign-in');
    }
    
    const result = await signInWithEmailLink(auth, userEmail, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    
    console.log('Email link sign-in successful:', result.user);
    return result;
  } catch (error: any) {
    console.error('Error completing email link sign-in:', error);
    throw new Error(error.message || 'Failed to complete email link sign-in');
  }
};

export const getStoredEmailForSignIn = (): string | null => {
  return window.localStorage.getItem('emailForSignIn');
};

export const clearStoredEmailForSignIn = (): void => {
  window.localStorage.removeItem('emailForSignIn');
};