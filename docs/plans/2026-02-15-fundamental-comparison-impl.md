# Fundamental Comparison Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add intelligent comparison view that displays side-by-side fundamental metrics when 2+ tickers are selected

**Architecture:** Conditional rendering based on ticker count and selection state - fetch company overview data via new API route, display in comparison table component, auto-switch between detail and comparison views

**Tech Stack:** Next.js 16 API routes, Alpha Vantage OVERVIEW endpoint, React Query, TypeScript, Tailwind CSS 4

---

## Task 1: Overview Data Transformer

Create transformer for Alpha Vantage OVERVIEW API response

**Files:**
- Create: `lib/transformers/overview.ts`
- Test: `__tests__/unit/overview-transformer.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/unit/overview-transformer.test.ts
import { describe, it, expect } from 'vitest';
import { transformOverview, formatMetric } from '@/lib/transformers/overview';

describe('formatMetric', () => {
  it('should convert valid number string to number', () => {
    expect(formatMetric('123.45', 'number')).toBe(123.45);
  });

  it('should handle "None" as null', () => {
    expect(formatMetric('None', 'number')).toBeNull();
  });

  it('should handle undefined as null', () => {
    expect(formatMetric(undefined, 'number')).toBeNull();
  });

  it('should convert percent string to decimal', () => {
    expect(formatMetric('0.25', 'percent')).toBe(25);
  });

  it('should handle negative numbers', () => {
    expect(formatMetric('-15.5', 'number')).toBe(-15.5);
  });
});

describe('transformOverview', () => {
  it('should transform complete Alpha Vantage response', () => {
    const raw = {
      Symbol: 'AAPL',
      Name: 'Apple Inc',
      Sector: 'Technology',
      Industry: 'Consumer Electronics',
      MarketCapitalization: '3000000000000',
      '52WeekHigh': '199.62',
      '52WeekLow': '164.08',
      '50DayMovingAverage': '185.23',
      PERatio: '30.5',
      ForwardPE: '28.3',
      PEGRatio: '2.1',
      PriceToBookRatio: '45.2',
      PriceToSalesRatioTTM: '7.8',
      EVToEBITDA: '23.4',
      ProfitMargin: '0.25',
      OperatingMarginTTM: '0.30',
      ReturnOnEquityTTM: '1.47',
      ReturnOnAssetsTTM: '0.22',
      RevenueTTM: '383000000000',
      QuarterlyRevenueGrowthYOY: '0.02',
      QuarterlyEarningsGrowthYOY: '0.11',
      DilutedEPSTTM: '6.13',
      DebtToEquity: '1.96',
      CurrentRatio: '0.98',
      QuickRatio: '0.82',
      BookValue: '4.26',
      DividendYield: '0.0045',
      DividendPerShare: '0.96',
      PayoutRatio: '0.16',
    };

    const result = transformOverview(raw);

    expect(result).toEqual({
      name: 'Apple Inc',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 3000000000000,
      fiftyTwoWeekHigh: 199.62,
      fiftyTwoWeekLow: 164.08,
      averageVolume: null,
      peRatio: 30.5,
      forwardPE: 28.3,
      pegRatio: 2.1,
      priceToBook: 45.2,
      priceToSales: 7.8,
      evToEbitda: 23.4,
      profitMargin: 25,
      operatingMargin: 30,
      returnOnEquity: 147,
      returnOnAssets: 22,
      revenue: 383000000000,
      quarterlyRevenueGrowth: 2,
      quarterlyEarningsGrowth: 11,
      eps: 6.13,
      debtToEquity: 1.96,
      currentRatio: 0.98,
      quickRatio: 0.82,
      bookValue: 4.26,
      dividendYield: 0.45,
      dividendPerShare: 0.96,
      payoutRatio: 16,
    });
  });

  it('should handle missing fields gracefully', () => {
    const raw = {
      Symbol: 'TEST',
      Name: 'Test Company',
      Sector: 'None',
      PERatio: 'None',
      DividendYield: 'None',
    };

    const result = transformOverview(raw);

    expect(result.name).toBe('Test Company');
    expect(result.sector).toBeNull();
    expect(result.peRatio).toBeNull();
    expect(result.dividendYield).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test __tests__/unit/overview-transformer.test.ts`
