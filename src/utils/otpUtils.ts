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

  // Try to use SendGrid if API key is available
  const sendGridApiKey = process.env.REACT_APP_SENDGRID_API_KEY;
  
  if (sendGridApiKey && sendGridApiKey !== 'your_sendgrid_api_key_here') {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendGridApiKey);
      
      const msg = {
        to: email,
        from: process.env.REACT_APP_FROM_EMAIL || 'noreply@phantompay.app',
        subject: 'PhantomPay OTP Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💰 PhantomPay</h1>
              <p style="color: white; margin: 10px 0 0; opacity: 0.9;">Digital Wallet</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #7c3aed; margin-top: 0;">🔐 OTP Verification</h2>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Your verification code is:
              </p>
              
              <div style="background: #f8f9ff; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 4px;">${otp}</span>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                ⏰ This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ <strong>Security Notice:</strong> If you didn't request this code, please ignore this email and consider changing your password.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                  This email was sent by PhantomPay Digital Wallet System
                </p>
              </div>
            </div>
          </div>
        `
      };
      
      await sgMail.send(msg);
      console.log(`✅ OTP email sent successfully to ${email}`);
      return;
    } catch (error) {
      console.error('❌ Failed to send OTP email via SendGrid:', error);
      // Fall back to console logging
    }
  }

  // Fallback: Console logging for development or when SendGrid fails
  console.log(`
    ====================================
    📧 PhantomPay OTP Verification
    ====================================
    📧 Email: ${email}
    🔐 OTP Code: ${otp}
    ⏰ Valid for: ${OTP_EXPIRY_MINUTES} minutes
    ====================================
    💡 To enable real email sending:
    1. Get a SendGrid API key
    2. Set REACT_APP_SENDGRID_API_KEY in your .env file
    3. Verify your sender email in SendGrid
    ====================================
  `);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
};
