import type { DepositChain } from "@/lib/deposit/constants";

export type DepositAddressRecord = {
  userId: string;
  chain: DepositChain;
  token: string;
  address: string;
  derivationIndex: number;
  subscriptionId: string | null;
  network: string;
  createdAt: string;
};

export type UserWalletRecord = {
  balances: Record<string, number>;
  updatedAt: string | null;
};

export type DepositStatus = "pending" | "confirmed" | "failed";

export type DepositRecord = {
  id: string;
  userId: string;
  chain: DepositChain;
  token: string;
  address: string;
  amount: number;
  txHash: string;
  status: DepositStatus;
  confirmations: number;
  blockNumber: number | null;
  createdAt: string;
  confirmedAt: string | null;
};

export type CreateAddressResponse = {
  walletAddress: string;
  qrCode: string;
  chain: DepositChain;
  token: string;
  network: string;
  networkLabel: string;
  minDeposit: number;
  usdtContract: string;
};

export type DepositStatusResponse = {
  balances: Record<string, number>;
  deposits: DepositRecord[];
  network: string;
};
