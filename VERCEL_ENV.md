# Vercel environment variables — korixapay.com

Add these in **Vercel → Project → Settings → Environment Variables** (Production + Preview).

## Critical for production

```
NEXT_PUBLIC_APP_URL=https://www.korixapay.com
RESEND_FROM_EMAIL=Korixa <noreply@korixapay.com>
```

Without a **verified domain** in Resend, OTP emails only work for your Resend account email (`onboarding@resend.dev` limitation).

## Full list

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
RESEND_FROM_EMAIL=Korixa <noreply@korixapay.com>
RESEND_REPLY_TO=support@korixapay.com

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

NEXT_PUBLIC_APP_NAME=Korixa
NEXT_PUBLIC_APP_URL=https://www.korixapay.com

COINGECKO_API_KEY=

TATUM_NETWORK=testnet
TATUM_API_KEY_TESTNET=
TATUM_API_KEY_MAINNET=

TRONGRID_API_KEY=

# Required for the 1-minute deposit auto-sweep cron job
# Generate any random string: openssl rand -hex 32
# Then add it to Vercel env AND the Vercel cron will auto-send it as Authorization: Bearer <secret>
CRON_SECRET=
```

## Resend domain setup (required for all signup emails)

1. [resend.com/domains](https://resend.com/domains) → Add **korixapay.com**
2. Add the DNS records Resend provides (SPF, DKIM, etc.) at your domain registrar
3. Wait until status is **Verified**
4. Set `RESEND_FROM_EMAIL=Korixa <noreply@korixapay.com>` in Vercel
5. Redeploy

## Firebase Auth (required for login on live domain)

Firebase Console → Authentication → Settings → **Authorized domains** → add:

- `www.korixapay.com`
- `korixapay.com`
- `korixa.vercel.app` (if using Vercel preview URL)

## After deploy checklist

1. `NEXT_PUBLIC_APP_URL` = `https://www.korixapay.com`
2. Resend domain verified + `RESEND_FROM_EMAIL` updated
3. Firebase authorized domains added
4. Redeploy on Vercel
5. Test signup with a **new email** (not just your Resend account email)

## Live prices (Binance)

Binance API is blocked from US servers. This project uses:

- `data-api.binance.vision` (primary)
- Vercel functions in **EU/Asia regions** (`vercel.json`)
- Lightweight symbol batches instead of full 2MB ticker dump

Optional override:

```
BINANCE_API_URL=https://data-api.binance.vision/api/v3
```
