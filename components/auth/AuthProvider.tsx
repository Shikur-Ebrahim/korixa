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
  useState,
  type ReactNode,
} from "react";
import { getClientAuth, initClientAuth } from "@/lib/firebase";
import type { KycStatus, UserKycRecord } from "@/lib/kyc/types";

type AuthContextValue = {
  user: User | null;
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
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [kyc, setKyc] = useState<UserKycRecord | null>(null);
  const [kycLoading, setKycLoading] = useState(false);

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

  useEffect(() => {
    let unsubscribe = () => {};

    initClientAuth()
      .then((auth) => {
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
          setInitialized(true);
        });
      })
      .catch(() => {
        setLoading(false);
        setInitialized(true);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshKyc();
    } else {
      setKyc(null);
    }
  }, [user, refreshKyc]);

  const logout = useCallback(async () => {
    await signOut(getClientAuth());
    setKyc(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      initialized,
      kyc,
      kycLoading,
      kycStatus: kyc?.kycStatus ?? "pending",
      refreshKyc,
      getIdToken,
      logout,
    }),
    [user, loading, initialized, kyc, kycLoading, refreshKyc, getIdToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
