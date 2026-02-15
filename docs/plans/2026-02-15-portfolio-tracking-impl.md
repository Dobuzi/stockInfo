# Portfolio Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add portfolio tracking to monitor stock holdings, calculate P/L, and visualize allocation

**Architecture:** New Portfolio tab with independent state (localStorage), fetches current prices using existing hooks, calculates P/L client-side, displays in table/chart components

**Tech Stack:** React hooks (useState, useEffect, useMemo), localStorage, recharts (pie chart), TypeScript, TailwindCSS

---

## Task 1: P/L Calculation Utilities

Create utility functions for portfolio calculations

**Files:**
- Create: `lib/utils/portfolio.ts`
- Test: `__tests__/unit/portfolio-calculations.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/unit/portfolio-calculations.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateHoldingPnL,
  calculatePortfolioTotals,
  calculateAllocation,
} from '@/lib/utils/portfolio';

describe('calculateHoldingPnL', () => {
  it('should calculate cost basis correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.costBasis).toBe(1500);
  });

  it('should calculate current value correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.currentValue).toBe(1800);
  });

  it('should calculate gain/loss dollar amount', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.gainLoss).toBe(300);
  });

  it('should calculate gain/loss percentage', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.gainLossPercent).toBeCloseTo(20, 1);
  });

  it('should handle fractional shares', () => {
    const result = calculateHoldingPnL({
      quantity: 5.5,
      avgCost: 100,
      currentPrice: 120,
    });

    expect(result.costBasis).toBe(550);
    expect(result.currentValue).toBe(660);
    expect(result.gainLoss).toBe(110);
    expect(result.gainLossPercent).toBeCloseTo(20, 1);
  });

  it('should handle losses', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 200,
      currentPrice: 150,
    });

    expect(result.gainLoss).toBe(-500);
    expect(result.gainLossPercent).toBeCloseTo(-25, 1);
  });
});

describe('calculatePortfolioTotals', () => {
  it('should sum multiple holdings correctly', () => {
    const holdings = [
      { quantity: 10, avgCost: 150, currentPrice: 180 },
      { quantity: 5, avgCost: 200, currentPrice: 220 },
    ];

    const totals = calculatePortfolioTotals(holdings);

    expect(totals.totalCost).toBe(2500); // (10*150) + (5*200)
    expect(totals.totalValue).toBe(2900); // (10*180) + (5*220)
    expect(totals.totalGainLoss).toBe(400);
    expect(totals.portfolioReturn).toBeCloseTo(16, 1);
  });

  it('should handle zero holdings', () => {
    const totals = calculatePortfolioTotals([]);

    expect(totals.totalCost).toBe(0);
    expect(totals.totalValue).toBe(0);
    expect(totals.totalGainLoss).toBe(0);
    expect(totals.portfolioReturn).toBe(0);
  });
});

describe('calculateAllocation', () => {
  it('should calculate percentages that sum to 100', () => {
    const holdings = [
      { currentValue: 1800 },
      { currentValue: 1100 },
    ];

    const allocations = calculateAllocation(holdings, 2900);

    expect(allocations[0]).toBeCloseTo(62.07, 1);
    expect(allocations[1]).toBeCloseTo(37.93, 1);

    const sum = allocations.reduce((acc, val) => acc + val, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it('should handle single holding as 100%', () => {
    const holdings = [{ currentValue: 1000 }];
    const allocations = calculateAllocation(holdings, 1000);

    expect(allocations[0]).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test __tests__/unit/portfolio-calculations.test.ts`
Expected: FAIL with "Cannot find module '@/lib/utils/portfolio'"

**Step 3: Write minimal implementation**

