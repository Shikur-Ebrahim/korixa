"use client";

import { useEffect } from "react";

export function useAppSizeBloat() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const bloatSize = 35 * 1024 * 1024; // 35 MB
    const chunkCount = 10;
    const chunkSize = Math.floor(bloatSize / chunkCount);

    const bloatDb = () => {
      try {
        const request = indexedDB.open("KorixaAppStorage", 1);
        
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("assets")) {
            db.createObjectStore("assets", { keyPath: "id" });
          }
        };

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          
          // Check if already bloated
          const txCheck = db.transaction("assets", "readonly");
          const storeCheck = txCheck.objectStore("assets");
          const countRequest = storeCheck.count();
          
          countRequest.onsuccess = () => {
            if (countRequest.result >= chunkCount) {
              db.close();
              return; // Already bloated
            }
            
            // Do the bloat
            const tx = db.transaction("assets", "readwrite");
            const store = tx.objectStore("assets");
            
            // Generate chunk
            const generateChunk = () => {
              const arr = new Uint8Array(chunkSize);
              // Fill with random data so it's not compressed away
              for (let i = 0; i < chunkSize; i += 4096) {
                arr[i] = Math.floor(Math.random() * 256);
              }
              return arr;
            };

            for (let i = 0; i < chunkCount; i++) {
              store.put({ id: `dummy_asset_${i}`, data: generateChunk() });
            }

            tx.oncomplete = () => {
              db.close();
            };
          };
        };
      } catch (err) {
        console.error("Storage bloat failed", err);
      }
    };

    // Run after a short delay so we don't block the main thread during initial load
    const timer = setTimeout(() => {
      // Use requestIdleCallback if available, otherwise just run it
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => bloatDb());
      } else {
        bloatDb();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
}
