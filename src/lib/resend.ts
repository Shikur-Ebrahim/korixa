import { Resend } from "resend";

let resendClient: Resend | null = null;

/** Server-only Resend client */
export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

/**
 * Branded sender address.
 * Use your verified domain for inbox logo (BIMI) — e.g. Korixa <noreply@yourdomain.com>
 */
export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Korixa <onboarding@resend.dev>";
}

export function getReplyToEmail(): string | undefined {
  return process.env.RESEND_REPLY_TO;
}

/** Public logo URL for BIMI DNS (must match your sending domain) */
export function getBimiLogoUrl(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return process.env.BIMI_LOGO_URL ?? `${base}/bimi-logo.svg`;
}

/**
 * DNS TXT record for inbox brand logo (Gmail, Yahoo, etc.)
 * Add at: default._bimi.yourdomain.com
 */
export function getBimiDnsRecord(): string {
  return `v=BIMI1; l=${getBimiLogoUrl()};`;
}

/** Headers that improve deliverability and brand recognition */
export function getEmailHeaders(): Record<string, string> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    "X-Entity-Ref-ID": "korixa-transactional",
    "List-Unsubscribe": `<${appUrl}/sign-up>`,
  };
}

