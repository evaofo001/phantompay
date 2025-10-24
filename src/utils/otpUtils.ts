import CryptoJS from 'crypto-js';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

export interface OTPData {
  otp: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

export const generateOTP = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

export const storeOTP = (email: string, otp: string): void => {
  const otpData: OTPData = {
    otp,
    email,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0
  };

  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(otpData),
    'phantompay_otp_secret'
  ).toString();

  localStorage.setItem(`otp_${email}`, encrypted);
};

export const verifyOTP = (email: string, inputOTP: string): { success: boolean; message: string } => {
  const storedEncrypted = localStorage.getItem(`otp_${email}`);

  if (!storedEncrypted) {
    return { success: false, message: 'No OTP found. Please request a new one.' };
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(storedEncrypted, 'phantompay_otp_secret').toString(CryptoJS.enc.Utf8);
    const otpData: OTPData = JSON.parse(decrypted);

    if (Date.now() > otpData.expiresAt) {
      clearOTP(email);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (otpData.attempts >= 3) {
      clearOTP(email);
      return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    if (otpData.otp !== inputOTP) {
      otpData.attempts += 1;
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(otpData),
        'phantompay_otp_secret'
      ).toString();
      localStorage.setItem(`otp_${email}`, encrypted);

      return {
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`
      };
    }

    clearOTP(email);
    return { success: true, message: 'OTP verified successfully!' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'Failed to verify OTP. Please try again.' };
  }
};

export const clearOTP = (email: string): void => {
  localStorage.removeItem(`otp_${email}`);
};

export const getOTPExpiryTime = (email: string): number | null => {
  const storedEncrypted = localStorage.getItem(`otp_${email}`);

  if (!storedEncrypted) {
    return null;
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(storedEncrypted, 'phantompay_otp_secret').toString(CryptoJS.enc.Utf8);
    const otpData: OTPData = JSON.parse(decrypted);

    if (Date.now() > otpData.expiresAt) {
      clearOTP(email);
      return null;
    }

    return otpData.expiresAt;
  } catch (error) {
    console.error('Error getting OTP expiry time:', error);
    return null;
  }
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  console.log(`[OTP] Sending OTP ${otp} to ${email}`);

  // In development, we'll use console logging
  // In production, this should integrate with an email service like SendGrid, AWS SES, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log(`
    ====================================
    PhantomPay OTP Verification
    ====================================
    Email: ${email}
    OTP Code: ${otp}
    Valid for: ${OTP_EXPIRY_MINUTES} minutes
    ====================================
    `);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return;
  }

  // Production email sending would go here
  // Example with SendGrid:
  /*
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: 'noreply@phantompay.app',
      subject: 'PhantomPay OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">PhantomPay OTP Verification</h2>
          <p>Your OTP code is: <strong style="font-size: 24px; color: #7c3aed;">${otp}</strong></p>
          <p>This code is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };
    
    await sgMail.send(msg);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
  */
  
  // For now, we'll use a mock email service
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, you would:
  // 1. Set up SendGrid, AWS SES, or another email service
  // 2. Configure SMTP settings
  // 3. Create email templates
  // 4. Handle email delivery status
};