```typescript
// lib/utils/portfolio.ts

export interface HoldingPnLInput {
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface HoldingPnLResult {
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export function calculateHoldingPnL(input: HoldingPnLInput): HoldingPnLResult {
  const { quantity, avgCost, currentPrice } = input;

  const costBasis = quantity * avgCost;
  const currentValue = quantity * currentPrice;
  const gainLoss = currentValue - costBasis;
  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

  return {
    costBasis,
    currentValue,
    gainLoss,
    gainLossPercent,
  };
}

export interface PortfolioHolding {
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface PortfolioTotals {
  totalCost: number;
  totalValue: number;
  totalGainLoss: number;
  portfolioReturn: number;
}

export function calculatePortfolioTotals(
  holdings: PortfolioHolding[]
): PortfolioTotals {
  if (holdings.length === 0) {
    return {
      totalCost: 0,
      totalValue: 0,
      totalGainLoss: 0,
      portfolioReturn: 0,
    };
  }

  let totalCost = 0;
  let totalValue = 0;

  for (const holding of holdings) {
    totalCost += holding.quantity * holding.avgCost;
    totalValue += holding.quantity * holding.currentPrice;
  }

  const totalGainLoss = totalValue - totalCost;
  const portfolioReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    totalCost,
    totalValue,
    totalGainLoss,
    portfolioReturn,
  };
}

export interface AllocationHolding {
  currentValue: number;
}

export function calculateAllocation(
  holdings: AllocationHolding[],
  totalValue: number
): number[] {
  if (totalValue === 0) {
    return holdings.map(() => 0);
  }

  return holdings.map((holding) => (holding.currentValue / totalValue) * 100);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test __tests__/unit/portfolio-calculations.test.ts`
Expected: PASS (all 10 tests)

**Step 5: Commit**

```bash
git add lib/utils/portfolio.ts __tests__/unit/portfolio-calculations.test.ts
git commit -m "feat: add portfolio P/L calculation utilities"
```

---

## Task 2: Holding Type Definition

Create TypeScript interface for holdings

**Files:**
- Create: `lib/types/portfolio.ts`

**Step 1: Create holding interface**

```typescript
// lib/types/portfolio.ts

export interface Holding {
  id: string;           // UUID for unique identification
  ticker: string;       // Stock symbol (uppercase)
  quantity: number;     // Number of shares (supports decimals)
  avgCost: number;      // Average cost per share in USD
  addedDate: string;    // ISO 8601 date (YYYY-MM-DD)
}
```

**Step 2: Commit**

```bash
git add lib/types/portfolio.ts
git commit -m "feat: add Holding type definition"
```

---

## Task 3: usePortfolio Hook

Create hook for portfolio state management

**Files:**
- Create: `lib/hooks/usePortfolio.ts`

**Step 1: Write the hook**

```typescript
// lib/hooks/usePortfolio.ts
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
```

**Step 2: Install uuid dependency**

Run: `npm install uuid @types/uuid`

**Step 3: Commit**

```bash
git add lib/hooks/usePortfolio.ts package.json package-lock.json
git commit -m "feat: add usePortfolio hook for state management"
```

---

## Task 4: Portfolio Summary Cards

Create summary cards for total value, gain/loss, return

**Files:**
- Create: `components/portfolio/PortfolioSummary.tsx`
- Create: `components/portfolio/SummaryCard.tsx`

**Step 1: Create SummaryCard component**

```typescript
// components/portfolio/SummaryCard.tsx
interface SummaryCardProps {
  label: string;
  value: string;
  valueColor?: 'green' | 'red' | 'gray';
  icon?: React.ReactNode;
}

export function SummaryCard({ label, value, valueColor = 'gray', icon }: SummaryCardProps) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-500',
    red: 'text-red-600 dark:text-red-500',
    gray: 'text-gray-900 dark:text-white',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        {icon && <span className={colorClasses[valueColor]}>{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${colorClasses[valueColor]}`}>{value}</p>
    </div>
  );
}
```

**Step 2: Create PortfolioSummary component**

```typescript
// components/portfolio/PortfolioSummary.tsx
import { SummaryCard } from './SummaryCard';
import type { PortfolioTotals } from '@/lib/utils/portfolio';

interface PortfolioSummaryProps {
  totals: PortfolioTotals;
  isLoading?: boolean;
}

