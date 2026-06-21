import {
  getChainRuntime,
  getTatumApiKey,
  getWebhookUrl,
  type DepositChain,
} from "@/lib/deposit/constants";

const TATUM_BASE = "https://api.tatum.io";

type TatumWalletResponse = {
  mnemonic: string;
  xpub: string;
};

type TatumAddressResponse = {
  address: string;
};

type TatumSubscriptionResponse = {
  id: string;
};

async function tatumFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TATUM_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getTatumApiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: string }).message)
        : `Tatum request failed (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

export async function generateHdWallet(chain: DepositChain): Promise<TatumWalletResponse> {
  const { walletApi } = getChainRuntime(chain);
  const mnemonic = process.env.TATUM_DEPOSIT_MNEMONIC;

  const query = mnemonic ? `?mnemonic=${encodeURIComponent(mnemonic)}` : "";
  return tatumFetch<TatumWalletResponse>(`/v3/${walletApi}/wallet${query}`);
}

export async function deriveDepositAddress(
  chain: DepositChain,
  xpub: string,
  index: number
): Promise<string> {
  const { walletApi } = getChainRuntime(chain);
  const data = await tatumFetch<TatumAddressResponse>(
    `/v3/${walletApi}/address/${encodeURIComponent(xpub)}/${index}`
  );
  return data.address;
}

export async function createDepositSubscription(
  chain: DepositChain,
  address: string
): Promise<string | null> {
  const runtime = getChainRuntime(chain);
  const webhookUrl = getWebhookUrl();

  try {
    const data = await tatumFetch<TatumSubscriptionResponse>("/v4/subscription", {
      method: "POST",
      body: JSON.stringify({
        type: "INCOMING_FUNGIBLE_TX",
        attr: {
          chain: runtime.tatumChain,
          address,
          url: webhookUrl,
          conditions: [
            {
              field: "contractAddress",
              operator: "==",
              value: runtime.usdtContract,
            },
          ],
        },
      }),
    });

    return data.id;
  } catch (error) {
    console.error("Tatum subscription error:", error);
    return null;
  }
}
