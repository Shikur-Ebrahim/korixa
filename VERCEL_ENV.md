# Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**.

## Required

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

NEXT_PUBLIC_APP_NAME=Korixa
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app

COINGECKO_API_KEY=

TATUM_NETWORK=testnet
TATUM_API_KEY_TESTNET=
TATUM_API_KEY_MAINNET=
```

## Optional

```
RESEND_REPLY_TO=
BIMI_LOGO_URL=
TATUM_DEPOSIT_MNEMONIC=
```

## Important notes

1. **FIREBASE_PRIVATE_KEY** — Paste the full key from Firebase service account JSON. In Vercel, keep `\n` for line breaks (do not use real newlines unless Vercel multiline field).
2. **FIREBASE_CLIENT_EMAIL** — Plain email only, e.g. `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com` (no markdown links).
3. **NEXT_PUBLIC_APP_URL** — Must be your live Vercel URL after first deploy, e.g. `https://korixa.vercel.app`. Required for OTP emails and Tatum deposit webhooks.
4. **Firebase Auth** — After deploy, add your Vercel domain under Firebase Console → Authentication → Settings → Authorized domains.
5. **Tatum webhooks** — Regenerate deposit addresses after setting production `NEXT_PUBLIC_APP_URL` so subscriptions point to `https://YOUR-PROJECT.vercel.app/api/webhook/tatum`.

## Deploy steps

1. Import https://github.com/Shikur-Ebrahim/korixa in Vercel.
2. Framework: **Next.js** (auto-detected).
3. Add all variables above.
4. Deploy.
5. Update `NEXT_PUBLIC_APP_URL` to the final production URL and redeploy if needed.
