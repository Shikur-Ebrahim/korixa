# Korixa

Mobile-first crypto trading web app built with **Next.js 16**, **Firebase Auth**, **Firestore KYC**, **Binance market data**, and **Tatum blockchain deposits**.

## Features

- Email OTP + Google/Facebook sign-in
- KYC verification with ID upload and liveness check
- Home dashboard with live portfolio and watchlist
- Market page (CoinGecko)
- Trade terminal (Binance data)
- Assets portfolio page
- Crypto deposits (BSC + Polygon USDT via Tatum)

## Local development

```bash
npm install
cp .env.example .env
# Fill in .env values (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js** (auto-detected).
4. Add all environment variables from `.env.example` (see **Vercel environment variables** below).
5. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://korixa.vercel.app`).
6. Deploy.

### After deploy

- Add your Vercel domain to **Firebase Auth → Authorized domains**.
- For Tatum deposit webhooks, set `NEXT_PUBLIC_APP_URL` to the live URL so webhooks hit `/api/webhook/tatum`.
- Use `TATUM_NETWORK=testnet` for testing; switch to `mainnet` only when ready for real USDT.

## Vercel environment variables

Copy these into **Vercel → Project → Settings → Environment Variables** (Production, Preview, and Development):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | e.g. `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase console |
| `FIREBASE_PROJECT_ID` | Yes | Same as project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email only (no markdown links) |
| `FIREBASE_PRIVATE_KEY` | Yes | Full private key; use `\n` for line breaks in Vercel |
| `RESEND_API_KEY` | Yes | Email OTP |
| `RESEND_FROM_EMAIL` | Yes | Verified sender, e.g. `Korixa <noreply@yourdomain.com>` |
| `RESEND_REPLY_TO` | Optional | Support email |
| `BIMI_LOGO_URL` | Optional | Email logo URL |
| `CLOUDINARY_CLOUD_NAME` | Yes | KYC uploads |
| `CLOUDINARY_API_KEY` | Yes | KYC uploads |
| `CLOUDINARY_API_SECRET` | Yes | KYC uploads |
| `CLOUDINARY_UPLOAD_PRESET` | Yes | KYC uploads |
| `NEXT_PUBLIC_APP_NAME` | Yes | `Korixa` |
| `NEXT_PUBLIC_APP_URL` | Yes | **Production URL** (critical for OTP links & Tatum webhooks) |
| `COINGECKO_API_KEY` | Yes | Market page |
| `TATUM_NETWORK` | Yes | `testnet` or `mainnet` |
| `TATUM_API_KEY_TESTNET` | Yes | Tatum testnet key |
| `TATUM_API_KEY_MAINNET` | Yes | Tatum mainnet key |
| `TATUM_DEPOSIT_MNEMONIC` | Optional | Reuse same HD wallet across redeploys |

**Do not commit `.env` or `Service Accounts.json` to GitHub.**

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Tech stack

- Next.js 16 App Router, React 19, Tailwind CSS 4
- Firebase Auth + Firestore (Admin SDK)
- Resend (OTP email), Cloudinary (KYC images)
- Binance public API (proxied), CoinGecko (market)
- Tatum (BSC/Polygon USDT deposits + webhooks)
