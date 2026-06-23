export type SecurityScore = number; // 0 to 100

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  username: string;
  profileImage: string | null;
  country: string | null;
  phoneNumber: string | null;
  kycStatus: "unverified" | "pending" | "verified" | "rejected";
  vipLevel: number;
  referralCode: string;
  createdAt: string; // ISO string
  lastLogin: string; // ISO string
  accountStatus: "active" | "frozen" | "suspended";
  securityScore: SecurityScore;
}

export interface UserSecurity {
  uid: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string; // Stored securely
  recoveryCodesGenerated: boolean;
  antiPhishingCode: string | null;
  withdrawalWhitelistEnabled: boolean;
  withdrawalWhitelist: string[]; // List of addresses
}

export interface UserDevice {
  id: string; // Document ID
  uid: string;
  browser: string;
  os: string;
  deviceType: "mobile" | "desktop" | "tablet";
  ipAddress: string;
  location: string; // e.g. "Addis Ababa, ET"
  lastActive: string; // ISO string
  isTrusted: boolean;
  isCurrentSession?: boolean; // Used in UI
}

export interface LoginLog {
  id: string;
  uid: string;
  time: string; // ISO string
  ipAddress: string;
  browser: string;
  os: string;
  location: string;
  method: "email_otp" | "google";
  status: "success" | "failed";
}

export interface UserSettings {
  uid: string;
  language: string;
  theme: "dark" | "light" | "system";
  currencyDisplay: string;
  timezone: string;
  marketingEmails: boolean;
  tradingAlerts: boolean;
  securityAlerts: boolean; // Cannot be disabled via UI usually, but good to store
  profileVisibility: "public" | "private";
}

export interface UserReferralStat {
  uid: string;
  totalInvites: number;
  totalRewardsUSDT: number;
  tier: "standard" | "bronze" | "silver" | "gold";
}
