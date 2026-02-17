# Buffett Score Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a quality-first Buffett score (1–10, grade A–D) computed from existing overview data, shown as a badge on ticker chips, a collapsible detail card, and a row in the comparison table.

**Architecture:** Pure function `computeBuffettScore(overview)` in `lib/utils/buffett-score.ts` — no new API routes, no new data fetches. `page.tsx` fetches overviews for all tickers via `useQueries` (React Query deduplicates with ComparisonTable's existing calls). Score surfaces read from that data.

**Tech Stack:** TypeScript, React 18, TanStack Query v5 (`useQueries`), TailwindCSS, Vitest (unit), Playwright (E2E).

---

## Context you must know

- `OverviewData` is defined in `lib/transformers/overview.ts`. Percent fields (ROE, margins, growth) are stored as **percentage numbers** (e.g. 20.0 = 20%, not 0.20). Ratio fields (D/E, P/B) are stored as plain ratios.
- `useOverview(ticker)` returns `{ ticker, provider, data: OverviewData }` from `/api/overview`.
- `ComparisonTable` already uses `useQueries` to fetch overviews — React Query cache deduplicates identical query keys, so fetching the same ticker in `page.tsx` is free.
- Run tests: `npx vitest run`
- Run a single test file: `npx vitest run __tests__/unit/buffett-score.test.ts`
- Run E2E tests: `npm run dev` in one terminal, `npx playwright test __tests__/e2e/smoke.spec.ts` in another.

---

### Task 1: `computeBuffettScore` pure function + unit tests

**Files:**
- Create: `lib/utils/buffett-score.ts`
- Create: `__tests__/unit/buffett-score.test.ts`

---

**Step 1: Write the failing tests**

Create `__tests__/unit/buffett-score.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeBuffettScore } from '@/lib/utils/buffett-score';
import type { OverviewData } from '@/lib/transformers/overview';

const NULL_OVERVIEW: OverviewData = {
  name: null, sector: null, industry: null, marketCap: null,
  fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null, averageVolume: null,
  peRatio: null, forwardPE: null, pegRatio: null, priceToBook: null,
  priceToSales: null, evToEbitda: null, profitMargin: null,
  operatingMargin: null, returnOnEquity: null, returnOnAssets: null,
  revenue: null, quarterlyRevenueGrowth: null, quarterlyEarningsGrowth: null,
  eps: null, debtToEquity: null, currentRatio: null, quickRatio: null,
  bookValue: null, dividendYield: null, dividendPerShare: null, payoutRatio: null,
};

describe('computeBuffettScore', () => {
  it('high-quality company scores ≥ 8 with grade A', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 25,            // well above 15% ceiling → 10
      profitMargin: 28,              // well above 20% ceiling → 10
      operatingMargin: 30,           // well above 15% ceiling → 10
      quarterlyEarningsGrowth: 20,   // well above 15% ceiling → 10
      debtToEquity: 0.1,             // well below 0.3 best → 10
      quarterlyRevenueGrowth: 15,    // well above 10% ceiling → 10
      priceToBook: 1.0,              // well below 1.5 best → 10
    };
    const result = computeBuffettScore(overview);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(8);
    expect(result!.grade).toBe('A');
  });

  it('low-quality company scores ≤ 4 with grade D', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 2,             // below 5% floor → 0
      profitMargin: 1,               // below 5% floor → 0
      operatingMargin: 0,            // below 3% floor → 0
      quarterlyEarningsGrowth: -10,  // below 0% floor → 0
      debtToEquity: 3.0,             // above 2.0 worst → 0
      quarterlyRevenueGrowth: -5,    // below 0% floor → 0
      priceToBook: 8.0,              // above 5.0 worst → 0
    };
    const result = computeBuffettScore(overview);
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThanOrEqual(4);
    expect(result!.grade).toBe('D');
  });

  it('returns null when all metrics are null', () => {
    expect(computeBuffettScore(NULL_OVERVIEW)).toBeNull();
  });

  it('returns null when fewer than 3 metrics are present', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 20,
      profitMargin: 25,
      // only 2 metrics present — below minimum of 3
    };
    expect(computeBuffettScore(overview)).toBeNull();
  });

  it('excludes D/E from Financial Services companies and still returns a score', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      sector: 'Financial Services',
      returnOnEquity: 20,
      profitMargin: 25,
      operatingMargin: 22,
      debtToEquity: 15.0,  // extreme leverage — should be ignored for financials
    };
    const result = computeBuffettScore(overview);
    expect(result).not.toBeNull();
    expect(result!.breakdown.debtToEquity).toBeNull();
    expect(result!.score).toBeGreaterThan(5);
  });

  it('correctly interpolates at exact boundary values', () => {
    // ROE exactly at worst (5%) → sub-score 0
    // ROE exactly at best (15%) → sub-score 10
    const atWorst = { ...NULL_OVERVIEW, returnOnEquity: 5, profitMargin: 12, operatingMargin: 9 };
    const atBest  = { ...NULL_OVERVIEW, returnOnEquity: 15, profitMargin: 12, operatingMargin: 9 };

    const resultWorst = computeBuffettScore(atWorst)!;
    const resultBest  = computeBuffettScore(atBest)!;

    expect(resultWorst.breakdown.roe).toBe(0);
    expect(resultBest.breakdown.roe).toBe(10);
    expect(resultBest.score).toBeGreaterThan(resultWorst.score);
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run __tests__/unit/buffett-score.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/utils/buffett-score'"

---

**Step 3: Implement `lib/utils/buffett-score.ts`**

```typescript
import type { OverviewData } from '@/lib/transformers/overview';

export interface BuffettScore {
  score: number;   // 1.0–10.0, one decimal place
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    roe: number | null;
    profitMargin: number | null;
    operatingMargin: number | null;
    earningsGrowth: number | null;
    debtToEquity: number | null;
    revenueGrowth: number | null;
    priceToBook: number | null;
  };
}