Expected: FAIL with "Cannot find module '@/lib/transformers/overview'"

**Step 3: Write minimal implementation**

```typescript
// lib/transformers/overview.ts
export interface OverviewData {
  name: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  averageVolume: number | null;
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  revenue: number | null;
  quarterlyRevenueGrowth: number | null;
  quarterlyEarningsGrowth: number | null;
  eps: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  bookValue: number | null;
  dividendYield: number | null;
  dividendPerShare: number | null;
  payoutRatio: number | null;
}

export function formatMetric(
  value: string | undefined,
  type: 'number' | 'percent' | 'currency'
): number | null {
  if (!value || value === 'None' || value === '-') {
    return null;
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return null;
  }

  if (type === 'percent') {
    return num * 100;
  }

  return num;
}

export function transformOverview(raw: any): OverviewData {
  return {
    name: raw.Name || null,
    sector: raw.Sector === 'None' ? null : raw.Sector || null,
    industry: raw.Industry === 'None' ? null : raw.Industry || null,
    marketCap: formatMetric(raw.MarketCapitalization, 'number'),
    fiftyTwoWeekHigh: formatMetric(raw['52WeekHigh'], 'number'),
    fiftyTwoWeekLow: formatMetric(raw['52WeekLow'], 'number'),
    averageVolume: formatMetric(raw.Volume, 'number'),
    peRatio: formatMetric(raw.PERatio, 'number'),
    forwardPE: formatMetric(raw.ForwardPE, 'number'),
    pegRatio: formatMetric(raw.PEGRatio, 'number'),
    priceToBook: formatMetric(raw.PriceToBookRatio, 'number'),
    priceToSales: formatMetric(raw.PriceToSalesRatioTTM, 'number'),
    evToEbitda: formatMetric(raw.EVToEBITDA, 'number'),
    profitMargin: formatMetric(raw.ProfitMargin, 'percent'),
    operatingMargin: formatMetric(raw.OperatingMarginTTM, 'percent'),
    returnOnEquity: formatMetric(raw.ReturnOnEquityTTM, 'percent'),
    returnOnAssets: formatMetric(raw.ReturnOnAssetsTTM, 'percent'),
    revenue: formatMetric(raw.RevenueTTM, 'number'),
    quarterlyRevenueGrowth: formatMetric(raw.QuarterlyRevenueGrowthYOY, 'percent'),
    quarterlyEarningsGrowth: formatMetric(raw.QuarterlyEarningsGrowthYOY, 'percent'),
    eps: formatMetric(raw.DilutedEPSTTM, 'number'),
    debtToEquity: formatMetric(raw.DebtToEquity, 'number'),
    currentRatio: formatMetric(raw.CurrentRatio, 'number'),
    quickRatio: formatMetric(raw.QuickRatio, 'number'),
    bookValue: formatMetric(raw.BookValue, 'number'),
    dividendYield: formatMetric(raw.DividendYield, 'percent'),
    dividendPerShare: formatMetric(raw.DividendPerShare, 'number'),
    payoutRatio: formatMetric(raw.PayoutRatio, 'percent'),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test __tests__/unit/overview-transformer.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add lib/transformers/overview.ts __tests__/unit/overview-transformer.test.ts
git commit -m "feat: add overview data transformer with tests"
```

---

## Task 2: Alpha Vantage Provider - Add Overview Method

Extend Alpha Vantage provider to fetch company overview data

**Files:**
- Modify: `lib/providers/alpha-vantage.ts:1-237`
- Modify: `lib/providers/interfaces.ts:1-63`
- Test: Manual verification (API integration test)

