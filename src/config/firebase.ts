import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkn2JpgO-0guZ3iovOXIOLGkmjCmqUUGQ",
  authDomain: "phantompay-wallet-e3b73.firebaseapp.com",
  projectId: "phantompay-wallet-e3b73",
  storageBucket: "phantompay-wallet-e3b73.firebasestorage.app",
  messagingSenderId: "61549345000",
  appId: "1:61549345000:web:3bc8bbefc61029c04f715d",
  measurementId: "G-44TSJTJDX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

// Export enableNetwork for use in other components
export { enableNetwork };

// Enable offline persistence and handle connection issues
export const enableFirebaseOffline = async () => {
  try {
    await disableNetwork(db);
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.warn('Firebase offline persistence setup failed:', error);
    return false;
  }
};

// Check if Firebase is connected
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try to enable network to test connection
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.warn('Firebase connection check failed:', error);
    return false;
  }
};

export default app;