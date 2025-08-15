// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup 
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
  connectFirestoreEmulator,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfKPSRvM3Avp0SK7V-uY18rWiUPFxgKEE",
  authDomain: "phantompay-9d30e.firebaseapp.com",
  projectId: "phantompay-9d30e",
  storageBucket: "phantompay-9d30e.firebasestorage.app",
  messagingSenderId: "1090504229256",
  appId: "1:1090504229256:web:222d0cc0a188a5ebad3a3d",
  measurementId: "G-ZSRVYSE4G8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export all Firebase functions
export { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
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