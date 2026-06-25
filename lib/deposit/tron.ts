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
 * Fetch the current USDT TRC20 balance.
 * (Note: this drops when admin sweeps the wallet)
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

/**
 * Fetch recent incoming USDT TRC20 transfers for an address.
 * This ensures we detect deposits even if the admin has swept the balance to 0.
 */
export async function getIncomingUsdtTransfers(address: string) {
  try {
    const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=50&contract_address=${USDT_TRC20_CONTRACT}&only_to=true`;
    
    const response = await fetch(url, {
      headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.data.map((tx: any) => ({
      txId: tx.transaction_id,
      amount: Number(tx.value) / 1_000_000,
      timestamp: tx.block_timestamp
    }));
  } catch (error) {
    console.error("Error fetching TRON transfers:", error);
    return [];
  }
}

/**
 * Send TRC20 USDT from a user deposit address to a destination (e.g. Binance/Bybit).
 * Requires the private key of the source address and enough TRX for gas (~15-30 TRX).
 * Amount should be in USDT decimal format (e.g. 10.5 = 10.5 USDT).
 */
export async function sendUsdtTrc20(
  fromPrivateKey: string,
  toAddress: string,
  amount: number
): Promise<{ txId: string }> {
  const web = new TronWeb({
    fullHost: "https://api.trongrid.io",
    headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
    privateKey: fromPrivateKey,
  });

  // Amount must be in raw units (6 decimals)
  const amountRaw = Math.floor(amount * 1_000_000);
  
  if (amountRaw <= 0) throw new Error("Amount must be greater than 0");

  const contract = await web.contract().at(USDT_TRC20_CONTRACT);
  const txId = await contract.transfer(toAddress, amountRaw).send();
  
  return { txId };
}
