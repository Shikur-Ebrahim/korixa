import fs from "fs";
import path from "path";

/** Content-ID for inline email logo — referenced as cid:korixa-logo in HTML */
export const EMAIL_LOGO_CID = "korixa-logo";

export type ResendLogoAttachment = {
  filename: string;
  content: Buffer;
  contentId: string;
};

let cachedBase64: string | null = null;

function readLogoBase64(): string {
  if (cachedBase64) {
    return cachedBase64;
  }

  const logoPath = path.join(process.cwd(), "public", "korixa-logo.jpg");
  const fallbackPath = path.join(process.cwd(), "public", "app logo.jpg");
  const resolvedPath = fs.existsSync(logoPath) ? logoPath : fallbackPath;

  if (!fs.existsSync(resolvedPath)) {
    throw new Error("Logo file not found at public/korixa-logo.jpg");
  }

  cachedBase64 = fs.readFileSync(resolvedPath).toString("base64");
  return cachedBase64;
}

/**
 * Inline logo attachment for Resend emails.
 * Embeds public/app logo.jpg directly — works on localhost and production.
 */
export function getEmailLogoAttachment(): ResendLogoAttachment | null {
  try {
    return {
      filename: "korixa-logo.jpg",
      content: Buffer.from(readLogoBase64(), "base64"),
      contentId: EMAIL_LOGO_CID,
    };
  } catch {
    return null;
  }
}

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

/** Public HTTPS logo URL — used when deployed (better client support than CID alone) */
export function getPublicEmailLogoUrl(): string | null {
  const base = getAppBaseUrl();
  if (!base || base.includes("localhost") || base.includes("127.0.0.1")) {
    return null;
  }
  return `${base}/korixa-logo.jpg`;
}

/** Use in HTML: hosted URL in production, inline CID on localhost */
export function getEmailLogoSrc(): string {
  return getPublicEmailLogoUrl() ?? `cid:${EMAIL_LOGO_CID}`;
}
