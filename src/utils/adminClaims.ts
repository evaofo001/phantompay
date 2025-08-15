import { auth } from '../config/firebase';

// Admin email addresses that should have admin claims
const ADMIN_EMAILS = [
  'admin@phantompay.com',
  'superadmin@phantompay.com',
  'revenue@phantompay.com'
];

// Function to check if user should have admin claims
export const shouldHaveAdminClaims = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email);
};

// Function to set admin claims (this would typically be done server-side)
// For development purposes, we'll simulate this client-side
export const setAdminClaims = async (uid: string, email: string): Promise<boolean> => {
  try {
    if (!shouldHaveAdminClaims(email)) {
      return false;
    }

    // In a real application, this would be done via a Cloud Function
    // For now, we'll store admin status in localStorage as a simulation
    localStorage.setItem(`admin_claims_${uid}`, JSON.stringify({
      admin: true,
      email,
      timestamp: Date.now()
    }));

    console.log(`Admin claims set for ${email}`);
    return true;
  } catch (error) {
    console.error('Error setting admin claims:', error);
    return false;
  }
};

// Function to check admin claims
export const checkAdminClaims = (uid: string): boolean => {
  try {
    const claims = localStorage.getItem(`admin_claims_${uid}`);
    if (!claims) return false;

    const parsedClaims = JSON.parse(claims);
    return parsedClaims.admin === true;
  } catch (error) {
    console.error('Error checking admin claims:', error);
    return false;
  }
};

// Function to remove admin claims
export const removeAdminClaims = (uid: string): void => {
  localStorage.removeItem(`admin_claims_${uid}`);
};