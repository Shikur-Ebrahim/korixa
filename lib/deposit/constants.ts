export type DepositChain = "bsc" | "polygon";

export type TatumNetwork = "mainnet" | "testnet";

export const DEPOSIT_TOKEN = "USDT" as const;

export const MIN_DEPOSIT_USDT = 10;

export const CHAIN_CONFIG: Record<
  DepositChain,
  {
    label: string;
    networkLabel: string;
    tokenStandard: string;
    walletApi: string;
    minConfirmations: number;
    mainnet: { tatumChain: string; usdtContract: string };
    testnet: { tatumChain: string; usdtContract: string };
  }
> = {
  bsc: {
    label: "Binance Smart Chain",
    networkLabel: "BEP-20",
    tokenStandard: "BEP-20 USDT",
    walletApi: "bsc",
    minConfirmations: 12,
    mainnet: {
      tatumChain: "bsc-mainnet",
      usdtContract: "0x55d398326f99059fF775485246999027B3197955",
    },
    testnet: {
      tatumChain: "bsc-testnet",
      usdtContract: "0x337610d27c682E347C9cD60BD4b3b107C9d0340",
    },
  },
  polygon: {
    label: "Polygon",
    networkLabel: "Polygon",
    tokenStandard: "ERC-20 USDT",
    walletApi: "polygon",
    minConfirmations: 64,
    mainnet: {
      tatumChain: "polygon-mainnet",
      usdtContract: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    },
    testnet: {
      tatumChain: "polygon-amoy",
      usdtContract: "0x41E94Eb019C076692f9c0F2f404dF62f9B5b0A29",
    },
  },
};

export function getTatumNetwork(): TatumNetwork {
  return process.env.TATUM_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

export function getTatumApiKey(): string {
  const network = getTatumNetwork();
  const key =
    network === "mainnet"
      ? process.env.TATUM_API_KEY_MAINNET
      : process.env.TATUM_API_KEY_TESTNET;

  if (!key) {
    throw new Error(
      network === "mainnet"
        ? "TATUM_API_KEY_MAINNET is not configured."
        : "TATUM_API_KEY_TESTNET is not configured."
    );
  }

  return key;
}

export function getChainRuntime(chain: DepositChain) {
  const network = getTatumNetwork();
  const config = CHAIN_CONFIG[chain];
  const chainNetwork = network === "mainnet" ? config.mainnet : config.testnet;

  return {
    network,
    ...config,
    tatumChain: chainNetwork.tatumChain,
    usdtContract: chainNetwork.usdtContract,
  };
}

export function getWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/webhook/tatum`;
}
