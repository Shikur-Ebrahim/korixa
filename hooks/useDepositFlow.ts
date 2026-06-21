"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { DepositChain } from "@/lib/deposit/constants";
import type { CreateAddressResponse, DepositRecord } from "@/lib/deposit/types";
import { loadBalances, saveBalances } from "@/lib/trade/storage";

type DepositStatusPayload = {
  balances: Record<string, number>;
  deposits: DepositRecord[];
  network: string;
  updatedAt: string | null;
};

export function useDepositFlow() {
  const { getIdToken } = useAuth();
  const [chain, setChain] = useState<DepositChain>("bsc");
  const [addressData, setAddressData] = useState<CreateAddressResponse | null>(null);
  const [status, setStatus] = useState<DepositStatusPayload | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in to continue.");

      return fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      });
    },
    [getIdToken]
  );

  const refreshStatus = useCallback(async () => {
    try {
      const res = await authFetch("/api/deposit/status");
      if (!res.ok) {
        throw new Error("Failed to load deposit status.");
      }

      const data = (await res.json()) as DepositStatusPayload;
      setStatus(data);

      const local = loadBalances();
      saveBalances({ ...local, USDT: data.balances.USDT ?? local.USDT ?? 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status.");
    } finally {
      setLoadingStatus(false);
    }
  }, [authFetch]);

  const createAddress = useCallback(async () => {
    setLoadingAddress(true);
    setError(null);

    try {
      const res = await authFetch("/api/deposit/create-address", {
        method: "POST",
        body: JSON.stringify({ chain }),
      });

      const data = (await res.json()) as CreateAddressResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate deposit address.");
      }

      setAddressData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate address.");
    } finally {
      setLoadingAddress(false);
    }
  }, [authFetch, chain]);

  useEffect(() => {
    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 8000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  useEffect(() => {
    setAddressData(null);
  }, [chain]);

  return {
    chain,
    setChain,
    addressData,
    createAddress,
    refreshStatus,
    status,
    loadingAddress,
    loadingStatus,
    error,
    setError,
  };
}