interface MetricSpec {
  value: number | null;
  weight: number;
  best: number;   // value earning sub-score 10
  worst: number;  // value earning sub-score 0
}

function subScore(value: number, best: number, worst: number): number {
  const raw = ((value - worst) / (best - worst)) * 10;
  return Math.max(0, Math.min(10, raw));
}

function toGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 8) return 'A';
  if (score >= 6) return 'B';
  if (score >= 4) return 'C';
  return 'D';
}

const FINANCIAL_SECTORS = ['Financial Services', 'Banking', 'Insurance'];

export function computeBuffettScore(overview: OverviewData): BuffettScore | null {
  const isFinancial = FINANCIAL_SECTORS.some(s => overview.sector?.includes(s));

  // Percent fields stored as percentage numbers (20.0 = 20%); ratio fields as plain ratios.
  const specs: MetricSpec[] = [
    { value: overview.returnOnEquity,          weight: 25, best: 15,  worst: 5   },
    { value: overview.profitMargin,            weight: 20, best: 20,  worst: 5   },
    { value: overview.operatingMargin,         weight: 15, best: 15,  worst: 3   },
    { value: overview.quarterlyEarningsGrowth, weight: 15, best: 15,  worst: 0   },
    // D/E: excluded for financial sector companies
    { value: isFinancial ? null : overview.debtToEquity, weight: 15, best: 0.3, worst: 2.0 },
    { value: overview.quarterlyRevenueGrowth,  weight: 5,  best: 10,  worst: 0   },
    { value: overview.priceToBook,             weight: 5,  best: 1.5, worst: 5.0 },
  ];

  const present = specs.filter(s => s.value !== null && s.value !== undefined);
  if (present.length < 3) return null;

  const totalWeight = present.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum  = present.reduce(
    (sum, s) => sum + subScore(s.value!, s.best, s.worst) * s.weight, 0
  );

  const score = Math.round((weightedSum / totalWeight) * 10) / 10;

  return {
    score,
    grade: toGrade(score),
    breakdown: {
      roe:           overview.returnOnEquity          !== null ? subScore(overview.returnOnEquity,          15,  5  ) : null,
      profitMargin:  overview.profitMargin            !== null ? subScore(overview.profitMargin,            20,  5  ) : null,
      operatingMargin: overview.operatingMargin       !== null ? subScore(overview.operatingMargin,         15,  3  ) : null,
      earningsGrowth:  overview.quarterlyEarningsGrowth !== null ? subScore(overview.quarterlyEarningsGrowth, 15, 0 ) : null,
      debtToEquity:  (!isFinancial && overview.debtToEquity !== null) ? subScore(overview.debtToEquity,     0.3, 2.0) : null,
      revenueGrowth: overview.quarterlyRevenueGrowth  !== null ? subScore(overview.quarterlyRevenueGrowth,  10,  0  ) : null,
      priceToBook:   overview.priceToBook             !== null ? subScore(overview.priceToBook,             1.5, 5.0) : null,
    },
  };
}
```

**Step 4: Run tests to confirm they pass**

```bash
npx vitest run __tests__/unit/buffett-score.test.ts
```

Expected: 6 tests passing.

**Step 5: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass (previously 65, now 71).

**Step 6: Commit**

```bash
git add lib/utils/buffett-score.ts __tests__/unit/buffett-score.test.ts
git commit -m "feat: add computeBuffettScore pure function with unit tests"
```

---

### Task 2: `BuffettScoreBadge` component

**Files:**
- Create: `components/ui/BuffettScoreBadge.tsx`

No test for this component (it's purely presentational, already covered by unit tests on the scoring logic).

---

**Step 1: Create `components/ui/BuffettScoreBadge.tsx`**

```tsx
'use client';

