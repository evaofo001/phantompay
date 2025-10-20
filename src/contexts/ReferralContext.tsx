import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { Referral } from '../types';
import { 
  getUserReferrals,
  createReferral,
  updateReferralStatus,
  getUserDocument,
  updateUserDocument
} from '../utils/firestoreHelpers';
import toast from 'react-hot-toast';

// Generate a random referral code
const generateReferralCode = async (): Promise<string> => {
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface ReferralContextType {
  referralCode: string;
  referrals: Referral[];
  generateNewReferralCode: () => Promise<void>;
  createNewReferral: (refereeId: string) => Promise<void>;
  completeReferral: (referralId: string) => Promise<void>;
  loading: boolean;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const useReferral = () => {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
};

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addRewardPoints } = useWallet();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize referral data when authenticated
  useEffect(() => {
    if (!currentUser) {
      setReferralCode('');
      setReferrals([]);
      return;
    }

    const initializeReferralData = async () => {
      setLoading(true);
      try {
        // Generate referral code if user doesn't have one
        let userDoc = await getUserDocument(currentUser.uid);
        if (userDoc && !userDoc.referralCode) {
          const newReferralCode = await generateReferralCode();
          await updateUserDocument(currentUser.uid, { referralCode: newReferralCode });
          setReferralCode(newReferralCode);
        } else if (userDoc) {
          setReferralCode(userDoc.referralCode || '');
        }

        // Set up real-time listener for referrals
        const unsubscribe = getUserReferrals(currentUser.uid, (referralList) => {
          setReferrals(referralList);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error initializing referral data:', error);
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    initializeReferralData();
  }, [currentUser]);

  const generateNewReferralCode = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const newReferralCode = await generateReferralCode();
      await updateUserDocument(currentUser.uid, { referralCode: newReferralCode });
      setReferralCode(newReferralCode);
      toast.success('New referral code generated!');
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast.error('Failed to generate referral code');
    } finally {
      setLoading(false);
    }
  };

  const createNewReferral = async (refereeId: string) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await createReferral({
        referrerId: currentUser.uid,
        refereeId,
        referralCode,
        status: 'pending',
        createdAt: new Date(),
        rewardPointsEarned: 500 // 500 points for successful referral
      });
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error('Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  const completeReferral = async (referralId: string) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Update referral status
      await updateReferralStatus(referralId, 'completed', new Date());
      
      // Add reward points to referrer
      await addRewardPoints(500, 'referral bonus');
      
      // Update user's referral count and earnings
      const userDoc = await getUserDocument(currentUser.uid);
      if (userDoc) {
        await updateUserDocument(currentUser.uid, {
          referralsCount: (userDoc.referralsCount || 0) + 1,
          referralEarnings: (userDoc.referralEarnings || 0) + 500
        });
      }
      
      toast.success('Referral completed! 500 points added to your account.');
    } catch (error) {
      console.error('Error completing referral:', error);
      toast.error('Failed to complete referral');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    referralCode,
    referrals,
    generateNewReferralCode,
    createNewReferral,
    completeReferral,
    loading
  };

  return (
    <ReferralContext.Provider value={value}>
      {children}
    </ReferralContext.Provider>
  );
};