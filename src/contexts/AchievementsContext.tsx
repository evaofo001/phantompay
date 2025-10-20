import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { 
  getUserDocument,
  updateUserDocument
} from '../utils/firestoreHelpers';
import toast from 'react-hot-toast';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  completed: boolean;
  completedAt?: Date;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardPoints: number;
  endDate: Date;
  completed: boolean;
}

interface AchievementsContextType {
  achievements: Achievement[];
  challenges: Challenge[];
  completeAchievement: (achievementId: string) => Promise<void>;
  updateChallengeProgress: (challengeId: string, progress: number) => Promise<void>;
  loading: boolean;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addRewardPoints } = useWallet();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize achievements and challenges
  useEffect(() => {
    if (!currentUser) {
      setAchievements([]);
      setChallenges([]);
      return;
    }

    const initializeAchievements = async () => {
      setLoading(true);
      try {
        // Default achievements
        const defaultAchievements: Achievement[] = [
          {
            id: 'first_transaction',
            title: 'First Transaction',
            description: 'Complete your first transaction',
            icon: '💸',
            points: 100,
            completed: false
          },
          {
            id: 'save_1000',
            title: 'Saver',
            description: 'Save KES 1,000 in your savings account',
            icon: '💰',
            points: 200,
            completed: false
          },
          {
            id: 'refer_friend',
            title: 'Connector',
            description: 'Refer your first friend',
            icon: '👥',
            points: 150,
            completed: false
          },
          {
            id: 'weekly_streak',
            title: 'Consistent User',
            description: 'Use PhantomPay for 7 consecutive days',
            icon: '🔥',
            points: 300,
            completed: false
          },
          {
            id: 'premium_user',
            title: 'Premium Member',
            description: 'Upgrade to Premium membership',
            icon: '👑',
            points: 500,
            completed: false
          }
        ];

        // Default challenges
        const defaultChallenges: Challenge[] = [
          {
            id: 'transaction_challenge',
            title: 'Transaction Master',
            description: 'Complete 10 transactions this month',
            target: 10,
            progress: 0,
            rewardPoints: 250,
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            completed: false
          },
          {
            id: 'savings_challenge',
            title: 'Savings Champion',
            description: 'Save KES 5,000 this month',
            target: 5000,
            progress: 0,
            rewardPoints: 400,
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            completed: false
          }
        ];

        // Get user's achievements and challenges from database
        const userDoc = await getUserDocument(currentUser.uid);
        if (userDoc && userDoc.achievements) {
          setAchievements(userDoc.achievements);
        } else {
          setAchievements(defaultAchievements);
        }

        if (userDoc && userDoc.challenges) {
          setChallenges(userDoc.challenges);
        } else {
          setChallenges(defaultChallenges);
        }
      } catch (error) {
        console.error('Error initializing achievements:', error);
        toast.error('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };

    initializeAchievements();
  }, [currentUser]);

  const completeAchievement = async (achievementId: string) => {
    if (!currentUser) return;
    
    try {
      const achievement = achievements.find((a: Achievement) => a.id === achievementId);
      if (!achievement || achievement.completed) return;

      // Update achievement status
      const updatedAchievements = achievements.map((a: Achievement) => 
        a.id === achievementId ? { ...a, completed: true, completedAt: new Date() } : a
      );
      
      setAchievements(updatedAchievements);
      
      // Add reward points
      await addRewardPoints(achievement.points, `achievement: ${achievement.title}`);
      
      // Update user document
      await updateUserDocument(currentUser.uid, { achievements: updatedAchievements });
      
      toast.success(`Achievement unlocked! ${achievement.points} points added.`);
    } catch (error) {
      console.error('Error completing achievement:', error);
      toast.error('Failed to complete achievement');
    }
  };

  const updateChallengeProgress = async (challengeId: string, progress: number) => {
    if (!currentUser) return;
    
    try {
      const challenge = challenges.find((c: Challenge) => c.id === challengeId);
      if (!challenge || challenge.completed) return;

      // Update challenge progress
      const updatedChallenges = challenges.map((c: Challenge) => 
        c.id === challengeId ? { ...c, progress } : c
      );
      
      setChallenges(updatedChallenges);
      
      // Check if challenge is completed
      if (progress >= challenge.target) {
        const completedChallenges = updatedChallenges.map((c: Challenge) => 
          c.id === challengeId ? { ...c, completed: true } : c
        );
        
        setChallenges(completedChallenges);
        
        // Add reward points
        await addRewardPoints(challenge.rewardPoints, `challenge: ${challenge.title}`);
        
        toast.success(`Challenge completed! ${challenge.rewardPoints} points added.`);
      }
      
      // Update user document
      await updateUserDocument(currentUser.uid, { challenges: updatedChallenges });
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      toast.error('Failed to update challenge progress');
    }
  };

  const value = {
    achievements,
    challenges,
    completeAchievement,
    updateChallengeProgress,
    loading
  };

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
};