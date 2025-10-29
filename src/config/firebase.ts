import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  increment,
  enableNetwork,
  disableNetwork,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

// Import Firebase configuration
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn('Analytics not available:', error);
}
export { analytics };

export const auth = getAuth(app);
auth.useDeviceLanguage();
export const db = getFirestore(app);

// Initialize Google Auth Provider with custom parameters
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline',
    login_hint: 'user@gmail.com'
});

// Export all Firebase functions
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  increment,
  enableNetwork,
  disableNetwork,
  Timestamp,
  serverTimestamp
};

// Network status functions
export const enableFirebaseNetwork = async () => {
  try {
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.error('Failed to enable network:', error);
    return false;
  }
};

export const disableFirebaseNetwork = async () => {
  try {
    await disableNetwork(db);
    return true;
  } catch (error) {
    console.error('Failed to disable network:', error);
    return false;
  }
};

export const checkFirebaseConnection = async () => {
  try {
    // Try to read a small document to test connection
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    return true;
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
};

export default app;