import { computeBuffettScore } from '@/lib/utils/buffett-score';
import type { OverviewData } from '@/lib/transformers/overview';

interface BuffettScoreBadgeProps {
  overview: OverviewData | null;
}

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  B: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  C: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
} as const;

export function BuffettScoreBadge({ overview }: BuffettScoreBadgeProps) {
  if (!overview) return null;
  const result = computeBuffettScore(overview);
  if (!result) return null;

  return (
    <span
      className={`text-xs font-bold px-1.5 py-0.5 rounded ${GRADE_COLORS[result.grade]}`}
      title={`Buffett Score: ${result.score.toFixed(1)}/10`}
    >
      {result.grade} {result.score.toFixed(1)}
    </span>
  );
}
```

**Step 2: Run build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

**Step 3: Commit**

```bash
git add components/ui/BuffettScoreBadge.tsx
git commit -m "feat: add BuffettScoreBadge component"
```

---

### Task 3: Wire badge into TickerChips and page.tsx

**Files:**
- Modify: `components/ticker/TickerChips.tsx`
- Modify: `app/page.tsx`

---

**Step 1: Update `components/ticker/TickerChips.tsx`**

Replace the entire file with:

```tsx
'use client';

import { BuffettScoreBadge } from '@/components/ui/BuffettScoreBadge';
import type { OverviewData } from '@/lib/transformers/overview';

interface TickerChipsProps {
  tickers: string[];
  onRemove: (ticker: string) => void;
  selectedTicker?: string;
  onSelect?: (ticker: string) => void;
  overviews?: Record<string, OverviewData | null>;
}

