import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  type AuthProvider,
} from "firebase/auth";

/** Google sign-up / sign-in */
export function createGoogleAuthProvider(): GoogleAuthProvider {
  return new GoogleAuthProvider();
}

/**
 * Facebook sign-up / sign-in.
 * Firebase adds `email` by default, but Meta rejects it unless your app
 * has Advanced Access for email in the Developer Console. We only request
 * `public_profile` so login works out of the box.
 */
export function createFacebookAuthProvider(): FacebookAuthProvider {
  const provider = new FacebookAuthProvider();

  const scopedProvider = provider as FacebookAuthProvider & { scopes: Set<string> };
  scopedProvider.scopes = new Set(["public_profile"]);

  provider.setCustomParameters({
    display: "popup",
  });

  return provider;
}

export function getSocialAuthProvider(provider: "google" | "facebook"): AuthProvider {
  return provider === "google"
    ? createGoogleAuthProvider()
    : createFacebookAuthProvider();
}
