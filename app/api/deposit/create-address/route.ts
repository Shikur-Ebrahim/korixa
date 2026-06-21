import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { AuthError, verifyAuthToken } from "@/lib/auth/verify-token";
import {
  getChainRuntime,
  MIN_DEPOSIT_USDT,
  type DepositChain,
} from "@/lib/deposit/constants";
import { ensureHdWallet, getOrAllocateDepositAddress } from "@/lib/deposit/firestore";
import {
  createDepositSubscription,
  deriveDepositAddress,
  generateHdWallet,
} from "@/lib/deposit/tatum";
import { getUserKycRecord } from "@/lib/kyc/firestore";

const bodySchema = z.object({
  chain: z.enum(["bsc", "polygon"]),
});

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);

    const kyc = await getUserKycRecord(decoded.uid);
    if (kyc?.kycStatus !== "verified") {
      return NextResponse.json(
        { error: "Please complete verification to access deposits." },
        { status: 403 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid chain. Use bsc or polygon." }, { status: 400 });
    }

    const chain = parsed.data.chain as DepositChain;
    const runtime = getChainRuntime(chain);

    await ensureHdWallet(chain, async () => {
      const wallet = await generateHdWallet(chain);
      return { xpub: wallet.xpub };
    });

    const record = await getOrAllocateDepositAddress({
      userId: decoded.uid,
      chain,
      network: runtime.network,
      deriveAddress: (xpub, index) => deriveDepositAddress(chain, xpub, index),
      createSubscription: (address) => createDepositSubscription(chain, address),
    });

    const qrCode = await QRCode.toDataURL(record.address, {
      margin: 1,
      width: 280,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({
      walletAddress: record.address,
      qrCode,
      chain: record.chain,
      token: record.token,
      network: runtime.network,
      networkLabel: `${runtime.label} (${runtime.networkLabel})`,
      minDeposit: MIN_DEPOSIT_USDT,
      usdtContract: runtime.usdtContract,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("create-address error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create deposit address.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