**Step 1: Update interfaces**

```typescript
// lib/providers/interfaces.ts
// Add after INewsProvider interface

export interface IOverviewProvider {
  getOverview(ticker: string): Promise<OverviewData>;
}
```

**Step 2: Add method to AlphaVantageProvider**

```typescript
// lib/providers/alpha-vantage.ts
// Import the new types at top
import { transformOverview, type OverviewData } from '@/lib/transformers/overview';

// Add to class (after existing methods)
async getOverview(ticker: string): Promise<OverviewData> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is required');
  }

  const normalizedTicker = this.normalizeTicker(ticker);
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${normalizedTicker}&apikey=${apiKey}`;

  return this.circuitBreaker.execute(async () => {
    return withRetry(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message']) {
        throw new Error(`Invalid ticker: ${ticker}`);
      }

      if (data['Note']) {
        throw new Error('API rate limit exceeded');
      }

      return transformOverview(data);
    });
  });
}
```

**Step 3: Update class declaration**

```typescript
// lib/providers/alpha-vantage.ts
// Change class declaration line
export class AlphaVantageProvider implements IPriceProvider, IFinancialProvider, IOverviewProvider {
```

**Step 4: Commit**

```bash
git add lib/providers/alpha-vantage.ts lib/providers/interfaces.ts
git commit -m "feat: add overview method to AlphaVantage provider"
```

---

## Task 3: Overview API Route

Create API endpoint for fetching company overview data

**Files:**
- Create: `app/api/overview/route.ts`
- Create: `lib/cache/server-cache.ts` (extend existing)

**Step 1: Extend server cache utilities**

```typescript
// lib/cache/server-cache.ts
// Add after existing cache functions

export const cacheOverview = (ticker: string, fn: () => Promise<any>) =>
  unstable_cache(fn, [`overview-${ticker}`], {
    revalidate: 86400, // 24 hours
    tags: [`overview`, `ticker-${ticker}`],
  })();
```

**Step 2: Create overview API route**

```typescript
// app/api/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AlphaVantageProvider } from '@/lib/providers/alpha-vantage';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import { cacheOverview } from '@/lib/cache/server-cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawTicker = searchParams.get('ticker');

  if (!rawTicker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  const ticker = normalizeTicker(rawTicker);

  if (!validateTicker(ticker)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  try {
    const provider = new AlphaVantageProvider();

    const data = await cacheOverview(ticker, async () => {
      return await provider.getOverview(ticker);
    });

    return NextResponse.json({
      ticker,
      data,
    });
  } catch (error) {
    console.error('Overview API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.message.includes('Invalid ticker')) {
        return NextResponse.json(
          { error: 'Invalid or unknown ticker symbol' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}
```

**Step 3: Test API route manually**

Run: `npm run dev`
Test: `curl http://localhost:3000/api/overview?ticker=AAPL`
Expected: JSON response with overview data

**Step 4: Commit**

```bash
git add app/api/overview/route.ts lib/cache/server-cache.ts
git commit -m "feat: add overview API route with caching"
```

---

## Task 4: useOverview Hook

Create React Query hook for fetching overview data

**Files:**
- Create: `lib/hooks/useOverview.ts`

**Step 1: Create hook**

```typescript
// lib/hooks/useOverview.ts
import { useQuery } from '@tanstack/react-query';
import type { OverviewData } from '@/lib/transformers/overview';

interface OverviewResponse {
  ticker: string;
  data: OverviewData;
}

export function useOverview(ticker: string) {
  return useQuery<OverviewResponse>({
    queryKey: ['overview', ticker],
    queryFn: async () => {
      const response = await fetch(`/api/overview?ticker=${ticker}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch overview');
      }

      return response.json();
    },
    enabled: !!ticker && ticker.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 2,
  });
}
```

**Step 2: Commit**

```bash
git add lib/hooks/useOverview.ts
git commit -m "feat: add useOverview React Query hook"
```

---

## Task 5: ComparisonTable Component - Structure

Create comparison table component with skeleton structure

**Files:**
- Create: `components/comparison/ComparisonTable.tsx`
- Create: `components/comparison/MetricRow.tsx`

**Step 1: Create MetricRow component**

```typescript
// components/comparison/MetricRow.tsx
interface MetricRowProps {
  label: string;
  values: (string | number | null)[];
  type?: 'text' | 'number' | 'percent' | 'currency';
}

export function MetricRow({ label, values, type = 'text' }: MetricRowProps) {
  const formatValue = (value: string | number | null) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (type === 'percent') {
      return `${Number(value).toFixed(2)}%`;
    }

    if (type === 'currency') {
      return `$${Number(value).toFixed(2)}`;
    }

    if (type === 'number' && typeof value === 'number') {
      return value.toFixed(2);
    }

    return String(value);
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {label}
      </td>
      {values.map((value, idx) => (
        <td
          key={idx}
          className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap text-right"
        >
          {formatValue(value)}
        </td>
      ))}
    </tr>
  );
}
```

**Step 2: Create ComparisonTable skeleton**

```typescript
// components/comparison/ComparisonTable.tsx
'use client';

