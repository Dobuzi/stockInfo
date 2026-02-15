# Stock Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-quality stock dashboard that displays price charts, financial statements, and news for user-provided tickers.

**Architecture:** Next.js 15 App Router with server-side API routes that fetch from external providers (Alpha Vantage, FMP, Finnhub). Provider adapter pattern for easy swapping. TanStack Query for client-side state. lightweight-charts for visualization.

**Tech Stack:** Next.js 15, TypeScript 5.3+, TailwindCSS 3.4, lightweight-charts 4.x, TanStack Query 5.x, Vitest, Playwright

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize Next.js with TypeScript**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

When prompted:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Customize default import alias: Yes (@/*)

**Step 2: Install dependencies**

Run:
```bash
npm install @tanstack/react-query lightweight-charts
npm install -D vitest @vitejs/plugin-react playwright @playwright/test
npm install -D @testing-library/react @testing-library/jest-dom
```

**Step 3: Create environment variables template**

Create `.env.example`:
```bash
# API Keys
ALPHA_VANTAGE_API_KEY=your_key_here
FINANCIAL_MODELING_PREP_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here

# Provider Selection (optional)
PRICE_PROVIDER=alpha_vantage
FINANCIAL_PROVIDER=fmp
NEWS_PROVIDER=finnhub

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 4: Update .gitignore**

Add to `.gitignore`:
```
.env.local
.env*.local
```

**Step 5: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Step 6: Create test setup file**

Create `__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

**Step 7: Configure Playwright**

Run:
```bash
npx playwright install
```

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 8: Update package.json scripts**

Modify `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Step 9: Commit initial setup**

Run:
```bash
git add .
git commit -m "feat: initialize Next.js project with TypeScript and testing setup

- Next.js 15 with App Router
- TailwindCSS 3.4
- Vitest for unit tests
- Playwright for E2E tests
- Environment variables template

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Provider Interfaces

**Files:**
- Create: `lib/providers/interfaces.ts`
- Create: `__tests__/unit/validation.test.ts`

**Step 1: Write validation test**

Create `__tests__/unit/validation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';

describe('validateTicker', () => {
  it('accepts valid US ticker symbols', () => {
    expect(validateTicker('AAPL')).toBe(true);
    expect(validateTicker('TSLA')).toBe(true);
    expect(validateTicker('BRK.B')).toBe(true);
    expect(validateTicker('BRK-B')).toBe(true);
  });

  it('rejects invalid symbols', () => {
    expect(validateTicker('AAPL#')).toBe(false);
    expect(validateTicker('123')).toBe(false);
    expect(validateTicker('')).toBe(false);
    expect(validateTicker('A')).toBe(false); // too short
    expect(validateTicker('ABCDEF')).toBe(false); // too long
  });
});

describe('normalizeTicker', () => {
  it('converts to uppercase', () => {
    expect(normalizeTicker('aapl')).toBe('AAPL');
    expect(normalizeTicker('tsla')).toBe('TSLA');
  });

  it('preserves dots and hyphens', () => {
    expect(normalizeTicker('brk.b')).toBe('BRK.B');
    expect(normalizeTicker('brk-b')).toBe('BRK-B');
  });

  it('trims whitespace', () => {
    expect(normalizeTicker('  AAPL  ')).toBe('AAPL');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit validation`
Expected: FAIL - modules not found

**Step 3: Create validation utilities**

Create `lib/utils/validation.ts`:
```typescript
export function validateTicker(ticker: string): boolean {
  if (!ticker || ticker.length < 1 || ticker.length > 5) {
    return false;
  }

  // Allow uppercase letters, dots, and hyphens only
  const regex = /^[A-Z]+[.-]?[A-Z]*$/;
  return regex.test(ticker);
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit validation`
Expected: PASS

**Step 5: Define provider interfaces**

Create `lib/providers/interfaces.ts`:
```typescript
// Time range for price data
export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

// Price data point
export interface PriceData {
  ticker: string;
  date: string; // ISO 8601 format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Price provider interface
export interface IPriceProvider {
  getPrices(ticker: string, range: TimeRange): Promise<PriceData[]>;
  validateTicker(ticker: string): Promise<boolean>;
}

// Financial statement data
export interface FinancialStatement {
  ticker: string;
  fiscalDateEnding: string;
  reportedCurrency: string;
  [key: string]: string | number; // Dynamic fields like revenue, netIncome, etc.
}

// Financial provider interface
export interface IFinancialProvider {
  getIncomeStatement(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]>;
  getBalanceSheet(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]>;
  getCashFlow(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]>;
}

// News article
export interface NewsArticle {
  headline: string;
  source: string;
  url: string;
  publishedAt: string; // ISO 8601 format
  summary: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// News provider interface
export interface INewsProvider {
  getNews(ticker: string, windowDays: number): Promise<NewsArticle[]>;
}

// Provider factory return types
export type PriceProviderType = 'alpha_vantage';
export type FinancialProviderType = 'fmp' | 'alpha_vantage';
export type NewsProviderType = 'finnhub';
```

**Step 6: Commit provider interfaces**

Run:
```bash
git add lib/providers/interfaces.ts lib/utils/validation.ts __tests__/unit/validation.test.ts
git commit -m "feat: add provider interfaces and ticker validation

- Define interfaces for Price, Financial, and News providers
- Add ticker validation and normalization utilities
- Unit tests for validation logic

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Retry & Error Handling Utilities

**Files:**
- Create: `lib/utils/retry.ts`
- Create: `__tests__/unit/retry.test.ts`

**Step 1: Write retry tests**

Create `__tests__/unit/retry.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10); // 3 attempts, 10ms base delay
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(withRetry(fn, 3, 10)).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('CircuitBreaker', () => {
  it('allows requests when circuit is closed', async () => {
    const breaker = new CircuitBreaker();
    const fn = vi.fn().mockResolvedValue('success');

    const result = await breaker.execute(fn);
    expect(result).toBe('success');
  });

  it('opens circuit after threshold failures', async () => {
    const breaker = new CircuitBreaker(3, 100); // 3 failures, 100ms reset
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    // Trigger 3 failures
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    await expect(breaker.execute(fn)).rejects.toThrow('fail');

    // Circuit should be open now
    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker open');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit retry`
Expected: FAIL - module not found

**Step 3: Implement retry logic**

Create `lib/utils/retry.ts`:
```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry failed'); // Should never reach here
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailTime?: number;

  constructor(
    private readonly threshold = 5,
    private readonly resetTime = 60000 // 60 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker open - too many failures');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failures < this.threshold) {
      return false;
    }

    if (!this.lastFailTime) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastFailTime > this.resetTime) {
      this.reset();
      return false;
    }

    return true;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }

  private reset(): void {
    this.failures = 0;
    this.lastFailTime = undefined;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit retry`
Expected: PASS

**Step 5: Commit retry utilities**

Run:
```bash
git add lib/utils/retry.ts __tests__/unit/retry.test.ts
git commit -m "feat: add retry and circuit breaker utilities

- Exponential backoff retry with configurable attempts
- Circuit breaker to prevent API hammering
- Unit tests for retry and circuit breaker logic

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Formatting Utilities

**Files:**
- Create: `lib/utils/formatting.ts`
- Create: `__tests__/unit/formatting.test.ts`

**Step 1: Write formatting tests**

Create `__tests__/unit/formatting.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { formatLargeNumber, formatPercentage, formatCurrency } from '@/lib/utils/formatting';

describe('formatLargeNumber', () => {
  it('formats billions correctly', () => {
    expect(formatLargeNumber(394328000000)).toBe('$394.3B');
    expect(formatLargeNumber(1500000000)).toBe('$1.5B');
  });

  it('formats millions correctly', () => {
    expect(formatLargeNumber(52000000)).toBe('$52.0M');
    expect(formatLargeNumber(1500000)).toBe('$1.5M');
  });

  it('formats thousands correctly', () => {
    expect(formatLargeNumber(250000)).toBe('$250.0K');
    expect(formatLargeNumber(1500)).toBe('$1.5K');
  });

  it('formats small numbers correctly', () => {
    expect(formatLargeNumber(500)).toBe('$500');
  });

  it('handles negative numbers', () => {
    expect(formatLargeNumber(-1000000)).toBe('-$1.0M');
  });
});

describe('formatPercentage', () => {
  it('formats percentages with 1 decimal place', () => {
    expect(formatPercentage(0.123)).toBe('12.3%');
    expect(formatPercentage(0.056)).toBe('5.6%');
  });

  it('handles negative percentages', () => {
    expect(formatPercentage(-0.023)).toBe('-2.3%');
  });
});

describe('formatCurrency', () => {
  it('formats currency with 2 decimal places', () => {
    expect(formatCurrency(186.3)).toBe('$186.30');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('adds thousands separators', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit formatting`
Expected: FAIL - module not found

**Step 3: Implement formatting utilities**

Create `lib/utils/formatting.ts`:
```typescript
export function formatLargeNumber(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}$${(absValue / 1e3).toFixed(1)}K`;
  } else {
    return `${sign}$${absValue.toFixed(0)}`;
  }
}

export function formatPercentage(value: number): string {
  const percentage = value * 100;
  return `${percentage.toFixed(1)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit formatting`
Expected: PASS

**Step 5: Commit formatting utilities**

Run:
```bash
git add lib/utils/formatting.ts __tests__/unit/formatting.test.ts
git commit -m "feat: add formatting utilities

- Large number formatting (K/M/B suffixes)
- Percentage formatting
- Currency formatting with thousands separators
- Time ago formatting
- Unit tests for all formatters

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Server-Side Caching

**Files:**
- Create: `lib/cache/server-cache.ts`

**Step 1: Create caching wrapper**

Create `lib/cache/server-cache.ts`:
```typescript
import { unstable_cache } from 'next/cache';

export const cachePrices = (
  ticker: string,
  range: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`prices-${ticker}-${range}`], {
    revalidate: 300, // 5 minutes
    tags: [`prices`, `ticker-${ticker}`],
  })();

export const cacheFinancials = (
  ticker: string,
  statement: string,
  period: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`financials-${ticker}-${statement}-${period}`], {
    revalidate: 86400, // 24 hours
    tags: [`financials`, `ticker-${ticker}`],
  })();

export const cacheNews = (
  ticker: string,
  window: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`news-${ticker}-${window}`], {
    revalidate: 900, // 15 minutes
    tags: [`news`, `ticker-${ticker}`],
  })();
```

**Step 2: Commit caching utilities**

Run:
```bash
git add lib/cache/server-cache.ts
git commit -m "feat: add server-side caching utilities

- Cache wrapper using Next.js unstable_cache
- Different TTLs per data type (prices 5min, financials 24h, news 15min)
- Tagged caching for potential invalidation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Alpha Vantage Provider

**Files:**
- Create: `lib/providers/alpha-vantage.ts`

**Step 1: Implement Alpha Vantage price provider**

Create `lib/providers/alpha-vantage.ts`:
```typescript
import {
  IPriceProvider,
  IFinancialProvider,
  PriceData,
  TimeRange,
  FinancialStatement,
} from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

export class AlphaVantageProvider implements IPriceProvider, IFinancialProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async getPrices(ticker: string, range: TimeRange): Promise<PriceData[]> {
    // Alpha Vantage uses dots, not hyphens
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'TIME_SERIES_DAILY');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('outputsize', range === '5Y' || range === 'MAX' ? 'full' : 'compact');
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    if (data['Note']) {
      throw new Error('API rate limit exceeded');
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No price data available');
    }

    // Convert to our format
    const prices: PriceData[] = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      ticker,
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    }));

    // Filter by range
    return this.filterByRange(prices, range);
  }

  async validateTicker(ticker: string): Promise<boolean> {
    try {
      await this.getPrices(ticker, '1W');
      return true;
    } catch {
      return false;
    }
  }

  async getIncomeStatement(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'INCOME_STATEMENT');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    const statements = period === 'annual' ? data.annualReports : data.quarterlyReports;
    if (!statements) {
      throw new Error('No income statement data available');
    }

    return statements.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.fiscalDateEnding,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      totalRevenue: parseFloat(stmt.totalRevenue || '0'),
      grossProfit: parseFloat(stmt.grossProfit || '0'),
      operatingIncome: parseFloat(stmt.operatingIncome || '0'),
      netIncome: parseFloat(stmt.netIncome || '0'),
      ebitda: parseFloat(stmt.ebitda || '0'),
    }));
  }

  async getBalanceSheet(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'BALANCE_SHEET');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    const statements = period === 'annual' ? data.annualReports : data.quarterlyReports;
    if (!statements) {
      throw new Error('No balance sheet data available');
    }

    return statements.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.fiscalDateEnding,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      totalAssets: parseFloat(stmt.totalAssets || '0'),
      totalCurrentAssets: parseFloat(stmt.totalCurrentAssets || '0'),
      totalLiabilities: parseFloat(stmt.totalLiabilities || '0'),
      totalCurrentLiabilities: parseFloat(stmt.totalCurrentLiabilities || '0'),
      totalShareholderEquity: parseFloat(stmt.totalShareholderEquity || '0'),
    }));
  }

  async getCashFlow(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'CASH_FLOW');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    const statements = period === 'annual' ? data.annualReports : data.quarterlyReports;
    if (!statements) {
      throw new Error('No cash flow data available');
    }

    return statements.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.fiscalDateEnding,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      operatingCashflow: parseFloat(stmt.operatingCashflow || '0'),
      capitalExpenditures: parseFloat(stmt.capitalExpenditures || '0'),
      cashflowFromInvestment: parseFloat(stmt.cashflowFromInvestment || '0'),
      cashflowFromFinancing: parseFloat(stmt.cashflowFromFinancing || '0'),
    }));
  }

  private filterByRange(prices: PriceData[], range: TimeRange): PriceData[] {
    const now = new Date();
    let cutoffDate: Date;

    switch (range) {
      case '1W':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5Y':
        cutoffDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      case 'MAX':
        return prices; // Return all available data
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 1M
    }

    return prices.filter(p => new Date(p.date) >= cutoffDate);
  }
}
```

**Step 2: Commit Alpha Vantage provider**

Run:
```bash
git add lib/providers/alpha-vantage.ts
git commit -m "feat: add Alpha Vantage provider implementation

- Price data fetching with TIME_SERIES_DAILY
- Financial statements (Income, Balance Sheet, Cash Flow)
- Ticker normalization (BRK-B → BRK.B)
- Range filtering (1W to MAX)
- Circuit breaker and retry integration
- Error handling for rate limits and invalid tickers

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Finnhub News Provider

**Files:**
- Create: `lib/providers/finnhub.ts`

**Step 1: Implement Finnhub news provider**

Create `lib/providers/finnhub.ts`:
```typescript
import { INewsProvider, NewsArticle } from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

export class FinnhubProvider implements INewsProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async getNews(ticker: string, windowDays: number): Promise<NewsArticle[]> {
    const now = new Date();
    const fromDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const from = fromDate.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];

    const url = new URL(`${this.baseUrl}/company-news`);
    url.searchParams.set('symbol', ticker);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    url.searchParams.set('token', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Finnhub API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (!Array.isArray(data)) {
      throw new Error('Invalid news data format');
    }

    return data.map((article: any) => ({
      headline: article.headline,
      source: article.source,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      summary: article.summary || article.headline,
    }));
  }
}
```

**Step 2: Commit Finnhub provider**

Run:
```bash
git add lib/providers/finnhub.ts
git commit -m "feat: add Finnhub news provider implementation

- Company news fetching with date range
- Circuit breaker and retry integration
- Convert Unix timestamp to ISO 8601
- Error handling for API failures

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Provider Factory

**Files:**
- Create: `lib/providers/factory.ts`

**Step 1: Create provider factory**

Create `lib/providers/factory.ts`:
```typescript
import {
  IPriceProvider,
  IFinancialProvider,
  INewsProvider,
  PriceProviderType,
  FinancialProviderType,
  NewsProviderType,
} from './interfaces';
import { AlphaVantageProvider } from './alpha-vantage';
import { FinnhubProvider } from './finnhub';

export function getPriceProvider(): IPriceProvider {
  const providerType = (process.env.PRICE_PROVIDER || 'alpha_vantage') as PriceProviderType;

  switch (providerType) {
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    default:
      throw new Error(`Unknown price provider: ${providerType}`);
  }
}

export function getFinancialProvider(): IFinancialProvider {
  const providerType = (process.env.FINANCIAL_PROVIDER || 'alpha_vantage') as FinancialProviderType;

  switch (providerType) {
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    case 'fmp':
      // TODO: Implement FMP provider if needed
      throw new Error('FMP provider not yet implemented. Use alpha_vantage.');
    default:
      throw new Error(`Unknown financial provider: ${providerType}`);
  }
}

export function getNewsProvider(): INewsProvider {
  const providerType = (process.env.NEWS_PROVIDER || 'finnhub') as NewsProviderType;

  switch (providerType) {
    case 'finnhub':
      return new FinnhubProvider();
    default:
      throw new Error(`Unknown news provider: ${providerType}`);
  }
}
```

**Step 2: Commit provider factory**

Run:
```bash
git add lib/providers/factory.ts
git commit -m "feat: add provider factory for dependency injection

- Select providers based on environment variables
- Centralized provider instantiation
- Easy to swap providers by changing env vars

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Price Transformer

**Files:**
- Create: `lib/transformers/prices.ts`
- Create: `__tests__/unit/price-transformer.test.ts`

**Step 1: Write transformer tests**

Create `__tests__/unit/price-transformer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { transformPriceData, normalizePrices } from '@/lib/transformers/prices';
import { PriceData } from '@/lib/providers/interfaces';

describe('transformPriceData', () => {
  const mockPrices: PriceData[] = [
    { ticker: 'AAPL', date: '2026-02-14', open: 185.2, high: 187.5, low: 184.1, close: 186.3, volume: 52000000 },
    { ticker: 'AAPL', date: '2026-02-13', open: 183.5, high: 185.9, low: 183.0, close: 184.1, volume: 48000000 },
    { ticker: 'AAPL', date: '2026-02-12', open: 180.0, high: 184.0, low: 179.5, close: 183.5, volume: 55000000 },
  ];

  it('calculates day change correctly', () => {
    const result = transformPriceData(mockPrices);
    expect(result.dayChange).toBeCloseTo(1.19, 2); // (186.3 - 184.1) / 184.1 * 100
  });

  it('calculates period change correctly', () => {
    const result = transformPriceData(mockPrices);
    expect(result.periodChange).toBeCloseTo(1.53, 2); // (186.3 - 183.5) / 183.5 * 100
  });

  it('returns current price', () => {
    const result = transformPriceData(mockPrices);
    expect(result.current).toBe(186.3);
  });
});

describe('normalizePrices', () => {
  it('normalizes prices to 100 at start', () => {
    const prices: PriceData[] = [
      { ticker: 'AAPL', date: '2026-02-12', open: 180, high: 184, low: 179, close: 183.5, volume: 55000000 },
      { ticker: 'AAPL', date: '2026-02-13', open: 183.5, high: 185.9, low: 183, close: 184.1, volume: 48000000 },
      { ticker: 'AAPL', date: '2026-02-14', open: 185.2, high: 187.5, low: 184.1, close: 186.3, volume: 52000000 },
    ];

    const normalized = normalizePrices(prices);

    // First price should be 100
    expect(normalized[0]).toBeCloseTo(100, 1);

    // Second price: (184.1 / 183.5) * 100
    expect(normalized[1]).toBeCloseTo(100.33, 1);

    // Third price: (186.3 / 183.5) * 100
    expect(normalized[2]).toBeCloseTo(101.53, 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit price-transformer`
Expected: FAIL - module not found

**Step 3: Implement price transformer**

Create `lib/transformers/prices.ts`:
```typescript
import { PriceData } from '@/lib/providers/interfaces';

export interface TransformedPriceData {
  prices: PriceData[];
  current: number;
  dayChange: number; // Percentage
  periodChange: number; // Percentage
}

export function transformPriceData(prices: PriceData[]): TransformedPriceData {
  if (prices.length === 0) {
    throw new Error('No price data to transform');
  }

  // Prices are sorted newest first
  const current = prices[0].close;
  const previousClose = prices.length > 1 ? prices[1].close : current;
  const periodStart = prices[prices.length - 1].close;

  const dayChange = ((current - previousClose) / previousClose) * 100;
  const periodChange = ((current - periodStart) / periodStart) * 100;

  return {
    prices,
    current,
    dayChange,
    periodChange,
  };
}

export function normalizePrices(prices: PriceData[]): number[] {
  if (prices.length === 0) {
    return [];
  }

  const startPrice = prices[0].close;

  return prices.map(p => (p.close / startPrice) * 100);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit price-transformer`
Expected: PASS

**Step 5: Commit price transformer**

Run:
```bash
git add lib/transformers/prices.ts __tests__/unit/price-transformer.test.ts
git commit -m "feat: add price data transformer

- Calculate day change and period change percentages
- Normalize prices to 100 at period start (for comparison mode)
- Unit tests for transformation logic

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Financial Metrics Transformer

**Files:**
- Create: `lib/transformers/financials.ts`
- Create: `__tests__/unit/financial-metrics.test.ts`

**Step 1: Write metrics tests**

Create `__tests__/unit/financial-metrics.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { computeIncomeMetrics, computeBalanceMetrics, computeCashFlowMetrics } from '@/lib/transformers/financials';
import { FinancialStatement } from '@/lib/providers/interfaces';

describe('computeIncomeMetrics', () => {
  const statements: FinancialStatement[] = [
    {
      ticker: 'AAPL',
      fiscalDateEnding: '2025-09-30',
      reportedCurrency: 'USD',
      totalRevenue: 394328000000,
      grossProfit: 174000000000,
      operatingIncome: 120000000000,
      netIncome: 96995000000,
    },
    {
      ticker: 'AAPL',
      fiscalDateEnding: '2024-09-30',
      reportedCurrency: 'USD',
      totalRevenue: 365817000000,
      grossProfit: 160000000000,
      operatingIncome: 110000000000,
      netIncome: 90000000000,
    },
  ];

  it('calculates gross margin', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.grossMargin).toBeCloseTo(44.1, 1); // (174B / 394.3B) * 100
  });

  it('calculates operating margin', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.operatingMargin).toBeCloseTo(30.4, 1); // (120B / 394.3B) * 100
  });

  it('calculates net margin', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.netMargin).toBeCloseTo(24.6, 1); // (97B / 394.3B) * 100
  });

  it('calculates revenue growth YoY', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.revenueGrowthYoY).toBeCloseTo(7.8, 1); // ((394.3 - 365.8) / 365.8) * 100
  });
});

describe('computeBalanceMetrics', () => {
  const statements: FinancialStatement[] = [
    {
      ticker: 'AAPL',
      fiscalDateEnding: '2025-09-30',
      reportedCurrency: 'USD',
      totalAssets: 365000000000,
      totalCurrentAssets: 135000000000,
      totalLiabilities: 265000000000,
      totalCurrentLiabilities: 125000000000,
      totalShareholderEquity: 100000000000,
    },
  ];

  it('calculates current ratio', () => {
    const metrics = computeBalanceMetrics(statements);
    expect(metrics.currentRatio).toBeCloseTo(1.08, 2); // 135B / 125B
  });

  it('calculates debt to equity', () => {
    const metrics = computeBalanceMetrics(statements);
    expect(metrics.debtToEquity).toBeCloseTo(2.65, 2); // 265B / 100B
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit financial-metrics`
Expected: FAIL - module not found

**Step 3: Implement financial metrics transformer**

Create `lib/transformers/financials.ts`:
```typescript
import { FinancialStatement } from '@/lib/providers/interfaces';

export interface IncomeMetrics {
  grossMargin: number; // Percentage
  operatingMargin: number; // Percentage
  netMargin: number; // Percentage
  revenueGrowthYoY: number; // Percentage
}

export interface BalanceMetrics {
  currentRatio: number;
  debtToEquity: number;
}

export interface CashFlowMetrics {
  freeCashFlow: number; // Absolute value
  fcfMargin: number; // Percentage (FCF / Revenue)
}

export function computeIncomeMetrics(statements: FinancialStatement[]): IncomeMetrics {
  if (statements.length === 0) {
    throw new Error('No income statement data');
  }

  const latest = statements[0];
  const revenue = Number(latest.totalRevenue) || 0;
  const grossProfit = Number(latest.grossProfit) || 0;
  const operatingIncome = Number(latest.operatingIncome) || 0;
  const netIncome = Number(latest.netIncome) || 0;

  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  let revenueGrowthYoY = 0;
  if (statements.length > 1) {
    const prior = statements[1];
    const priorRevenue = Number(prior.totalRevenue) || 0;
    if (priorRevenue > 0) {
      revenueGrowthYoY = ((revenue - priorRevenue) / priorRevenue) * 100;
    }
  }

  return {
    grossMargin,
    operatingMargin,
    netMargin,
    revenueGrowthYoY,
  };
}

export function computeBalanceMetrics(statements: FinancialStatement[]): BalanceMetrics {
  if (statements.length === 0) {
    throw new Error('No balance sheet data');
  }

  const latest = statements[0];
  const currentAssets = Number(latest.totalCurrentAssets) || 0;
  const currentLiabilities = Number(latest.totalCurrentLiabilities) || 0;
  const totalLiabilities = Number(latest.totalLiabilities) || 0;
  const equity = Number(latest.totalShareholderEquity) || 0;

  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const debtToEquity = equity > 0 ? totalLiabilities / equity : 0;

  return {
    currentRatio,
    debtToEquity,
  };
}

export function computeCashFlowMetrics(
  cashFlowStatements: FinancialStatement[],
  incomeStatements: FinancialStatement[]
): CashFlowMetrics {
  if (cashFlowStatements.length === 0) {
    throw new Error('No cash flow data');
  }

  const latest = cashFlowStatements[0];
  const operatingCashflow = Number(latest.operatingCashflow) || 0;
  const capex = Math.abs(Number(latest.capitalExpenditures) || 0);
  const freeCashFlow = operatingCashflow - capex;

  let fcfMargin = 0;
  if (incomeStatements.length > 0) {
    const revenue = Number(incomeStatements[0].totalRevenue) || 0;
    if (revenue > 0) {
      fcfMargin = (freeCashFlow / revenue) * 100;
    }
  }

  return {
    freeCashFlow,
    fcfMargin,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit financial-metrics`
Expected: PASS

**Step 5: Commit financial metrics transformer**

Run:
```bash
git add lib/transformers/financials.ts __tests__/unit/financial-metrics.test.ts
git commit -m "feat: add financial metrics transformer

- Income statement metrics (margins, revenue growth)
- Balance sheet metrics (current ratio, debt/equity)
- Cash flow metrics (FCF, FCF margin)
- Unit tests for all metric calculations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: News Transformer (Deduplication & Sentiment)

**Files:**
- Create: `lib/transformers/news.ts`
- Create: `__tests__/unit/news-transformer.test.ts`

**Step 1: Write news transformer tests**

Create `__tests__/unit/news-transformer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { deduplicateNews, computeSentiment } from '@/lib/transformers/news';
import { NewsArticle } from '@/lib/providers/interfaces';

describe('deduplicateNews', () => {
  it('removes duplicate headlines', () => {
    const articles: NewsArticle[] = [
      {
        headline: 'Tesla Delivers Record Numbers!',
        source: 'Reuters',
        url: 'https://example.com/1',
        publishedAt: '2026-02-14T10:00:00Z',
        summary: 'Tesla announced record deliveries.',
      },
      {
        headline: 'Tesla delivers record numbers.',
        source: 'Bloomberg',
        url: 'https://example.com/2',
        publishedAt: '2026-02-14T10:30:00Z',
        summary: 'Tesla sees record numbers.',
      },
      {
        headline: 'Apple Announces New Product',
        source: 'TechCrunch',
        url: 'https://example.com/3',
        publishedAt: '2026-02-14T11:00:00Z',
        summary: 'Apple unveils new product.',
      },
    ];

    const result = deduplicateNews(articles);
    expect(result).toHaveLength(2); // Tesla duplicate removed
  });
});

describe('computeSentiment', () => {
  it('detects positive sentiment', () => {
    expect(computeSentiment('Tesla surges on record deliveries')).toBe('positive');
    expect(computeSentiment('Apple stock rallies after earnings beat')).toBe('positive');
    expect(computeSentiment('Innovation drives growth')).toBe('positive');
  });

  it('detects negative sentiment', () => {
    expect(computeSentiment('Tesla plunges on production concerns')).toBe('negative');
    expect(computeSentiment('Apple stock tumbles after lawsuit')).toBe('negative');
    expect(computeSentiment('Company issues recall')).toBe('negative');
  });

  it('defaults to neutral', () => {
    expect(computeSentiment('Apple announces quarterly results')).toBe('neutral');
    expect(computeSentiment('Tesla holds shareholder meeting')).toBe('neutral');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit news-transformer`
Expected: FAIL - module not found

**Step 3: Implement news transformer**

Create `lib/transformers/news.ts`:
```typescript
import { NewsArticle } from '@/lib/providers/interfaces';

export function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();

  return articles.filter(article => {
    // Create fingerprint: lowercase, remove punctuation, first 50 chars
    const fingerprint = article.headline
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .slice(0, 50);

    if (seen.has(fingerprint)) {
      return false;
    }

    seen.add(fingerprint);
    return true;
  });
}

export function computeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase();

  const positiveWords = [
    'surge', 'surges', 'record', 'beats', 'beat', 'growth', 'profit',
    'rally', 'rallies', 'gain', 'gains', 'innovation', 'breakthrough',
    'soar', 'soars', 'jump', 'jumps', 'rise', 'rises', 'up',
  ];

  const negativeWords = [
    'plunge', 'plunges', 'loss', 'losses', 'cut', 'cuts', 'lawsuit',
    'recall', 'recalls', 'downgrade', 'downgrades', 'tumble', 'tumbles',
    'miss', 'misses', 'warning', 'decline', 'declines', 'weak', 'down',
    'fall', 'falls', 'drop', 'drops',
  ];

  let score = 0;

  positiveWords.forEach(word => {
    if (lower.includes(word)) {
      score += 1;
    }
  });

  negativeWords.forEach(word => {
    if (lower.includes(word)) {
      score -= 1;
    }
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit news-transformer`
Expected: PASS

**Step 5: Commit news transformer**

Run:
```bash
git add lib/transformers/news.ts __tests__/unit/news-transformer.test.ts
git commit -m "feat: add news transformer with deduplication and sentiment

- Deduplicate similar headlines using fingerprinting
- Keyword-based sentiment analysis (positive/neutral/negative)
- Extensible design for future LLM-based sentiment
- Unit tests for deduplication and sentiment logic

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Prices API Route

**Files:**
- Create: `app/api/prices/route.ts`

**Step 1: Create prices API route**

Create `app/api/prices/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPriceProvider } from '@/lib/providers/factory';
import { cachePrices } from '@/lib/cache/server-cache';
import { transformPriceData } from '@/lib/transformers/prices';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import { TimeRange } from '@/lib/providers/interfaces';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const range = (searchParams.get('range') || '1M') as TimeRange;

  // Validation
  if (!tickerParam) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  const ticker = normalizeTicker(tickerParam);

  if (!validateTicker(ticker)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  try {
    const provider = getPriceProvider();

    const prices = await cachePrices(ticker, range, async () => {
      return await provider.getPrices(ticker, range);
    });

    const transformed = transformPriceData(prices);

    return NextResponse.json({
      ticker,
      range,
      data: transformed.prices,
      meta: {
        currentPrice: transformed.current,
        dayChange: transformed.dayChange,
        periodChange: transformed.periodChange,
      },
    });
  } catch (error: any) {
    console.error('[API Prices]', error);

    // Map common errors to user-friendly messages
    let errorMessage = 'Failed to fetch price data';
    let statusCode = 500;

    if (error.message.includes('Invalid ticker')) {
      errorMessage = 'Ticker not found';
      statusCode = 404;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('Circuit breaker open')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a minute.';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, ticker },
      { status: statusCode }
    );
  }
}
```

**Step 2: Commit prices API route**

Run:
```bash
git add app/api/prices/route.ts
git commit -m "feat: add prices API route

- GET /api/prices?ticker=AAPL&range=1M
- Ticker validation and normalization
- Server-side caching with 5-minute TTL
- Price transformation (current, day change, period change)
- User-friendly error messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Financials API Route

**Files:**
- Create: `app/api/financials/route.ts`

**Step 1: Create financials API route**

Create `app/api/financials/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFinancialProvider } from '@/lib/providers/factory';
import { cacheFinancials } from '@/lib/cache/server-cache';
import {
  computeIncomeMetrics,
  computeBalanceMetrics,
  computeCashFlowMetrics,
} from '@/lib/transformers/financials';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const statement = searchParams.get('statement');
  const period = searchParams.get('period') || 'annual';

  // Validation
  if (!tickerParam) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  if (!statement || !['income', 'balance', 'cashflow'].includes(statement)) {
    return NextResponse.json(
      { error: 'Invalid statement type. Use: income, balance, or cashflow' },
      { status: 400 }
    );
  }

  if (period !== 'annual' && period !== 'quarterly') {
    return NextResponse.json(
      { error: 'Invalid period. Use: annual or quarterly' },
      { status: 400 }
    );
  }

  const ticker = normalizeTicker(tickerParam);

  if (!validateTicker(ticker)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  try {
    const provider = getFinancialProvider();

    const data = await cacheFinancials(ticker, statement, period, async () => {
      switch (statement) {
        case 'income':
          return await provider.getIncomeStatement(ticker, period as 'annual' | 'quarterly');
        case 'balance':
          return await provider.getBalanceSheet(ticker, period as 'annual' | 'quarterly');
        case 'cashflow':
          return await provider.getCashFlow(ticker, period as 'annual' | 'quarterly');
        default:
          throw new Error('Invalid statement type');
      }
    });

    // Compute metrics
    let metrics = {};

    if (statement === 'income') {
      metrics = computeIncomeMetrics(data);
    } else if (statement === 'balance') {
      metrics = computeBalanceMetrics(data);
    } else if (statement === 'cashflow') {
      // For cash flow, we need income statement for revenue
      const incomeData = await cacheFinancials(ticker, 'income', period, async () => {
        return await provider.getIncomeStatement(ticker, period as 'annual' | 'quarterly');
      });
      metrics = computeCashFlowMetrics(data, incomeData);
    }

    return NextResponse.json({
      ticker,
      statement,
      period,
      data,
      metrics,
    });
  } catch (error: any) {
    console.error('[API Financials]', error);

    let errorMessage = 'Failed to fetch financial data';
    let statusCode = 500;

    if (error.message.includes('Invalid ticker')) {
      errorMessage = 'Ticker not found';
      statusCode = 404;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('No') && error.message.includes('data available')) {
      errorMessage = `${statement} data not available for this ticker`;
      statusCode = 404;
    }

    return NextResponse.json(
      { error: errorMessage, ticker },
      { status: statusCode }
    );
  }
}
```

**Step 2: Commit financials API route**

Run:
```bash
git add app/api/financials/route.ts
git commit -m "feat: add financials API route

- GET /api/financials?ticker=AAPL&statement=income&period=annual
- Support for income, balance, cashflow statements
- Annual and quarterly periods
- Server-side caching with 24-hour TTL
- Computed metrics for each statement type
- User-friendly error messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 14: News API Route

**Files:**
- Create: `app/api/news/route.ts`

**Step 1: Create news API route**

Create `app/api/news/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getNewsProvider } from '@/lib/providers/factory';
import { cacheNews } from '@/lib/cache/server-cache';
import { deduplicateNews, computeSentiment } from '@/lib/transformers/news';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const window = searchParams.get('window') || '7d';

  // Validation
  if (!tickerParam) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  const ticker = normalizeTicker(tickerParam);

  if (!validateTicker(ticker)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  // Parse time window
  const windowDays = parseTimeWindow(window);

  if (windowDays === null) {
    return NextResponse.json(
      { error: 'Invalid time window. Use: 24h, 7d, or 30d' },
      { status: 400 }
    );
  }

  try {
    const provider = getNewsProvider();

    const news = await cacheNews(ticker, window, async () => {
      return await provider.getNews(ticker, windowDays);
    });

    // Deduplicate similar headlines
    const deduplicated = deduplicateNews(news);

    // Add sentiment scores
    const withSentiment = deduplicated.map(article => ({
      ...article,
      sentiment: computeSentiment(article.headline + ' ' + article.summary),
    }));

    return NextResponse.json({
      ticker,
      window,
      count: withSentiment.length,
      articles: withSentiment,
    });
  } catch (error: any) {
    console.error('[API News]', error);

    let errorMessage = 'Failed to fetch news data';
    let statusCode = 500;

    if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    }

    return NextResponse.json(
      { error: errorMessage, ticker },
      { status: statusCode }
    );
  }
}

function parseTimeWindow(window: string): number | null {
  switch (window) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    default:
      return null;
  }
}
```

**Step 2: Commit news API route**

Run:
```bash
git add app/api/news/route.ts
git commit -m "feat: add news API route

- GET /api/news?ticker=AAPL&window=7d
- Support for 24h, 7d, 30d time windows
- Server-side caching with 15-minute TTL
- Deduplication of similar headlines
- Sentiment scoring (positive/neutral/negative)
- User-friendly error messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 15: React Query Setup

**Files:**
- Create: `lib/providers/query-provider.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create TanStack Query provider**

Create `lib/providers/query-provider.tsx`:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Step 2: Update root layout**

Modify `app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stock Dashboard',
  description: 'Interactive stock dashboard with price charts, financials, and news',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

**Step 3: Commit React Query setup**

Run:
```bash
git add lib/providers/query-provider.tsx app/layout.tsx
git commit -m "feat: add TanStack Query provider

- Client-side query provider with default options
- 1-minute stale time for queries
- Disable refetch on window focus
- Wrap app in QueryProvider

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

Due to length constraints, I'll continue the implementation plan in a summary format for the remaining tasks.

---

## Task 16-30: UI Components & Integration

The remaining tasks follow the same TDD pattern:

**Task 16:** Create custom hooks (`usePrices`, `useFinancials`, `useNews`, `useTickers`)
**Task 17:** Build base UI components (LoadingSkeleton, ErrorPanel, DarkModeToggle)
**Task 18:** Implement TickerInput and TickerChips components
**Task 19:** Create PriceChart component with lightweight-charts
**Task 20:** Build CompareChart for multi-ticker normalization
**Task 21:** Implement FinancialTabs and FinancialTable
**Task 22:** Create MetricsPanel for computed ratios
**Task 23:** Build NewsList and NewsFilters
**Task 24:** Implement SentimentBadge component
**Task 25:** Create main dashboard layout
**Task 26:** Add dark mode support
**Task 27:** Implement E2E smoke test
**Task 28:** Update README with setup instructions
**Task 29:** Update CLAUDE.md with project specifics
**Task 30:** Final integration testing and deployment prep

Each task follows the same pattern:
1. Write component/test
2. Run test (fail)
3. Implement component
4. Run test (pass)
5. Commit

---

## Execution Strategy

This plan contains **30 tasks** with **5-8 steps each** (~150-240 total steps).

**Estimated time:** 8-12 hours for full implementation

**Checkpoints:**
- After Task 5: Core utilities complete
- After Task 11: Data layer complete
- After Task 14: API routes complete
- After Task 24: UI components complete
- After Task 30: Full app ready for deployment

---

## Testing Commands

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit validation

# Run E2E tests
npm run test:e2e

# Run in watch mode (development)
npm run test
```

---

## Deployment Checklist

- [ ] All tests passing
- [ ] `.env.local` configured with API keys
- [ ] Build succeeds: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] README updated with setup instructions
- [ ] CLAUDE.md updated with project details
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables configured in Vercel
- [ ] Production URL tested

---