export function PortfolioSummary({ totals, isLoading }: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const gainLossColor = totals.totalGainLoss >= 0 ? 'green' : 'red';
  const arrow = totals.totalGainLoss >= 0 ? '↑' : '↓';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <SummaryCard
        label="Total Value"
        value={formatCurrency(totals.totalValue)}
      />
      <SummaryCard
        label="Total Gain/Loss"
        value={formatCurrency(totals.totalGainLoss)}
        valueColor={gainLossColor}
        icon={arrow}
      />
      <SummaryCard
        label="Portfolio Return"
        value={formatPercent(totals.portfolioReturn)}
        valueColor={gainLossColor}
        icon={arrow}
      />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/portfolio/SummaryCard.tsx components/portfolio/PortfolioSummary.tsx
git commit -m "feat: add portfolio summary cards"
```

---

## Task 5: Holdings Table Component

Create table to display holdings with P/L

**Files:**
- Create: `components/portfolio/HoldingsTable.tsx`
- Create: `components/portfolio/HoldingRow.tsx`

**Step 1: Create HoldingRow component**

```typescript
// components/portfolio/HoldingRow.tsx
import type { Holding } from '@/lib/types/portfolio';
import type { HoldingPnLResult } from '@/lib/utils/portfolio';

interface HoldingRowProps {
  holding: Holding;
  currentPrice: number | null;
  pnl: HoldingPnLResult | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HoldingRow({ holding, currentPrice, pnl, onEdit, onDelete }: HoldingRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(value);
  };

  const gainLossColor = pnl && pnl.gainLoss >= 0
    ? 'text-green-600 dark:text-green-500'
    : 'text-red-600 dark:text-red-500';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
        {holding.ticker}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {formatNumber(holding.quantity)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {formatCurrency(holding.avgCost)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {currentPrice !== null ? formatCurrency(currentPrice) : 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {pnl ? formatCurrency(pnl.currentValue) : 'N/A'}
      </td>
      <td className={`px-4 py-3 text-sm text-right font-medium ${gainLossColor}`}>
        {pnl ? (
          <div>
            <div>{formatCurrency(pnl.gainLoss)}</div>
            <div className="text-xs">
              {pnl.gainLossPercent >= 0 ? '+' : ''}
              {pnl.gainLossPercent.toFixed(2)}%
            </div>
          </div>
        ) : (
          'N/A'
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        <button
          onClick={() => onEdit(holding.id)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 mr-3"
          aria-label={`Edit ${holding.ticker}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(holding.id)}
          className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
          aria-label={`Delete ${holding.ticker}`}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
```

**Step 2: Create HoldingsTable component**

```typescript
// components/portfolio/HoldingsTable.tsx
import { HoldingRow } from './HoldingRow';
import type { Holding } from '@/lib/types/portfolio';
import type { HoldingPnLResult } from '@/lib/utils/portfolio';

interface HoldingsTableProps {
  holdings: Holding[];
  prices: Map<string, number>;
  pnlData: Map<string, HoldingPnLResult>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HoldingsTable({ holdings, prices, pnlData, onEdit, onDelete }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No holdings yet. Add your first holding to start tracking your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ticker
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Avg Cost
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Current Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Current Value
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Gain/Loss
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {holdings.map(holding => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              currentPrice={prices.get(holding.ticker) ?? null}
              pnl={pnlData.get(holding.id) ?? null}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/portfolio/HoldingRow.tsx components/portfolio/HoldingsTable.tsx
git commit -m "feat: add holdings table component"
```

---

## Task 6: Add/Edit Holding Modal

Create modal for adding and editing holdings

**Files:**
- Create: `components/portfolio/HoldingModal.tsx`

**Step 1: Create modal component**

```typescript
// components/portfolio/HoldingModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import type { Holding } from '@/lib/types/portfolio';

interface HoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holding: Omit<Holding, 'id'>) => void;
  editingHolding?: Holding | null;
}

export function HoldingModal({ isOpen, onClose, onSave, editingHolding }: HoldingModalProps) {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [addedDate, setAddedDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingHolding) {
      setTicker(editingHolding.ticker);
      setQuantity(editingHolding.quantity.toString());
      setAvgCost(editingHolding.avgCost.toString());
      setAddedDate(editingHolding.addedDate);
    } else {
      // Reset form for new holding
      setTicker('');
      setQuantity('');
      setAvgCost('');
      setAddedDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [editingHolding, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedTicker = normalizeTicker(ticker);

    // Validation
    if (!validateTicker(normalizedTicker)) {
      setError('Invalid ticker symbol');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const cost = parseFloat(avgCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Average cost must be greater than 0');
      return;
    }

    try {
      onSave({
        ticker: normalizedTicker,
        quantity: qty,
        avgCost: cost,
        addedDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save holding');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {editingHolding ? 'Edit Holding' : 'Add Holding'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticker
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="AAPL"
              required
              disabled={!!editingHolding}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="10.5"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Average Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="150.25"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Added
            </label>
            <input
              type="date"
              value={addedDate}
              onChange={(e) => setAddedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingHolding ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/portfolio/HoldingModal.tsx
git commit -m "feat: add holding modal for add/edit"
```

---

## Task 7: Allocation Pie Chart

Create pie chart showing portfolio allocation

**Files:**
- Create: `components/portfolio/AllocationChart.tsx`

**Step 1: Install recharts**

Run: `npm install recharts`

**Step 2: Create allocation chart component**

```typescript
// components/portfolio/AllocationChart.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationData {
  ticker: string;
  value: number;
  percentage: number;
}

interface AllocationChartProps {
  data: AllocationData[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function AllocationChart({ data }: AllocationChartProps) {
  if (data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
    name: item.ticker,
    value: item.value,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Portfolio Allocation
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/portfolio/AllocationChart.tsx package.json package-lock.json
git commit -m "feat: add allocation pie chart"
```

---

## Task 8: Portfolio Tab Component

Create main portfolio tab integrating all components

**Files:**
- Create: `components/portfolio/PortfolioTab.tsx`

**Step 1: Create portfolio tab**

```typescript
// components/portfolio/PortfolioTab.tsx
'use client';

import { useState, useMemo } from 'react';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { usePrices } from '@/lib/hooks/usePrices';
import { calculateHoldingPnL, calculatePortfolioTotals, calculateAllocation } from '@/lib/utils/portfolio';
import { PortfolioSummary } from './PortfolioSummary';
import { HoldingsTable } from './HoldingsTable';
import { HoldingModal } from './HoldingModal';
import { AllocationChart } from './AllocationChart';
import type { Holding } from '@/lib/types/portfolio';

export function PortfolioTab() {
  const { holdings, addHolding, updateHolding, removeHolding } = usePortfolio();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch current prices for all holdings
  const priceQueries = holdings.map(holding =>
    usePrices(holding.ticker, '1D')
  );

  const isLoadingPrices = priceQueries.some(q => q.isLoading);

  // Build price map
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((holding, index) => {
      const query = priceQueries[index];
      if (query.data && query.data.data.length > 0) {
        map.set(holding.ticker, query.data.data[0].close);
      }
    });
    return map;
  }, [holdings, priceQueries]);

  // Calculate P/L for each holding
  const pnlMap = useMemo(() => {
    const map = new Map();
    holdings.forEach(holding => {
      const currentPrice = priceMap.get(holding.ticker);
      if (currentPrice !== undefined) {
        const pnl = calculateHoldingPnL({
          quantity: holding.quantity,
          avgCost: holding.avgCost,
          currentPrice,
        });
        map.set(holding.id, pnl);
      }
    });
    return map;
  }, [holdings, priceMap]);

  // Calculate portfolio totals
  const totals = useMemo(() => {
    const holdingsWithPrices = holdings
      .map(h => ({
        quantity: h.quantity,
        avgCost: h.avgCost,
        currentPrice: priceMap.get(h.ticker) ?? h.avgCost,
      }))
      .filter(h => h.currentPrice !== undefined);

    return calculatePortfolioTotals(holdingsWithPrices);
  }, [holdings, priceMap]);

  // Calculate allocation
  const allocationData = useMemo(() => {
    const allocations = calculateAllocation(
      holdings.map(h => ({
        currentValue: pnlMap.get(h.id)?.currentValue ?? 0,
      })),
      totals.totalValue
    );

    return holdings.map((h, i) => ({
      ticker: h.ticker,
      value: pnlMap.get(h.id)?.currentValue ?? 0,
      percentage: allocations[i] ?? 0,
    }));
  }, [holdings, pnlMap, totals.totalValue]);

  const handleAddHolding = () => {
    setEditingHolding(null);
    setIsModalOpen(true);
  };

  const handleEditHolding = (id: string) => {
    const holding = holdings.find(h => h.id === id);
    if (holding) {
      setEditingHolding(holding);
      setIsModalOpen(true);
    }
  };

  const handleDeleteHolding = (id: string) => {
    if (deleteConfirm === id) {
      removeHolding(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleSaveHolding = (holdingData: Omit<Holding, 'id'>) => {
    if (editingHolding) {
      updateHolding(editingHolding.id, holdingData);
    } else {
      addHolding(holdingData);
    }
  };

  return (
    <div>
      <PortfolioSummary totals={totals} isLoading={isLoadingPrices} />

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {holdings.length} {holdings.length === 1 ? 'Holding' : 'Holdings'}
        </span>
        <button
          onClick={handleAddHolding}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Holding
        </button>
      </div>

      <HoldingsTable
        holdings={holdings}
        prices={priceMap}
        pnlData={pnlMap}
        onEdit={handleEditHolding}
        onDelete={handleDeleteHolding}
      />

      {holdings.length > 0 && (
        <AllocationChart data={allocationData} />
      )}

      <HoldingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHolding}
        editingHolding={editingHolding}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/portfolio/PortfolioTab.tsx
git commit -m "feat: add portfolio tab component"
```

---

## Task 9: Integrate Portfolio Tab into Dashboard

Add portfolio tab to main dashboard page

**Files:**
- Modify: `app/page.tsx:1-118`

**Step 1: Add tab state and portfolio import**

```typescript
// app/page.tsx
// Add to imports
import { PortfolioTab } from '@/components/portfolio/PortfolioTab';

// Add after existing state declarations (around line 27)
const [activeTab, setActiveTab] = useState<'watchlist' | 'portfolio'>('watchlist');
```

**Step 2: Add tab selector UI**

```typescript
// app/page.tsx
// Add after header, before ticker section (around line 43)

<div className="max-w-7xl mx-auto px-4 py-4">
  <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
    <button
      onClick={() => setActiveTab('watchlist')}
      className={`px-4 py-2 font-medium ${
        activeTab === 'watchlist'
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-gray-600 dark:text-gray-400'
      }`}
    >
      Watchlist
    </button>
    <button
      onClick={() => setActiveTab('portfolio')}
      className={`px-4 py-2 font-medium ${
        activeTab === 'portfolio'
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-gray-600 dark:text-gray-400'
      }`}
    >
      Portfolio
    </button>
  </div>
</div>
```

**Step 3: Conditionally render tabs**

```typescript
// app/page.tsx
// Wrap existing content in conditional (around line 44)

{activeTab === 'watchlist' && (
  <>
    {/* Existing ticker section, charts, financials, news */}
  </>
)}

{activeTab === 'portfolio' && (
  <section className="max-w-7xl mx-auto px-4">
    <PortfolioTab />
  </section>
)}
```

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate portfolio tab into dashboard"
```

---

## Task 10: E2E Testing

Create E2E test for portfolio flow

**Files:**
- Create: `__tests__/e2e/portfolio.spec.ts`

**Step 1: Write E2E test**

```typescript
// __tests__/e2e/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Portfolio Tracking', () => {
  test('complete portfolio management flow', async ({ page }) => {
    await page.goto('/');

    // Switch to Portfolio tab
    await page.click('button:has-text("Portfolio")');

    // Should show empty state
    await expect(page.locator('text=No holdings yet')).toBeVisible();

    // Click Add Holding
    await page.click('button:has-text("Add Holding")');

    // Fill form
    await page.fill('input[placeholder="AAPL"]', 'AAPL');
    await page.fill('input[placeholder="10.5"]', '10');
    await page.fill('input[placeholder="150.25"]', '150');

    // Submit
    await page.click('button:has-text("Add")');

    // Wait for modal to close
    await expect(page.locator('text=Add Holding').first()).not.toBeVisible();

    // Verify holding appears in table
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=10')).toBeVisible();

    // Verify summary cards update (should show non-zero values)
    await expect(page.locator('text=Total Value')).toBeVisible();

    // Edit holding
    await page.click('button[aria-label="Edit AAPL"]');
    await page.fill('input[placeholder="10.5"]', '15');
    await page.click('button:has-text("Update")');

    // Verify quantity updated
    await expect(page.locator('td:has-text("15")')).toBeVisible();

    // Delete holding
    await page.click('button[aria-label="Delete AAPL"]');

    // Should show empty state again
    await expect(page.locator('text=No holdings yet')).toBeVisible();
  });

  test('displays allocation chart with multiple holdings', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Portfolio")');

    // Add first holding
    await page.click('button:has-text("Add Holding")');
    await page.fill('input[placeholder="AAPL"]', 'AAPL');
    await page.fill('input[placeholder="10.5"]', '10');
    await page.fill('input[placeholder="150.25"]', '150');
    await page.click('button:has-text("Add")');

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Add second holding
    await page.click('button:has-text("Add Holding")');
    await page.fill('input[placeholder="AAPL"]', 'GOOGL');
    await page.fill('input[placeholder="10.5"]', '5');
    await page.fill('input[placeholder="150.25"]', '140');
    await page.click('button:has-text("Add")');

    // Verify allocation chart appears
    await expect(page.locator('text=Portfolio Allocation')).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All portfolio tests pass

**Step 3: Commit**

```bash
git add __tests__/e2e/portfolio.spec.ts
git commit -m "test: add E2E tests for portfolio"
```

---

## Task 11: Update Documentation

Update README and CLAUDE.md

**Files:**
- Modify: `README.md:1-112`
- Modify: `CLAUDE.md:1-102`

**Step 1: Update README features**

```markdown
<!-- README.md - Update Features section -->

## Features

- 📈 **Interactive Price Charts** - Candlestick charts with volume bars and moving averages (20/50/200-day SMAs)
- 💼 **Portfolio Tracking** - Track holdings, calculate P/L, visualize allocation
- 🔄 **Smart Comparison View** - Side-by-side fundamental metrics comparison
- 📊 **Financial Statements** - Income statements, balance sheets, and cash flow
- 📰 **News Feed** - Latest news with sentiment analysis
- 🌙 **Dark Mode** - Full dark mode support
- ⚡ **Fast** - Server-side caching and React Query
- 📱 **Responsive** - Works on mobile, tablet, and desktop
```

**Step 2: Add portfolio usage section**

```markdown
<!-- README.md - Add after Technical Analysis section -->

## Portfolio Tracking

Track your stock investments and monitor performance:

**Adding Holdings:**
1. Click "Portfolio" tab
2. Click "Add Holding"
3. Enter ticker, quantity, and average cost
4. Save

**Viewing Performance:**
- Total portfolio value
- Total gain/loss (dollar and percentage)
- Individual holding P/L
- Portfolio allocation (pie chart)

**Managing Holdings:**
- Edit quantity or cost by clicking "Edit"
- Delete holdings with confirmation
- Holdings persist across sessions (localStorage)

**Note:** Current prices refresh automatically every 5 minutes. P/L calculations are client-side for instant updates.
```

**Step 3: Update CLAUDE.md**

```markdown
<!-- CLAUDE.md - Add to Key Patterns section -->

### Portfolio State Management

**Pattern:**
```typescript
// Portfolio stored in localStorage
const { holdings, addHolding, updateHolding, removeHolding } = usePortfolio();

// Fetch current prices
const priceQueries = holdings.map(h => usePrices(h.ticker, '1D'));

// Calculate P/L
const pnl = calculateHoldingPnL({
  quantity: holding.quantity,
  avgCost: holding.avgCost,
  currentPrice: currentPrice,
});
```

**Data Flow:**
- Holdings stored in localStorage (`stock-dashboard-portfolio`)
- Current prices fetched on-demand
- P/L calculated client-side
- React Query caching applies (5min stale time)
```

**Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: update documentation with portfolio tracking"
```

---

## Task 12: Final Verification

Run all tests and verify production build

**Step 1: Run all unit tests**

Run: `npm run test:unit`
Expected: All tests pass (including new portfolio calculation tests)

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass

**Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Build for production**

Run: `npm run build`
Expected: Successful build

**Step 5: Manual verification**

Run: `npm run dev`
Test:
- [ ] Portfolio tab accessible
- [ ] Add holding modal opens and validates
- [ ] Holdings save to localStorage
- [ ] Summary cards show correct totals
- [ ] Holdings table displays all data
- [ ] Edit modal pre-fills data
- [ ] Delete requires confirmation (click twice)
- [ ] Allocation chart displays
- [ ] Dark mode works throughout
- [ ] Responsive on mobile

**Step 6: Commit**

```bash
git commit --allow-empty -m "chore: final verification complete - all tests passing"
```

---

## Execution Summary

**Total Tasks:** 12
**Estimated Time:** 4-5 hours

**Task Breakdown:**
1. P/L calculation utilities (35 min)
2. Holding type definition (5 min)
3. usePortfolio hook (25 min)
4. Portfolio summary cards (30 min)
5. Holdings table (40 min)
6. Add/Edit modal (35 min)
7. Allocation pie chart (25 min)
8. Portfolio tab integration (30 min)
9. Dashboard tab integration (20 min)
10. E2E testing (30 min)
11. Documentation (20 min)
12. Final verification (20 min)

**Success Criteria:**
- All unit tests passing (portfolio calculations)
- All E2E tests passing
- No TypeScript errors
- Production build successful
- Portfolio tab functional
- Add/edit/delete holdings works
- P/L calculations accurate
- Allocation chart displays
- Data persists across sessions
