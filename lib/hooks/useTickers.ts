'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stock-dashboard-tickers';

export function useTickers() {
  const [tickers, setTickers] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(t => typeof t === 'string')) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
  }, [tickers]);

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
