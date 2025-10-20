import {
  auth,
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
} from '../config/firebase';
import type { User, ConfirmationResult } from 'firebase/auth';

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/login',
      handleCodeInApp: false,
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

export const resetPassword = async (oobCode: string, newPassword: string): Promise<void> => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset password');
  }
};

export const verifyResetCode = async (oobCode: string): Promise<string> => {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return email;
  } catch (error: any) {
    throw new Error(error.message || 'Invalid or expired reset code');
  }
};

export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user, {
      url: window.location.origin + '/dashboard',
      handleCodeInApp: true,
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send verification email');
  }
};

export const verifyEmail = async (oobCode: string): Promise<void> => {
  try {
    await applyActionCode(auth, oobCode);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to verify email');
  }
};

export const checkEmailActionCode = async (oobCode: string) => {
  try {
    const info = await checkActionCode(auth, oobCode);
    return info;
  } catch (error: any) {
    throw new Error(error.message || 'Invalid action code');
  }
};

export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    },
  });
  return recaptchaVerifier;
};

export const sendPhoneOTP = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send OTP');
  }
};

export const verifyPhoneOTP = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> => {
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error: any) {
    throw new Error(error.message || 'Invalid OTP code');
  }
};

export const linkPhoneNumber = async (
  user: User,
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<void> => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    const verificationCode = window.prompt('Enter verification code:');
    if (!verificationCode) throw new Error('Verification code required');

    const credential = PhoneAuthProvider.credential(
      confirmationResult.verificationId,
      verificationCode
    );

    await linkWithCredential(user, credential);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to link phone number');
  }
};

export const changePassword = async (
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    if (!user.email) throw new Error('User email not found');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to change password');
  }
};

export const changeEmail = async (
  user: User,
  newEmail: string,
  password: string
): Promise<void> => {
  try {
    if (!user.email) throw new Error('User email not found');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await updateEmail(user, newEmail);
    await sendEmailVerification(user);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to change email');
  }
};

export const sendSignInLink = async (email: string): Promise<void> => {
  try {
    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send sign-in link');
  }
};

export const completeSignInWithEmailLink = async (
  email?: string
): Promise<User> => {
  try {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      throw new Error('Invalid sign-in link');
    }

    let userEmail = email;
    if (!userEmail) {
      userEmail = window.localStorage.getItem('emailForSignIn');
      if (!userEmail) {
        userEmail = window.prompt('Please provide your email for confirmation');
      }
    }

    if (!userEmail) throw new Error('Email is required');

    const result = await signInWithEmailLink(auth, userEmail, window.location.href);
    window.localStorage.removeItem('emailForSignIn');

    return result.user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to complete sign-in');
  }
};

export const reauthenticateUser = async (
  user: User,
  password: string
): Promise<void> => {
  try {
    if (!user.email) throw new Error('User email not found');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reauthenticate');
  }
};
