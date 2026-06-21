import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { DepositChain } from "@/lib/deposit/constants";
import { DEPOSIT_TOKEN } from "@/lib/deposit/constants";
import type {
  DepositAddressRecord,
  DepositRecord,
  DepositStatus,
  UserWalletRecord,
} from "@/lib/deposit/types";

const HD_WALLET_DOC = "system/deposit_hd";
const LOOKUP_COLLECTION = "deposit_address_lookup";

type HdWalletState = {
  xpub: string;
  nextIndex: number;
};

function walletRef(userId: string) {
  return adminDb.doc(`users/${userId}/wallet/default`);
}

function depositAddressRef(userId: string, chain: DepositChain) {
  return adminDb.doc(`users/${userId}/deposit_addresses/${chain}`);
}

function lookupRef(address: string) {
  return adminDb.doc(`${LOOKUP_COLLECTION}/${address.toLowerCase()}`);
}

export async function getUserWallet(userId: string): Promise<UserWalletRecord> {
  const snap = await walletRef(userId).get();
  if (!snap.exists) {
    return { balances: { USDT: 0 }, updatedAt: null };
  }

  const data = snap.data() as UserWalletRecord;
  return {
    balances: data.balances ?? { USDT: 0 },
    updatedAt: data.updatedAt ?? null,
  };
}

export async function getDepositAddress(
  userId: string,
  chain: DepositChain
): Promise<DepositAddressRecord | null> {
  const snap = await depositAddressRef(userId, chain).get();
  if (!snap.exists) return null;
  return snap.data() as DepositAddressRecord;
}

export async function getOrAllocateDepositAddress(input: {
  userId: string;
  chain: DepositChain;
  network: string;
  deriveAddress: (xpub: string, index: number) => Promise<string>;
  createSubscription: (address: string) => Promise<string | null>;
}): Promise<DepositAddressRecord> {
  const existing = await getDepositAddress(input.userId, input.chain);
  if (existing) return existing;

  const hdRef = adminDb.doc(`${HD_WALLET_DOC}_${input.chain}`);

  const allocation = await adminDb.runTransaction(async (tx) => {
    const existingSnap = await tx.get(depositAddressRef(input.userId, input.chain));
    if (existingSnap.exists) {
      return { existing: existingSnap.data() as DepositAddressRecord };
    }

    const hdSnap = await tx.get(hdRef);
    const hd = hdSnap.data() as HdWalletState | undefined;
    if (!hd?.xpub) {
      throw new Error("Deposit HD wallet is not initialized.");
    }

    const index = hd.nextIndex ?? 0;
    tx.set(hdRef, { nextIndex: index + 1 }, { merge: true });

    return { xpub: hd.xpub, index };
  });

  if ("existing" in allocation && allocation.existing) {
    return allocation.existing;
  }

  if (!("xpub" in allocation) || allocation.xpub == null || allocation.index == null) {
    throw new Error("Failed to allocate deposit address index.");
  }

  const address = await input.deriveAddress(allocation.xpub, allocation.index);

  const record: DepositAddressRecord = {
    userId: input.userId,
    chain: input.chain,
    token: DEPOSIT_TOKEN,
    address,
    derivationIndex: allocation.index,
    subscriptionId: null,
    network: input.network,
    createdAt: new Date().toISOString(),
  };

  await adminDb.runTransaction(async (tx) => {
    const existingSnap = await tx.get(depositAddressRef(input.userId, input.chain));
    if (existingSnap.exists) return;

    tx.set(depositAddressRef(input.userId, input.chain), record);
    tx.set(lookupRef(address), {
      userId: input.userId,
      chain: input.chain,
      address,
    });
  });

  const saved = await getDepositAddress(input.userId, input.chain);
  const finalRecord = saved ?? record;

  if (!finalRecord.subscriptionId) {
    const subscriptionId = await input.createSubscription(finalRecord.address);
    if (subscriptionId) {
      const updated = { ...finalRecord, subscriptionId };
      await depositAddressRef(input.userId, input.chain).set(updated, { merge: true });
      return updated;
    }
  }

  return finalRecord;
}

export async function ensureHdWallet(
  chain: DepositChain,
  generateWallet: () => Promise<{ xpub: string }>
): Promise<HdWalletState> {
  const hdRef = adminDb.doc(`${HD_WALLET_DOC}_${chain}`);
  const snap = await hdRef.get();

  if (snap.exists && snap.data()?.xpub) {
    return snap.data() as HdWalletState;
  }

  const wallet = await generateWallet();
  const state: HdWalletState = { xpub: wallet.xpub, nextIndex: 0 };
  await hdRef.set(state, { merge: true });
  return state;
}

export async function findUserByDepositAddress(
  address: string
): Promise<{ userId: string; chain: DepositChain } | null> {
  const snap = await lookupRef(address).get();
  if (!snap.exists) return null;

  const data = snap.data() as { userId: string; chain: DepositChain };
  return { userId: data.userId, chain: data.chain };
}

export async function listUserDeposits(userId: string, limit = 20): Promise<DepositRecord[]> {
  const snap = await adminDb.collection("deposits").where("userId", "==", userId).limit(50).get();

  return snap.docs
    .map((doc) => doc.data() as DepositRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function creditDeposit(input: {
  userId: string;
  chain: DepositChain;
  address: string;
  amount: number;
  txHash: string;
  blockNumber: number | null;
  confirmations: number;
  status: DepositStatus;
}): Promise<{ credited: boolean; deposit: DepositRecord }> {
  const depositId = input.txHash.toLowerCase();
  const depositDoc = adminDb.doc(`deposits/${depositId}`);

  return adminDb.runTransaction(async (tx) => {
    const existing = await tx.get(depositDoc);
    const userWallet = await tx.get(walletRef(input.userId));

    if (existing.exists) {
      const current = existing.data() as DepositRecord;
      if (current.status === "confirmed") {
        return { credited: false, deposit: current };
      }
    }

    const now = new Date().toISOString();
    const deposit: DepositRecord = {
      id: depositId,
      userId: input.userId,
      chain: input.chain,
      token: DEPOSIT_TOKEN,
      address: input.address,
      amount: input.amount,
      txHash: input.txHash,
      status: input.status,
      confirmations: input.confirmations,
      blockNumber: input.blockNumber,
      createdAt: existing.exists
        ? ((existing.data() as DepositRecord).createdAt ?? now)
        : now,
      confirmedAt: input.status === "confirmed" ? now : null,
    };

    tx.set(depositDoc, deposit);

    if (input.status === "confirmed") {
      const balances =
        (userWallet.data() as UserWalletRecord | undefined)?.balances ?? { USDT: 0 };
      const nextUsdt = (balances.USDT ?? 0) + input.amount;

      tx.set(
        walletRef(input.userId),
        {
          balances: { ...balances, USDT: nextUsdt },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { credited: input.status === "confirmed", deposit };
  });
}
