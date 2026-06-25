import { TronWeb } from "tronweb";

const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY || "1de0d2b3-85af-4639-a787-e55fa8edd92b";

// We use TronGrid Mainnet
export const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
});

export const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Mainnet USDT TRC20

/**
 * Generate a new TRON address and private key.
 */
export function generateTronAccount() {
  const account = tronWeb.utils.accounts.generateAccount();
  return {
    privateKey: account.privateKey,
    address: account.address.base58,
  };
}

/**
 * Fetch the USDT TRC20 balance for a given address using TronWeb.
 * Returns balance in decimal format (e.g., 10.5 for 10.5 USDT).
 * TRC20 USDT has 6 decimals.
 */
export async function getTronUsdtBalance(address: string): Promise<number> {
  try {
    tronWeb.setAddress(address);
    const contract = await tronWeb.contract().at(USDT_TRC20_CONTRACT);
    const balance = await contract.balanceOf(address).call();
    return Number(balance) / 1_000_000;
  } catch (error) {
    console.error("Error fetching TRON USDT balance:", error);
    return 0;
  }
}
