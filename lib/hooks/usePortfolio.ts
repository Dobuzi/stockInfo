'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Holding } from '@/lib/types/portfolio';

const STORAGE_KEY = 'stock-dashboard-portfolio';

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const addHolding = (holding: Omit<Holding, 'id'>) => {
    // Check for duplicate ticker
    if (holdings.some(h => h.ticker === holding.ticker)) {
      throw new Error(`Holding for ${holding.ticker} already exists`);
    }

    const newHolding: Holding = {
      ...holding,
      id: uuidv4(),
    };

    setHoldings([...holdings, newHolding]);
  };

  const updateHolding = (id: string, updates: Partial<Omit<Holding, 'id' | 'ticker'>>) => {
    setHoldings(holdings.map(h =>
      h.id === id ? { ...h, ...updates } : h
    ));
  };

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  return {
    holdings,
    addHolding,
    updateHolding,
    removeHolding,
  };
}
