'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stock-dashboard-tickers';

export function useTickers() {
  // Always start with [] on both server and client to avoid hydration mismatch
  const [tickers, setTickers] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read from localStorage after mount (post-hydration) to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(t => typeof t === 'string')) {
          setTickers(parsed);
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever tickers change (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
  }, [tickers, isHydrated]);

  const addTicker = (ticker: string) => {
    const normalized = ticker.trim().toUpperCase();
    if (!tickers.includes(normalized) && tickers.length < 10) {
      setTickers([...tickers, normalized]);
    }
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter(t => t !== ticker));
  };

  return { tickers, addTicker, removeTicker };
}