import { useOverview } from '@/lib/hooks/useOverview';
import { MetricRow } from './MetricRow';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { formatLargeNumber } from '@/lib/utils/formatting';

interface ComparisonTableProps {
  tickers: string[];
}

export function ComparisonTable({ tickers }: ComparisonTableProps) {
  // Fetch overview data for all tickers in parallel
  const queries = tickers.map(ticker => useOverview(ticker));

  const isLoading = queries.some(q => q.isLoading);
  const hasError = queries.some(q => q.error);

  if (isLoading) {
    return <LoadingSkeleton className="h-96" />;
  }

  if (hasError && queries.every(q => q.error)) {
    return <ErrorPanel error="Failed to load comparison data" />;
  }

  const data = queries.map(q => q.data?.data || null);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800">
              Metric
            </th>
            {tickers.map((ticker, idx) => (
              <th
                key={ticker}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {ticker}
                {queries[idx].error && (
                  <span className="ml-2 text-red-500">(Error)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {/* Company Info Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Company Information
            </td>
          </tr>
          <MetricRow
            label="Name"
            values={data.map(d => d?.name || null)}
          />
          <MetricRow
            label="Sector"
            values={data.map(d => d?.sector || null)}
          />
          <MetricRow
            label="Industry"
            values={data.map(d => d?.industry || null)}
          />
          <MetricRow
            label="Market Cap"
            values={data.map(d => d?.marketCap ? formatLargeNumber(d.marketCap) : null)}
          />
          <MetricRow
            label="52-Week High"
            values={data.map(d => d?.fiftyTwoWeekHigh || null)}
            type="currency"
          />
          <MetricRow
            label="52-Week Low"
            values={data.map(d => d?.fiftyTwoWeekLow || null)}
            type="currency"
          />

          {/* Valuation Section - will add in next task */}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/comparison/ComparisonTable.tsx components/comparison/MetricRow.tsx
git commit -m "feat: add ComparisonTable component skeleton"
```

---

## Task 6: ComparisonTable - Add All Metric Sections

Complete the comparison table with all metric groups

**Files:**
- Modify: `components/comparison/ComparisonTable.tsx:1-80`

**Step 1: Add remaining metric sections**

```typescript
// components/comparison/ComparisonTable.tsx
// Add after Company Information section, before closing </tbody>

{/* Valuation Metrics Section */}
<tr className="bg-gray-100 dark:bg-gray-800">
  <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
    Valuation Metrics
  </td>
</tr>
<MetricRow
  label="P/E Ratio"
  values={data.map(d => d?.peRatio || null)}
  type="number"
/>
<MetricRow
  label="Forward P/E"
  values={data.map(d => d?.forwardPE || null)}
  type="number"
/>
<MetricRow
  label="PEG Ratio"
  values={data.map(d => d?.pegRatio || null)}
  type="number"
/>
<MetricRow
  label="Price-to-Book"
  values={data.map(d => d?.priceToBook || null)}
  type="number"
/>
<MetricRow
  label="Price-to-Sales"
  values={data.map(d => d?.priceToSales || null)}
  type="number"
/>
<MetricRow
  label="EV/EBITDA"
  values={data.map(d => d?.evToEbitda || null)}
  type="number"
/>

{/* Profitability Section */}
<tr className="bg-gray-100 dark:bg-gray-800">
  <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
    Profitability
  </td>
</tr>
<MetricRow
  label="Profit Margin"
  values={data.map(d => d?.profitMargin || null)}
  type="percent"
/>
<MetricRow
  label="Operating Margin"
  values={data.map(d => d?.operatingMargin || null)}
  type="percent"
/>
<MetricRow
  label="Return on Equity (ROE)"
  values={data.map(d => d?.returnOnEquity || null)}
  type="percent"
/>
<MetricRow
  label="Return on Assets (ROA)"
  values={data.map(d => d?.returnOnAssets || null)}
  type="percent"
/>

{/* Growth Section */}
<tr className="bg-gray-100 dark:bg-gray-800">
  <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
    Growth
  </td>
</tr>
<MetricRow
  label="Revenue (TTM)"
  values={data.map(d => d?.revenue ? formatLargeNumber(d.revenue) : null)}
/>
<MetricRow
  label="Quarterly Revenue Growth"
  values={data.map(d => d?.quarterlyRevenueGrowth || null)}
  type="percent"
/>
<MetricRow
  label="Quarterly Earnings Growth"
  values={data.map(d => d?.quarterlyEarningsGrowth || null)}
  type="percent"
/>
<MetricRow
  label="EPS (Diluted TTM)"
  values={data.map(d => d?.eps || null)}
  type="currency"
/>

{/* Financial Health Section */}
<tr className="bg-gray-100 dark:bg-gray-800">
  <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
    Financial Health
  </td>
</tr>
<MetricRow
  label="Debt-to-Equity"
  values={data.map(d => d?.debtToEquity || null)}
  type="number"
/>
<MetricRow
  label="Current Ratio"
  values={data.map(d => d?.currentRatio || null)}
  type="number"
/>
<MetricRow
  label="Quick Ratio"
  values={data.map(d => d?.quickRatio || null)}
  type="number"
/>
<MetricRow
  label="Book Value Per Share"
  values={data.map(d => d?.bookValue || null)}
  type="currency"
/>

{/* Dividends Section */}
<tr className="bg-gray-100 dark:bg-gray-800">
  <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
    Dividends
  </td>
</tr>
<MetricRow
  label="Dividend Yield"
  values={data.map(d => d?.dividendYield || null)}
  type="percent"
/>
<MetricRow
  label="Dividend Per Share"
  values={data.map(d => d?.dividendPerShare || null)}
  type="currency"
/>
<MetricRow
  label="Payout Ratio"
  values={data.map(d => d?.payoutRatio || null)}
  type="percent"
/>
```

**Step 2: Commit**

```bash
git add components/comparison/ComparisonTable.tsx
git commit -m "feat: add all metric sections to comparison table"
```

---

## Task 7: Dashboard Page - View Switching Logic

Implement smart auto-switching between detail and comparison views

**Files:**
- Modify: `app/page.tsx:1-118`

**Step 1: Update imports**

```typescript
// app/page.tsx
// Add to imports at top
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { useEffect } from 'react'; // Add to existing import from 'react'
```

**Step 2: Add selection state and view logic**

```typescript
// app/page.tsx
// Add after existing state declarations (around line 27)

const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

// View decision logic
const showComparison = tickers.length >= 2 && !selectedTicker;
const showDetail = tickers.length >= 1 && selectedTicker;
const showEmpty = tickers.length === 0;

// Auto-select first ticker when added
useEffect(() => {
  if (tickers.length === 1 && !selectedTicker) {
    setSelectedTicker(tickers[0]);
  }
}, [tickers, selectedTicker]);

// Clear selection when going from 1 to 2+ tickers
useEffect(() => {
  const previousLength = tickers.length - 1;
  if (tickers.length >= 2 && selectedTicker && tickers.length > previousLength) {
    setSelectedTicker(null);
  }
}, [tickers.length]);
```

**Step 3: Update TickerChips selection handler**

```typescript
// app/page.tsx
// Update TickerChips component (around line 48)

<TickerChips
  tickers={tickers}
  onRemove={removeTicker}
  selectedTicker={selectedTicker || activeTicker}
  onSelect={(ticker) => {
    if (selectedTicker === ticker && tickers.length >= 2) {
      setSelectedTicker(null); // Deselect → back to comparison
    } else {
      setSelectedTicker(ticker); // Select → show detail
    }
  }}
/>
```

**Step 4: Update main content rendering**

```typescript
// app/page.tsx
// Replace content after TickerChips section (around line 58)

{showEmpty && (
  <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
    <p className="text-gray-600 dark:text-gray-400">
      No tickers added yet. Add one above to get started.
    </p>
  </section>
)}

{showComparison && (
  <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
      Comparison View
    </h2>
    <ComparisonTable tickers={tickers} />
  </section>
)}

{showDetail && (
  <>
    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedTicker} - Price Chart
        </h2>
        <RangeSelector selected={range} onChange={setRange} />
      </div>
      {/* Use selectedTicker instead of activeTicker */}
      {pricesLoading && <LoadingSkeleton className="h-96" />}
      {pricesError && <ErrorPanel error={pricesError.message} />}
      {priceData && (
        <div>
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Current: <span className="font-semibold">${priceData.meta.currentPrice.toFixed(2)}</span>
            </span>
            <span className={priceData.meta.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              Day: {priceData.meta.dayChange >= 0 ? '+' : ''}{priceData.meta.dayChange.toFixed(2)}%
            </span>
            <span className={priceData.meta.periodChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              Period: {priceData.meta.periodChange >= 0 ? '+' : ''}{priceData.meta.periodChange.toFixed(2)}%
            </span>
          </div>
          <PriceChart data={priceData.data} />
        </div>
      )}
    </section>

    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Financial Statements</h2>
      <FinancialTabs onTabChange={setStatement} />
      <div className="mt-4">
        {financialsLoading && <LoadingSkeleton className="h-64" />}
        {financialsError && <ErrorPanel error={financialsError.message} />}
        {financialData && (
          <>
            <FinancialTable data={financialData.data} />
            <div className="mt-4">
              <MetricsPanel metrics={financialData.metrics} />
            </div>
          </>
        )}
      </div>
    </section>

    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">News</h2>
        <NewsFilters selectedWindow={newsWindow} onWindowChange={setNewsWindow} />
      </div>
      {newsLoading && <LoadingSkeleton className="h-64" />}
      {newsError && <ErrorPanel error={newsError.message} />}
      {newsData && <NewsList articles={newsData.articles} />}
    </section>
  </>
)}
```

**Step 5: Update hook calls to use selectedTicker**

```typescript
// app/page.tsx
// Update hook calls (around line 29)

const activeTicker = selectedTicker || tickers[0] || '';

const { data: priceData, isLoading: pricesLoading, error: pricesError } = usePrices(
  showDetail ? selectedTicker! : '',
  range
);

const { data: financialData, isLoading: financialsLoading, error: financialsError } = useFinancials(
  showDetail ? selectedTicker! : '',
  statement
);

const { data: newsData, isLoading: newsLoading, error: newsError } = useNews(
  showDetail ? selectedTicker! : '',
  newsWindow
);
```

**Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement view switching between detail and comparison"
```

---

## Task 8: Update TickerChips - Visual Selection Indicator

Add visual indicator for selected ticker

**Files:**
- Modify: `components/ticker/TickerChips.tsx:1-45`

**Step 1: Update TickerChips styling**

```typescript
// components/ticker/TickerChips.tsx
// Update the chip button className (around line 20)

<button
  onClick={() => onSelect(ticker)}
  className={`
    px-3 py-1 rounded-full text-sm font-medium transition-all
    ${selectedTicker === ticker
      ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
    }
  `}
>
  {ticker}
</button>
```

**Step 2: Commit**

```bash
git add components/ticker/TickerChips.tsx
git commit -m "feat: add visual indicator for selected ticker"
```

---

## Task 9: Integration Testing

Test the complete comparison flow end-to-end

**Files:**
- Create: `__tests__/e2e/comparison.spec.ts`

**Step 1: Create E2E test**

```typescript
// __tests__/e2e/comparison.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Comparison Feature', () => {
  test('should switch from detail to comparison view when adding second ticker', async ({ page }) => {
    await page.goto('/');

    // Add first ticker
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');

    // Should show detail view
    await expect(page.locator('h2:has-text("AAPL - Price Chart")')).toBeVisible();

    // Add second ticker
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'GOOGL');
    await page.click('button:has-text("Add")');

    // Should auto-switch to comparison view
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Should show both tickers in table header
    await expect(page.locator('th:has-text("AAPL")')).toBeVisible();
    await expect(page.locator('th:has-text("GOOGL")')).toBeVisible();
  });

  test('should switch to detail view when clicking ticker chip', async ({ page }) => {
    await page.goto('/');

    // Add two tickers
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'MSFT');
    await page.click('button:has-text("Add")');

    // Should be in comparison view
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();

    // Click AAPL ticker chip
    await page.click('button:has-text("AAPL")');

    // Should switch to detail view for AAPL
    await expect(page.locator('h2:has-text("AAPL - Price Chart")')).toBeVisible();
    await expect(page.locator('h2:has-text("Comparison View")')).not.toBeVisible();
  });

  test('should return to comparison view when clicking selected chip again', async ({ page }) => {
    await page.goto('/');

    // Add two tickers
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'TSLA');
    await page.click('button:has-text("Add")');

    // Click AAPL to show detail
    await page.click('button:has-text("AAPL")');
    await expect(page.locator('h2:has-text("AAPL - Price Chart")')).toBeVisible();

    // Click AAPL again to return to comparison
    await page.click('button:has-text("AAPL")');
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();
  });

  test('should display comparison metrics', async ({ page }) => {
    await page.goto('/');

    // Add two tickers
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'GOOGL');
    await page.click('button:has-text("Add")');

    // Wait for comparison table to load
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();

    // Check for metric sections
    await expect(page.locator('td:has-text("Company Information")')).toBeVisible();
    await expect(page.locator('td:has-text("Valuation Metrics")')).toBeVisible();
    await expect(page.locator('td:has-text("Profitability")')).toBeVisible();
    await expect(page.locator('td:has-text("Growth")')).toBeVisible();
    await expect(page.locator('td:has-text("Financial Health")')).toBeVisible();
    await expect(page.locator('td:has-text("Dividends")')).toBeVisible();

    // Check for specific metrics
    await expect(page.locator('td:has-text("Market Cap")')).toBeVisible();
    await expect(page.locator('td:has-text("P/E Ratio")')).toBeVisible();
    await expect(page.locator('td:has-text("Profit Margin")')).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All 4 comparison tests pass

**Step 3: Commit**

```bash
git add __tests__/e2e/comparison.spec.ts
git commit -m "test: add E2E tests for comparison feature"
```

---

## Task 10: Update Documentation

Update README and CLAUDE.md with comparison feature details

**Files:**
- Modify: `README.md:1-112`
- Modify: `CLAUDE.md:1-102`

**Step 1: Update README features section**

```markdown
<!-- README.md - Update Features section (around line 7) -->

## Features

- 📈 **Interactive Price Charts** - Candlestick charts with multiple time ranges (1W-MAX)
- 🔄 **Smart Comparison View** - Side-by-side fundamental metrics comparison (auto-switches when 2+ tickers added)
- 📊 **Financial Statements** - Income statements, balance sheets, and cash flow with computed metrics
- 📰 **News Feed** - Latest news with sentiment analysis (positive/neutral/negative)
- 🌙 **Dark Mode** - Full dark mode support
- ⚡ **Fast** - Server-side caching and React Query for optimal performance
- 📱 **Responsive** - Works on mobile, tablet, and desktop
```

**Step 2: Add comparison usage section**

```markdown
<!-- README.md - Add after Sample Tickers section (around line 82) -->

## Using Comparison View

The dashboard intelligently switches between detail and comparison views:

1. **Add 1 ticker** → Detail view (charts, financials, news)
2. **Add 2+ tickers** → Auto-switch to comparison table
3. **Click any ticker chip** → View details for that ticker
4. **Click selected chip again** → Return to comparison view

**Comparison metrics include:**
- Company info (sector, industry, market cap)
- Valuation (P/E, P/B, PEG ratio, EV/EBITDA)
- Profitability (margins, ROE, ROA)
- Growth (revenue growth, earnings growth)
- Financial health (debt ratios, liquidity ratios)
- Dividends (yield, payout ratio)
```

**Step 3: Update CLAUDE.md architecture**

```markdown
<!-- CLAUDE.md - Add to Key Components section -->

### Comparison Feature Components

**`components/comparison/ComparisonTable.tsx`**
- Main comparison table component
- Fetches overview data for all tickers in parallel using `useOverview` hook
- Displays 6 metric sections with 27+ metrics
- Handles loading states, errors, and missing data gracefully

**`components/comparison/MetricRow.tsx`**
- Individual metric row component
- Formats values based on type (number, percent, currency)
- Shows "N/A" for missing data

**View Switching Logic (`app/page.tsx`):**
- `showComparison = tickers.length >= 2 && !selectedTicker`
- `showDetail = tickers.length >= 1 && selectedTicker`
- Auto-selects first ticker when added
- Clears selection when going from 1 to 2+ tickers
```

**Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: update README and CLAUDE.md with comparison feature"
```

---

## Task 11: Final Verification

Run all tests and verify production build

**Step 1: Run all unit tests**

Run: `npm run test:unit`
Expected: All tests pass (including new overview-transformer tests)

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (including new comparison tests)

**Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Build for production**

Run: `npm run build`
Expected: Successful build with no errors

**Step 5: Commit**

```bash
git commit --allow-empty -m "chore: final verification complete - all tests passing"
```

---

## Execution Summary

**Total Tasks:** 11
**Estimated Time:** 3-4 hours (following TDD methodology)

**Task Breakdown:**
1. Overview transformer with tests (30 min)
2. Extend provider (20 min)
3. API route (20 min)
4. React Query hook (10 min)
5. ComparisonTable skeleton (30 min)
6. Complete metric sections (30 min)
7. View switching logic (30 min)
8. Visual selection indicator (10 min)
9. E2E testing (30 min)
10. Documentation (20 min)
11. Final verification (20 min)

**Key Testing Points:**
- Unit tests for transformer (7 tests)
- E2E tests for view switching (4 tests)
- Manual API endpoint testing
- Production build verification

**Success Criteria:**
- All unit tests passing
- All E2E tests passing
- No TypeScript errors
- Production build successful
- Comparison view shows when 2+ tickers added
- Detail view shows when ticker selected
- All 27+ metrics displayed correctly
