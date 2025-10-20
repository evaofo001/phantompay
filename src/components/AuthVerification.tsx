import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  sendPasswordReset,
  sendVerificationEmail,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
  changePassword,
  changeEmail,
  sendSignInLink
} from '../utils/authHelpers';
import toast from 'react-hot-toast';
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

export const PasswordResetForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordReset(email);
      toast.success('Password reset email sent! Check your inbox.');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      <h3 className="text-lg font-semibold">Reset Password</h3>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
};

export const EmailVerificationButton = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSendVerification = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await sendVerificationEmail(user);
      toast.success('Verification email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.emailVerified) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800 mb-2">
        Your email is not verified. Please verify to access all features.
      </p>
      <button
        onClick={handleSendVerification}
        disabled={loading}
        className="text-sm bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Verification Email'}
      </button>
    </div>
  );
};

export const PhoneOTPForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const verifier = setupRecaptcha('recaptcha-container');
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaVerifier) {
      toast.error('reCAPTCHA not initialized');
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOTP(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      toast.success('OTP sent to your phone!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setLoading(true);
    try {
      await verifyPhoneOTP(confirmationResult, otp);
      toast.success('Phone number verified successfully!');
      setOtp('');
      setPhoneNumber('');
      setConfirmationResult(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Phone Verification</h3>

      <div id="recaptcha-container"></div>

      {!confirmationResult ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}
    </div>
  );
};

export const ChangePasswordForm = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await changePassword(user, currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <h3 className="text-lg font-semibold">Change Password</h3>

      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Current Password"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />

      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New Password"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm New Password"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
};

export const ChangeEmailForm = () => {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await changeEmail(user, newEmail, password);
      toast.success('Email changed! Please verify your new email.');
      setNewEmail('');
      setPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangeEmail} className="space-y-4">
      <h3 className="text-lg font-semibold">Change Email</h3>

      <input
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="New Email"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Current Password"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Changing...' : 'Change Email'}
      </button>
    </form>
  );
};

export const EmailLinkSignIn = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendSignInLink(email);
      toast.success('Sign-in link sent! Check your email.');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSendLink} className="space-y-4">
      <h3 className="text-lg font-semibold">Passwordless Sign In</h3>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Sign-In Link'}
      </button>
    </form>
  );
};
