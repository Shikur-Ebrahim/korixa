import {
  getChainRuntime,
  MIN_DEPOSIT_USDT,
  type DepositChain,
} from "@/lib/deposit/constants";
import { creditDeposit, findUserByDepositAddress } from "@/lib/deposit/firestore";

type WebhookPayload = {
  txId?: string;
  address?: string;
  amount?: string | number;
  chain?: string;
  blockNumber?: number;
  contractAddress?: string;
  to?: string;
  value?: string | number;
  data?: {
    txId?: string;
    to?: string;
    value?: string | number;
    blockNumber?: number;
    contractAddress?: string;
    tokenMetadata?: { symbol?: string; decimals?: number };
    subscriptionType?: string;
  };
};

function normalizeAddress(value?: string) {
  return value?.toLowerCase() ?? "";
}

function parseAmount(raw: string | number | undefined, decimals = 6): number {
  if (raw == null) return 0;

  if (typeof raw === "string" && raw.includes(".")) {
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  const numeric = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(numeric)) return 0;

  if (numeric > 1_000_000) {
    return numeric / 10 ** decimals;
  }

  return numeric;
}

function resolveChainFromWebhook(payload: WebhookPayload): DepositChain | null {
  const chain = payload.chain ?? payload.data?.subscriptionType;
  const chainText = JSON.stringify(payload).toLowerCase();

  if (chainText.includes("bsc") || chainText.includes("bnb")) return "bsc";
  if (chainText.includes("polygon") || chainText.includes("matic")) return "polygon";
  return null;
}

export async function processTatumWebhook(payload: WebhookPayload) {
  const enriched = payload.data ?? payload;
  const toAddress = enriched.to ?? payload.address ?? payload.to;
  const txHash = enriched.txId ?? payload.txId;
  const contractAddress = enriched.contractAddress ?? payload.contractAddress;
  const blockNumber = enriched.blockNumber ?? payload.blockNumber ?? null;
  const decimals = payload.data?.tokenMetadata?.decimals ?? 6;

  if (!toAddress || !txHash) {
    return { ok: false, reason: "missing_fields" as const };
  }

  const lookup = await findUserByDepositAddress(toAddress);
  if (!lookup) {
    return { ok: false, reason: "unknown_address" as const };
  }

  const chain = lookup.chain ?? resolveChainFromWebhook(payload);
  if (!chain) {
    return { ok: false, reason: "unknown_chain" as const };
  }

  const runtime = getChainRuntime(chain);
  if (
    contractAddress &&
    normalizeAddress(contractAddress) !== normalizeAddress(runtime.usdtContract)
  ) {
    return { ok: false, reason: "wrong_token" as const };
  }

  const amount = parseAmount(enriched.value ?? payload.amount ?? payload.value, decimals);

  if (amount < MIN_DEPOSIT_USDT) {
    await creditDeposit({
      userId: lookup.userId,
      chain,
      address: toAddress,
      amount,
      txHash,
      blockNumber,
      confirmations: runtime.minConfirmations,
      status: "failed",
    });
    return { ok: false, reason: "below_minimum" as const };
  }

  const result = await creditDeposit({
    userId: lookup.userId,
    chain,
    address: toAddress,
    amount,
    txHash,
    blockNumber,
    confirmations: runtime.minConfirmations,
    status: "confirmed",
  });

  return { ok: true, credited: result.credited, deposit: result.deposit };
}
