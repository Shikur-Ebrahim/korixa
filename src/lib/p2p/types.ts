export type PaymentMethod = "Telebirr" | "CBE" | "Awash Bank" | "Dashen Bank" | "Bank of Abyssinia";

export interface PaymentAccountDetail {
  method: PaymentMethod;
  accountName: string;   // Merchant's full name on the account
  accountNumber: string; // Phone number (for Telebirr) or account number (for banks)
}

export interface P2PMerchant {
  id: string; // The user's UID
  name: string;
  isVerified: boolean;
  completionRate: number; // e.g. 98.7
  totalOrders: number;
  availableUSDT: number;
  supportedPaymentMethods: PaymentMethod[];
  status: "active" | "suspended";
  createdAt: string;
}

export interface P2PAdvertisement {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantVerified: boolean;
  merchantCompletionRate: number;
  merchantTotalOrders: number;
  type: "buy" | "sell"; // "buy" means the user buys from merchant, "sell" means user sells to merchant
  currency: string; // usually "ETB"
  price: number; // price per USDT in ETB
  availableUSDT: number;
  minOrderLimit: number; // in ETB
  maxOrderLimit: number; // in ETB
  paymentMethods: PaymentMethod[];
  paymentAccountDetails: PaymentAccountDetail[]; // Per-method account info shown to buyers
  status: "active" | "disabled";
  createdAt: string;
}

export type OrderStatus = "pending" | "paid" | "completed" | "cancelled" | "appealed";

export interface P2POrder {
  id: string;
  adId: string;
  merchantId: string;
  buyerId: string;
  type: "buy" | "sell"; // From the user's perspective
  amountUSDT: number;
  amountETB: number;
  price: number;
  paymentMethod: PaymentMethod;
  paymentAccountDetails: PaymentAccountDetail[]; // Copied from ad at order creation time
  status: OrderStatus;
  paymentProofUrl?: string; // Cloudinary URL
  createdAt: string;
  expiresAt: string; // Orders auto-cancel if not paid
}

export interface P2PMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface P2PAppeal {
  id: string;
  orderId: string;
  raisedBy: string; // UID
  reason: string;
  status: "open" | "resolved" | "rejected";
  createdAt: string;
}
