import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth as firebaseAuth,
  db,
  googleProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  signInWithPhoneNumber, 
  onAuthStateChanged,
  signInWithEmailLink,
  isSignInWithEmailLink,
  updatePassword as firebaseUpdatePassword,
  updateEmail as firebaseUpdateEmail,
  sendEmailVerification as firebaseSendEmailVerification
} from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  sendEmailSignInLink as sendCustomEmailSignInLink
} from '../services/emailService';

// Use real Firebase User type
import type { User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendEmailSignInLink: (email: string) => Promise<void>;
  completeEmailSignIn: (email?: string) => Promise<any>;
  isEmailLinkAuth: () => boolean;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  loginWithPhoneNumber: (phoneNumber: string, appVerifier: any) => Promise<any>;
  confirmPhoneNumberCode: (confirmationResult: any, code: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock authentication for development
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Use Firebase onAuthStateChanged to manage user session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        // User is signed in - use the real Firebase User object
        setCurrentUser(user);
        // Store user data in localStorage for persistence
        localStorage.setItem('phantompay_user', JSON.stringify({ 
          uid: user.uid, 
          email: user.email, 
          displayName: user.displayName,
          emailVerified: user.emailVerified 
        }));
      } else {
        // User is signed out
        setCurrentUser(null);
        localStorage.removeItem('phantompay_user');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error; // Re-throw to be caught by UI
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Use the pre-configured provider from firebase.ts
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      
      if (!result.user) {
        throw new Error('No user data returned from Google sign in');
      }
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        lastLogin: serverTimestamp(),
        provider: 'google'
      }, { merge: true });
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const sendEmailSignInLink = async (email: string) => {
    try {
      await sendCustomEmailSignInLink(email);
    } catch (error) {
      throw error;
    }
  };

  const completeEmailSignIn = async (email?: string) => {
    if (!email && !window.localStorage.getItem('emailForSignIn')) {
      throw new Error('No email found for sign in');
    }
    const emailToUse = email || window.localStorage.getItem('emailForSignIn')!;
    try {
      const result = await signInWithEmailLink(firebaseAuth, emailToUse, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return result;
    } catch (error) {
      throw error;
    }
  };

  const isEmailLinkAuth = (): boolean => {
    return isSignInWithEmailLink(firebaseAuth, window.location.href);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordReset(email);
    } catch (error) {
      throw error;
    }
  };

  const loginWithPhoneNumber = async (phoneNumber: string, appVerifier: any) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (error) {
      throw error;
    }
  };

  const confirmPhoneNumberCode = async (confirmationResult: any, code: string) => {
    try {
      await confirmationResult.confirm(code);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      if (!firebaseAuth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      await firebaseUpdatePassword(firebaseAuth.currentUser, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      if (!firebaseAuth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      await firebaseUpdateEmail(firebaseAuth.currentUser, newEmail);
    } catch (error) {
      throw error;
    }
  };

  const sendEmailVerification = async () => {
    try {
      if (!firebaseAuth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      await firebaseSendEmailVerification(firebaseAuth.currentUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
      // currentUser will be set to null by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };


  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    sendEmailSignInLink,
    completeEmailSignIn,
    isEmailLinkAuth,
    sendPasswordResetEmail: sendPasswordReset,
    loginWithPhoneNumber,
    confirmPhoneNumberCode,
    updatePassword,
    updateEmail,
    sendEmailVerification,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};