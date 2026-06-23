"use client";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getClientAuth, initClientAuth } from "@/lib/firebase";
import type { KycStatus, UserKycRecord } from "@/lib/kyc/types";
import { getUserSecurity } from "@/lib/profile/service";
import { MfaVerificationScreen } from "./MfaVerificationScreen";

export type UserRole = "admin" | "user" | null;

type AuthContextValue = {
  user: User | null;
  role: UserRole;
  loading: boolean;
  initialized: boolean;
  kyc: UserKycRecord | null;
  kycLoading: boolean;
  kycStatus: KycStatus;
  refreshKyc: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [kyc, setKyc] = useState<UserKycRecord | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [mfaLocked, setMfaLocked] = useState(false);
  const [mfaChecking, setMfaChecking] = useState(false);
  const router = useRouter();
  const redirectedRef = useRef(false);

  const getIdToken = useCallback(async () => {
    const activeUser = getClientAuth().currentUser ?? user;
    if (!activeUser) return null;
    return activeUser.getIdToken();
  }, [user]);

  const refreshKyc = useCallback(async () => {
    const activeUser = getClientAuth().currentUser ?? user;

    if (!activeUser) {
      setKyc(null);
      return;
    }

    setKycLoading(true);

    try {
      const token = await activeUser.getIdToken();
      const res = await fetch("/api/kyc/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as { kyc: UserKycRecord };
      setKyc(data.kyc);
    } catch {
      /* keep session — KYC fetch failure must not log user out */
    } finally {
      setKycLoading(false);
    }
  }, [user]);

  /** Read role from Firebase custom claims (inside the ID token JWT) */
  const refreshRole = useCallback(async (firebaseUser: User) => {
    try {
      // forceRefresh=true so we always get the latest claim after set-admin.js runs
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const claim = tokenResult.claims.role as string | undefined;
      setRole(claim === "admin" ? "admin" : "user");
      return claim === "admin" ? "admin" : "user";
    } catch {
      setRole("user");
      return "user" as UserRole;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    initClientAuth()
      .then((auth) => {
        unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
          if (nextUser) {
            // First set loading true so we don't flash content before MFA check
            setLoading(true);
            setMfaChecking(true);
            try {
              const security = await getUserSecurity(nextUser.uid);
              if (security?.mfaEnabled) {
                // If this is a fresh login event, require MFA.
                // In a highly robust system, you might track this with a session cookie.
                // For now, any time AuthState changes to logged in, we lock them if MFA enabled.
                setMfaLocked(true);
              } else {
                setMfaLocked(false);
              }
              await refreshRole(nextUser);
              setUser(nextUser);
            } catch (err) {
              console.error("MFA Check failed", err);
              setUser(nextUser); // Default to letting them in, or handle error
            } finally {
              setMfaChecking(false);
              setLoading(false);
              setInitialized(true);
            }
          } else {
            setUser(null);
            setRole(null);
            setMfaLocked(false);
            redirectedRef.current = false;
            setLoading(false);
            setInitialized(true);
          }
        });
      })
      .catch(() => {
        setLoading(false);
        setInitialized(true);
      });

    return () => unsubscribe();
  }, [refreshRole, router]);

  useEffect(() => {
    if (user) {
      refreshKyc();
    } else {
      setKyc(null);
    }
  }, [user, refreshKyc]);

  const logout = useCallback(async () => {
    redirectedRef.current = false;
    await signOut(getClientAuth());
    setKyc(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      initialized,
      kyc,
      kycLoading,
      kycStatus: kyc?.kycStatus ?? "pending",
      refreshKyc,
      getIdToken,
      logout,
    }),
    [user, role, loading, initialized, kyc, kycLoading, refreshKyc, getIdToken, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {mfaLocked && (
        <MfaVerificationScreen
          onVerified={() => setMfaLocked(false)}
          onCancel={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
