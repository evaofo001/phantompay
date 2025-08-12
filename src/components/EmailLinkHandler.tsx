import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStoredEmailForSignIn } from '../utils/emailLinkAuth';
import toast from 'react-hot-toast';

const EmailLinkHandler: React.FC = () => {
  const { completeEmailSignIn, isEmailLinkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isEmailLinkAuth()) {
        try {
          const storedEmail = getStoredEmailForSignIn();
          
          if (storedEmail) {
            await completeEmailSignIn(storedEmail);
            toast.success('Successfully signed in! 🎉');
            navigate('/', { replace: true });
          } else {
            // Redirect to login page to collect email
            navigate('/login?mode=emailLink', { replace: true });
          }
        } catch (error: any) {
          console.error('Email link sign-in error:', error);
          toast.error('Failed to complete sign-in. Please try again.');
          navigate('/login', { replace: true });
        }
      }
    };

    handleEmailLinkSignIn();
  }, [completeEmailSignIn, isEmailLinkAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Completing Sign-in...</h2>
        <p className="text-purple-200">Please wait while we verify your email link.</p>
      </div>
    </div>
  );
};

export default EmailLinkHandler;