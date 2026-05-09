export const EMAIL_JOBS = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  VERIFY_EMAIL: 'verify_email',
} as const;

export interface WelcomeJobData {
  to: string;
  firstName: string;
}

export interface PasswordResetJobData {
  to: string;
  resetLink: string;
}

export interface VerifyEmailJobData {
  to: string;
  verifyCode: string;
  fullName: string;
  clientUrl: string;
}

export type EmailJobData =
  | WelcomeJobData
  | PasswordResetJobData
  | VerifyEmailJobData;
