export const EMAIL_JOBS = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  VERIFY_EMAIL: 'verify_email',
  PASSWORD_UPDATE: 'password_update',
  LINK_EXPIRE: 'link_expire',
  CONTACT_US: 'contact_us',
} as const;

// clientUrl here is the redirect to login
export interface WelcomeJobData {
  to: string;
  firstName: string;
  clientUrl: string;
}

export interface PasswordResetJobData {
  to: string;
  resetLink: string;
  firstName: string;
}

export interface VerifyEmailJobData {
  to: string;
  verifyCode: string;
  firstName: string;
  clientUrl: string;
}

// Note: The clientUrl here is the redirect straight to the login page
export interface PasswordUpdateJobData {
  to: string;
  firstName: string;
  clientUrl: string;
}

export interface LinkExpiredJobData {
  to: string;
  firstName: string;
  requestUrl: string;
}

export interface ContactUsJobData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  message: string;
}

export type EmailJobData =
  | WelcomeJobData
  | PasswordResetJobData
  | VerifyEmailJobData
  | PasswordUpdateJobData
  | LinkExpiredJobData
  | ContactUsJobData;