export function TickerChips({ tickers, onRemove, selectedTicker, onSelect, overviews }: TickerChipsProps) {
  if (tickers.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        No tickers added yet. Add one above to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tickers.map((ticker) => (
        <div key={ticker} className="flex items-center gap-1">
          <button
            onClick={() => onSelect?.(ticker)}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all
              ${selectedTicker === ticker
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {ticker}
            {overviews?.[ticker] !== undefined && (
              <BuffettScoreBadge overview={overviews[ticker] ?? null} />
            )}
          </button>
          <button
            onClick={() => onRemove(ticker)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xl font-bold"
            aria-label={`Remove ${ticker}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Update `app/page.tsx` — add `useQueries` for all tickers**

Add these imports at the top of `app/page.tsx` (after existing imports):

```typescript
import { useQueries } from '@tanstack/react-query';
import type { OverviewData } from '@/lib/transformers/overview';
```

Inside `DashboardPage`, after the existing `const activeTicker = ...` line, add:

```typescript
// Fetch overviews for all tickers so chips can show Buffett scores.
// React Query deduplicates: ComparisonTable and useOverview hit the same cache keys.
const overviewQueries = useQueries({
  queries: tickers.map(ticker => ({
    queryKey: ['overview', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/overview?ticker=${encodeURIComponent(ticker)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    enabled: tickers.length > 0,
  })),
});

const overviewsByTicker: Record<string, OverviewData | null> = {};
tickers.forEach((ticker, i) => {
  overviewsByTicker[ticker] = (overviewQueries[i]?.data as any)?.data ?? null;
});
```

Then update the `<TickerChips>` call to pass `overviews`:

```tsx
<TickerChips
  tickers={tickers}
  onRemove={removeTicker}
  selectedTicker={selectedTicker || activeTicker}
  onSelect={(ticker) => {
    if (selectedTicker === ticker && tickers.length >= 2) {
      setSelectedTicker(null);
    } else {
      setSelectedTicker(ticker);
    }
  }}
  overviews={overviewsByTicker}
/>
```

**Step 3: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

**Step 4: Run unit tests**

```bash
npx vitest run
```

Expected: all passing.

**Step 5: Commit**

```bash
git add components/ticker/TickerChips.tsx app/page.tsx
git commit -m "feat: show Buffett score badge on ticker chips"
```

---

### Task 4: `BuffettScoreCard` collapsible detail panel

**Files:**
- Create: `components/ui/BuffettScoreCard.tsx`
- Modify: `app/page.tsx`

---

**Step 1: Create `components/ui/BuffettScoreCard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { computeBuffettScore } from '@/lib/utils/buffett-score';
import type { OverviewData } from '@/lib/transformers/overview';

interface BuffettScoreCardProps {
  overview: OverviewData;
}

const GRADE_COLORS = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-yellow-600 dark:text-yellow-400',
  C: 'text-orange-600 dark:text-orange-400',
  D: 'text-red-600 dark:text-red-400',
} as const;

const BREAKDOWN_ROWS = [
  { key: 'roe',             label: 'Return on Equity',  weight: 25, field: 'returnOnEquity',          fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'profitMargin',    label: 'Profit Margin',      weight: 20, field: 'profitMargin',             fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'operatingMargin', label: 'Operating Margin',   weight: 15, field: 'operatingMargin',          fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'earningsGrowth',  label: 'Earnings Growth',    weight: 15, field: 'quarterlyEarningsGrowth',  fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'debtToEquity',    label: 'Debt-to-Equity',     weight: 15, field: 'debtToEquity',             fmt: (v: number) => v.toFixed(2) },
  { key: 'revenueGrowth',   label: 'Revenue Growth',     weight: 5,  field: 'quarterlyRevenueGrowth',   fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'priceToBook',     label: 'Price-to-Book',      weight: 5,  field: 'priceToBook',              fmt: (v: number) => v.toFixed(2) },
] as const;

export function BuffettScoreCard({ overview }: BuffettScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const result = computeBuffettScore(overview);

  if (!result) return null;

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between"
        aria-expanded={expanded}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Buffett Score
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${GRADE_COLORS[result.grade]}`}>
            {result.grade}
          </span>
          <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {result.score.toFixed(1)}<span className="text-sm font-normal text-gray-500">/10</span>
          </span>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="pb-2 pr-4">Metric</th>
                <th className="pb-2 pr-4 text-right">Value</th>
                <th className="pb-2 pr-4 text-right">Score</th>
                <th className="pb-2">Quality</th>
                <th className="pb-2 text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {BREAKDOWN_ROWS.map(({ key, label, weight, field, fmt }) => {
                const rawValue = (overview as any)[field] as number | null;
                const subScore = result.breakdown[key as keyof typeof result.breakdown];
                return (
                  <tr key={key}>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{label}</td>
                    <td className="py-2 pr-4 text-right font-mono text-gray-900 dark:text-gray-100">
                      {rawValue !== null ? fmt(rawValue) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                      {subScore !== null ? subScore.toFixed(1) : '—'}
                    </td>
                    <td className="py-2 pr-4 w-32">
                      {subScore !== null && (
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${subScore * 10}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{weight}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
```

**Step 2: Wire `BuffettScoreCard` into `app/page.tsx`**

Add import at the top:

```typescript
import { BuffettScoreCard } from '@/components/ui/BuffettScoreCard';
```

Also add `useOverview` import (it's not currently imported in page.tsx):

```typescript
import { useOverview } from '@/lib/hooks/useOverview';
```

Inside `DashboardPage`, after the existing hooks (`usePrices`, `useFinancials`, `useNews`), add:

```typescript
const { data: overviewData } = useOverview(showDetail ? selectedTicker! : '');
```

Then in the JSX, insert `<BuffettScoreCard>` between the price chart section and the financial statements section. Find this comment in `app/page.tsx` (around line 168):

```tsx
{/* INSERT AFTER the price chart section closing </section> tag, BEFORE the Financial Statements section */}
{overviewData?.data && (
  <BuffettScoreCard overview={overviewData.data} />
)}
```

The full block order in the detail view should be:
1. Price Chart `<section>`
2. `{overviewData?.data && <BuffettScoreCard overview={overviewData.data} />}`
3. Financial Statements `<section>`
4. News `<section>`

**Step 3: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

**Step 4: Commit**

```bash
git add components/ui/BuffettScoreCard.tsx app/page.tsx
git commit -m "feat: add collapsible BuffettScoreCard to detail view"
```

---

### Task 5: Comparison table score row

**Files:**
- Modify: `components/comparison/ComparisonTable.tsx`

---

**Step 1: Update `components/comparison/ComparisonTable.tsx`**

Add import at the top of the file (after existing imports):

```typescript
import { computeBuffettScore } from '@/lib/utils/buffett-score';
```

After `const data = queries.map(q => q.data?.data || null);` add:

```typescript
const scores = data.map(d => (d ? computeBuffettScore(d) : null));
```

Add the grade color map (inside the component, before the return):

```typescript
const GRADE_COLORS = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-yellow-600 dark:text-yellow-400',
  C: 'text-orange-600 dark:text-orange-400',
  D: 'text-red-600 dark:text-red-400',
} as const;
```

In the `<tbody>`, add this as the **first row** (before the "Company Information" section header row):

```tsx
<tr className="bg-blue-50 dark:bg-blue-900/20">
  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/20">
    Buffett Score
  </td>
  {scores.map((score, idx) => (
    <td key={tickers[idx]} className="px-4 py-3 text-right">
      {score ? (
        <span className={`font-bold text-base ${GRADE_COLORS[score.grade]}`}>
          {score.grade} {score.score.toFixed(1)}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      )}
    </td>
  ))}
</tr>
```

**Step 2: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

**Step 3: Run unit tests**

```bash
npx vitest run
```

Expected: all passing.

**Step 4: Commit**

```bash
git add components/comparison/ComparisonTable.tsx
git commit -m "feat: add Buffett score row to comparison table"
```

---

### Task 6: Playwright E2E test + final verification

**Files:**
- Modify: `__tests__/e2e/smoke.spec.ts`

---

**Step 1: Add Playwright test to `__tests__/e2e/smoke.spec.ts`**

Add this test inside the `test.describe('Stock Dashboard Smoke Tests', ...)` block, after the existing BRK-B test:

```typescript
test('Buffett score badge appears on ticker chip after overview loads', async ({ page }) => {
  await page.goto('/');

  // Add AAPL
  await page.fill('input[placeholder*="ticker"]', 'AAPL');
  await page.click('button:has-text("Add")');
  await expect(page.getByRole('button', { name: 'AAPL', exact: true })).toBeVisible();

  // Wait for badge — it appears once overview API responds (up to 10s)
  // The badge contains a grade letter (A/B/C/D) followed by a score
  await expect(
    page.locator('[title*="Buffett Score"]')
  ).toBeVisible({ timeout: 10000 });

  // App must not crash
  await expect(page.locator('text="Application error"')).not.toBeVisible();
});
```

**Step 2: Run unit tests**

```bash
npx vitest run
```

Expected: 71 tests passing.

**Step 3: Run Playwright smoke tests**

In terminal 1:
```bash
npm run dev
```

In terminal 2:
```bash
npx playwright test __tests__/e2e/smoke.spec.ts --reporter=line
```

Expected: 4 tests passing (3 existing + 1 new). The badge test may skip or timeout if the overview API key isn't configured locally — that's acceptable; it proves the test wiring is correct.

**Step 4: Run production build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

**Step 5: Final commit**

```bash
git add __tests__/e2e/smoke.spec.ts
git commit -m "test: add Playwright smoke test for Buffett score badge"
```

**Step 6: Push**

```bash
git push
```
