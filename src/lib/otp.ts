import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { getEmailLogoSrc } from "@/lib/email-logo";
import {
  getEmailHeaders,
  getFromEmail,
  getReplyToEmail,
  getResend,
} from "@/lib/resend";

export type OtpPurpose = "registration";

const OTP_EXPIRY_MINUTES = 5;
const OTP_COLLECTION = "otp_codes";

export type OtpRecord = {
  email: string;
  code: string;
  purpose: OtpPurpose;
  expiresAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
};

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getVerifyUrl(email: string, code: string): string {
  const params = new URLSearchParams({ email, code, next: "/dashboard" });
  return `${getAppBaseUrl()}/sign-up?${params.toString()}`;
}

/** Single-row table layout — keeps all 6 digits on one line in mobile mail clients */
function formatCodeRowHtml(code: string): string {
  return code
    .split("")
    .map(
      (digit) =>
        `<td style="color:#F7931A;font-size:22px;font-weight:700;padding:0 3px;line-height:1;font-family:Consolas,Monaco,'Courier New',monospace;-webkit-user-select:all;user-select:all;">${digit}</td>`
    )
    .join("");
}

function buildVerificationEmailHtml(code: string, email: string): string {
  const logoSrc = getEmailLogoSrc();
  const verifyUrl = getVerifyUrl(email, code);
  const title = "Welcome to Korixa";
  const message = "Welcome to Korixa! Use the verification code below to continue.";
  const codeRowHtml = formatCodeRowHtml(code);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  </head>
  <body style="margin:0;padding:0;background:#0F2447;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your Korixa verification code is ${code}. It expires in 5 minutes.
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#2563EB;border-bottom:1px solid rgba(191,219,254,0.35);">
      <tr>
        <td style="padding:14px 16px;text-align:center;">
          <p style="margin:0 0 10px;color:#EFF6FF;font-size:13px;font-weight:600;">Verify your email to continue to identity verification</p>
          <a
            href="${verifyUrl}"
            style="display:inline-block;background:#F7931A;color:#0F2447;text-decoration:none;font-size:13px;font-weight:700;padding:10px 20px;border-radius:10px;"
          >
            Verify now
          </a>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0F2447;padding:24px 16px 32px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:420px;margin-bottom:20px;">
            <tr>
              <td align="center" style="padding:8px 0 4px;">
                <img
                  src="${logoSrc}"
                  alt="Korixa"
                  width="120"
                  style="display:block;margin:0 auto;border:0;outline:none;max-width:120px;width:120px;height:auto;border-radius:16px;"
                />
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:420px;background:#1E40AF;border-radius:16px;border:1px solid rgba(147,197,253,0.25);">
            <tr>
              <td style="padding:28px 22px;text-align:center;">
                <h1 style="color:#ffffff;font-size:20px;margin:0 0 8px;font-weight:700;">${title}</h1>
                <p style="color:#DBEAFE;font-size:13px;line-height:1.6;margin:0 0 20px;">${message}</p>

                <div style="background:#2563EB;border:1px solid rgba(191,219,254,0.45);border-radius:12px;padding:18px 12px;margin-bottom:16px;">
                  <p style="color:#EFF6FF;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.12em;">Your Code</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px;border-collapse:collapse;">
                    <tr>${codeRowHtml}</tr>
                  </table>
                  <p style="color:#DBEAFE;font-size:11px;margin:0;">Tap and hold to copy</p>
                </div>

                <a
                  href="${verifyUrl}"
                  style="display:inline-block;background:#F7931A;color:#0F2447;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:12px;margin-bottom:16px;"
                >
                  Verify &amp; continue to KYC
                </a>

                <p style="color:#DBEAFE;font-size:12px;margin:0 0 8px;">This code expires in <strong style="color:#ffffff;">5 minutes</strong>.</p>
                <p style="color:#BFDBFE;font-size:11px;margin:0;line-height:1.5;">If you did not request this, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildVerificationEmailText(code: string, email: string): string {
  const title = "Welcome to Korixa";
  const verifyUrl = getVerifyUrl(email, code);

  return `${title}

Your Korixa verification code is: ${code}

Verify instantly: ${verifyUrl}

This code expires in 5 minutes.

If you did not request this, you can safely ignore this email.

— Korixa`;
}

async function sendBrandedEmail(options: {
  to: string;
  subject: string;
  code: string;
}) {
  const resend = getResend();
  const replyTo = getReplyToEmail();
  const from = getFromEmail();

  if (
    process.env.VERCEL === "1" &&
    from.includes("resend.dev")
  ) {
    throw new Error(
      "RESEND_FROM_EMAIL must use your verified domain (e.g. Korixa <noreply@korixapay.com>). The default resend.dev sender only delivers to your Resend account email."
    );
  }

  // Attach logo inline (CID) only when using localhost (no public HTTPS URL).
  // On production the HTML already points to the public HTTPS URL, so no attachment needed.
  const { getEmailLogoAttachment, getPublicEmailLogoUrl } = await import("@/lib/email-logo");
  const useInlineAttachment = !getPublicEmailLogoUrl();
  const logoAttachment = useInlineAttachment ? getEmailLogoAttachment() : null;

  const { error } = await resend.emails.send({
    from,
    to: options.to,
    ...(replyTo ? { replyTo } : {}),
    subject: options.subject,
    html: buildVerificationEmailHtml(options.code, options.to),
    text: buildVerificationEmailText(options.code, options.to),
    headers: getEmailHeaders(),
    ...(logoAttachment
      ? {
          attachments: [
            {
              filename: logoAttachment.filename,
              content: logoAttachment.content,
              contentId: logoAttachment.contentId,
              // inline disposition so email clients render it in-body, not as download
            },
          ],
        }
      : {}),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function saveOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  );

  await getAdminDb().collection(OTP_COLLECTION).doc(`${normalized}_${purpose}`).set({
    email: normalized,
    code,
    purpose,
    expiresAt,
    createdAt: Timestamp.now(),
  });
}

async function verifyStoredOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ valid: boolean; error?: string }> {
  const normalized = normalizeEmail(email);
  const docRef = getAdminDb().collection(OTP_COLLECTION).doc(`${normalized}_${purpose}`);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return { valid: false, error: "No verification code found. Please request a new one." };
  }

  const data = snapshot.data() as OtpRecord;

  if (data.expiresAt.toMillis() < Date.now()) {
    // Delete expired OTP immediately to keep the collection clean
    await docRef.delete();
    return { valid: false, error: "This code has expired. Please request a new one." };
  }

  if (data.code !== code.trim()) {
    return { valid: false, error: "Invalid verification code." };
  }

  // Delete the OTP document immediately after successful verification
  await docRef.delete();
  return { valid: true };
}

/** Send registration OTP via Resend and store in Firestore */
export async function sendVerificationOTP(
  email: string
): Promise<{ success: boolean; message: string }> {
  const normalized = normalizeEmail(email);
  const code = generateOtpCode();

  // Save first — fails fast if Firestore / Firebase Admin is misconfigured
  await saveOtp(normalized, "registration", code);

  await sendBrandedEmail({
    to: normalized,
    subject: "Welcome to Korixa — verify your email",
    code,
  });

  return {
    success: true,
    message: "Verification code sent to your email.",
  };
}

/** Verify registration OTP */
export async function verifyOTP(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  return verifyStoredOtp(email, code, "registration");
}

/** Create Firebase custom token after OTP verification */
export async function createAuthTokenForEmail(
  email: string,
  displayName?: string
): Promise<string> {
  const normalized = normalizeEmail(email);
  let user;

  const { getAdminAuth } = await import("@/lib/firebase-admin-auth");

  try {
    user = await getAdminAuth().getUserByEmail(normalized);
  } catch {
    user = await getAdminAuth().createUser({
      email: normalized,
      emailVerified: true,
      displayName: displayName || normalized.split("@")[0],
    });
  }

  return getAdminAuth().createCustomToken(user.uid);
}
