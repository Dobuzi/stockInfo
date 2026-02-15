# Stock Dashboard - Design Document

**Date:** 2026-02-15
**Status:** Approved
**Author:** Design validated through brainstorming session

## Overview

A production-quality stock dashboard web application that visualizes price performance, financial statements, and news for user-provided stock tickers. Single-user local application optimized for Vercel deployment.

## Goals

- Display interactive price charts with historical data and comparison mode
- Show financial statements (Income, Balance Sheet, Cash Flow) with computed metrics
- Aggregate news with sentiment analysis
- Run locally with one command (`npm run dev`)
- Deploy to Vercel with zero configuration

## Technical Stack

- **Framework:** Next.js 15 (App Router) + TypeScript 5.3+
- **UI:** React 18 + TailwindCSS 3.4
- **Charts:** lightweight-charts 4.x (TradingView library)
- **Data Fetching:** TanStack Query 5.x (React Query)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Deployment:** Vercel (serverless)

### Stack Rationale

- **Next.js App Router:** Server components, built-in caching, API routes for secure key management
- **lightweight-charts:** 40KB bundle, native candlestick support, blazing fast on mobile
- **TanStack Query:** Request deduplication, client-side caching, automatic background refetch
- **Vercel:** Zero-config deployment, automatic HTTPS/CDN, serverless functions

## Data Sources (Free Tier)

- **Prices:** Alpha Vantage (5 calls/min, 25/day)
- **Financials:** Financial Modeling Prep (250 calls/day)
- **News:** Finnhub (60 calls/min)

All providers accessed via server-side API routes to keep keys secure. Adapter pattern allows easy provider swapping via environment variables.

## Architecture

### High-Level System Design

```
Browser (Client)
├── React Components (UI)
├── TanStack Query (client cache)
└── localStorage (ticker persistence)
    │
    ↓ HTTP
    │
Next.js Server (App Router)
├── Route Handlers (/api/*)
├── Provider Adapters (data fetching + normalization)
└── Caching Layer (Next.js unstable_cache)
    │
    ↓ HTTPS
    │
External APIs (Alpha Vantage, FMP, Finnhub)
```

### Project Structure

```
stockInfo/
├── app/
│   ├── page.tsx                 # Main dashboard
│   ├── layout.tsx               # Root layout + dark mode
│   ├── api/
│   │   ├── prices/route.ts
│   │   ├── financials/route.ts
│   │   └── news/route.ts
│   └── globals.css
├── components/
│   ├── ticker/
│   │   ├── TickerInput.tsx
│   │   └── TickerChips.tsx
│   ├── charts/
│   │   ├── PriceChart.tsx
│   │   ├── CompareChart.tsx
│   │   └── RangeSelector.tsx
│   ├── financials/
│   │   ├── FinancialTabs.tsx
│   │   ├── FinancialTable.tsx
│   │   └── MetricsPanel.tsx
│   ├── news/
│   │   ├── NewsList.tsx
│   │   ├── NewsFilters.tsx
│   │   └── SentimentBadge.tsx
│   └── ui/
│       ├── LoadingSkeleton.tsx
│       ├── ErrorPanel.tsx
│       └── DarkModeToggle.tsx
├── lib/
│   ├── providers/
│   │   ├── interfaces.ts        # TypeScript contracts
│   │   ├── alpha-vantage.ts
│   │   ├── fmp.ts
│   │   ├── finnhub.ts
│   │   └── factory.ts           # Provider selection
│   ├── transformers/
│   │   ├── prices.ts            # % change calculations
│   │   ├── financials.ts        # Metrics computation
│   │   └── news.ts              # Deduplication + sentiment
│   ├── cache/
│   │   └── server-cache.ts      # TTL wrapper for unstable_cache
│   ├── utils/
│   │   ├── retry.ts             # Exponential backoff + circuit breaker
│   │   ├── validation.ts        # Ticker validation
│   │   └── formatting.ts        # K/M/B number formatting
│   └── hooks/
│       ├── useTickers.ts        # localStorage persistence
│       ├── usePrices.ts
│       ├── useFinancials.ts
│       └── useNews.ts
├── __tests__/
│   ├── unit/
│   │   ├── transformers.test.ts
│   │   └── validation.test.ts
│   └── e2e/
│       └── smoke.spec.ts
└── docs/plans/
```

## Data Layer

### Provider Adapter Pattern

**Interfaces** define contracts that each provider must implement:

```typescript
export interface IPriceProvider {
  getPrices(ticker: string, range: TimeRange): Promise<PriceData[]>;
  validateTicker(ticker: string): Promise<boolean>;
}

export interface IFinancialProvider {
  getIncomeStatement(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatement[]>;
  getBalanceSheet(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatement[]>;
  getCashFlow(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatement[]>;
}

export interface INewsProvider {
  getNews(ticker: string, windowDays: number): Promise<NewsArticle[]>;
}
```

**Factory** selects provider based on environment variables:

```typescript
export function getPriceProvider(): IPriceProvider {
  const provider = process.env.PRICE_PROVIDER || 'alpha_vantage';
  switch (provider) {
    case 'alpha_vantage': return new AlphaVantageProvider();
    default: throw new Error(`Unknown price provider: ${provider}`);
  }
}
```

### Caching Strategy

**Next.js `unstable_cache`** with different TTLs per data type:

- **Prices:** 5 minutes (frequent updates during market hours)
- **Financials:** 24 hours (quarterly/annual data changes rarely)
- **News:** 15 minutes (balance freshness vs API quota)

```typescript
export const cachePrices = (ticker: string, range: string, fn: () => Promise<any>) =>
  unstable_cache(fn, [`prices-${ticker}-${range}`], {
    revalidate: 300,
    tags: [`prices`, `ticker-${ticker}`]
  })();
```

Cache is in-memory (Vercel serverless) and resets on deployment. Acceptable trade-off for free tier + zero infrastructure.

### Error Handling & Retry

**Exponential Backoff:**
- Retry failed requests 3 times max
- Delays: 1s, 2s, 4s between attempts
- Only retry on network errors or 5xx responses (not 4xx)

**Circuit Breaker:**
- After 5 consecutive failures, stop calling provider for 60 seconds
- Prevents API ban from hammering broken endpoints
- Returns cached data if available, else user-friendly error

**Graceful Degradation:**
- Prices fail → show last cached data with "Stale Data" warning
- Financials fail → empty state with retry button
- News fail → hide news section (non-critical)
- Invalid ticker → validation error, no API call

## API Routes

### `GET /api/prices?ticker=AAPL&range=1M`

**Parameters:**
- `ticker` (required): Stock symbol (uppercase, validated)
- `range` (optional): 1W | 1M | 3M | 6M | 1Y | 5Y | MAX (default: 1M)

**Response:**
```json
{
  "ticker": "AAPL",
  "range": "1M",
  "data": [
    { "date": "2026-02-14", "open": 185.2, "high": 187.5, "low": 184.1, "close": 186.3, "volume": 52000000 }
  ],
  "meta": {
    "currentPrice": 186.3,
    "dayChange": 1.2,
    "periodChange": 5.7
  }
}
```

**Validation:**
- Ticker format: 1-5 uppercase letters, optional dot/hyphen (e.g., BRK.B, BRK-B)
- Server-side ticker validation before API call

### `GET /api/financials?ticker=AAPL&statement=income&period=annual`

**Parameters:**
- `ticker` (required): Stock symbol
- `statement` (required): income | balance | cashflow
- `period` (optional): annual | quarterly (default: annual)

**Response:**
```json
{
  "ticker": "AAPL",
  "statement": "income",
  "period": "annual",
  "data": [
    { "fiscalDateEnding": "2025-09-30", "totalRevenue": 394328000000, "netIncome": 96995000000 }
  ],
  "metrics": {
    "revenueGrowthYoY": 8.2,
    "grossMargin": 44.1,
    "operatingMargin": 30.5,
    "netMargin": 24.6
  }
}
```

**Computed Metrics:**
- Revenue Growth YoY: `(current - prior) / prior * 100`
- Margins: `(profit / revenue) * 100`
- Ratios: debt/equity, current ratio, quick ratio

### `GET /api/news?ticker=TSLA&window=7d`

**Parameters:**
- `ticker` (required): Stock symbol
- `window` (optional): 24h | 7d | 30d (default: 7d)

**Response:**
```json
{
  "ticker": "TSLA",
  "window": "7d",
  "count": 15,
  "articles": [
    {
      "headline": "Tesla Delivers Record Q4 Numbers",
      "source": "Reuters",
      "url": "https://...",
      "publishedAt": "2026-02-14T10:30:00Z",
      "summary": "Tesla announced...",
      "sentiment": "positive"
    }
  ]
}
```

**Transformations:**
- Deduplication: remove near-identical headlines (fingerprint first 50 chars)
- Sentiment scoring: keyword heuristic (positive/neutral/negative)

## UI Components & Layout

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: [Stock Dashboard] [Dark Mode Toggle]               │
├──────────────┬──────────────────────────────────────────────┤
│   Sidebar    │  Main Content                                │
│              │                                              │
│ [+ Add]      │  [Ticker Input]                              │
│              │                                              │
│ [AAPL] [×]   │  ┌────────────────────────────────────────┐  │
│ [TSLA] [×]   │  │ Price Chart                            │  │
│ [BRK.B] [×]  │  │ [1W|1M|3M|6M|1Y|5Y|MAX]                │  │
│              │  └────────────────────────────────────────┘  │
│ Quick Stats  │                                              │
│ AAPL $186.30 │  ┌────────────────────────────────────────┐  │
│ +1.2 (+0.6%) │  │ Financials [IS|BS|CF]                  │  │
│              │  │ [Annual ▼] [Last 4 ▼]                 │  │
│              │  └────────────────────────────────────────┘  │
│              │                                              │
│              │  ┌────────────────────────────────────────┐  │
│              │  │ News Feed                              │  │
│              │  └────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────┘
```

**Responsive:**
- Mobile (<768px): Single column, sidebar becomes top section
- Tablet (768-1024px): Sidebar + main, stack vertically
- Desktop (>1024px): Full layout as above

### Key Components

**TickerInput:** Combobox with validation, comma-separated support, persists to localStorage

**PriceChart:** lightweight-charts wrapper, candlestick + volume, responsive resize

**CompareChart:** Normalize multiple tickers to 100 at period start, line series

**FinancialTable:** Sticky header, horizontal scroll, K/M/B formatting

**MetricsPanel:** Grid of computed ratios/margins with color coding

**NewsList:** Card layout, sentiment badges, click to open article

**LoadingSkeleton:** Shimmer animation during fetch

**ErrorPanel:** Retry button + user-friendly error messages

### Dark Mode

- TailwindCSS `dark:` variants
- Toggle in header, persists to localStorage
- Syncs chart theme (lightweight-charts has built-in dark theme)

## Features

### 1. Price Visualization

**Single Ticker:**
- OHLC candlestick chart
- Volume histogram (30% height, green/red bars)
- Percentage change badges: "↑ $1.20 (+0.65%)"
- Range selector: 1W, 1M, 3M, 6M, 1Y, 5Y, MAX
- Crosshair tooltip with exact OHLC + volume

**Comparison Mode:**
- Toggle checkbox: "Compare Mode"
- Normalizes all tickers to 100 at period start
- Line chart (distinct colors per ticker)
- Legend: "AAPL: 105.7 (+5.7%)"

**Interactions:**
- Zoom: pinch/scroll
- Pan: drag
- Tooltip on hover

### 2. Financial Statements

**Tabs:** Income Statement | Balance Sheet | Cash Flow Statement

**Selectors:**
- Period: Annual | Quarterly
- Periods shown: Last 4 | Last 8 | Last 12

**Table:**
- Left column: line item names (sticky)
- Remaining columns: fiscal periods (FY 2025, FY 2024, etc.)
- Format: $394.3B, $52.0M, $1.5M, $250K

**Computed Metrics:**

*Income:*
- Revenue Growth YoY, Gross Margin, Operating Margin, Net Margin, EPS

*Balance:*
- Debt-to-Equity, Current Ratio, Quick Ratio, Book Value per Share

*Cash Flow:*
- Free Cash Flow, FCF Margin, Operating Cash Flow Growth

**Missing Data:**
- Show warning if quarterly unavailable (e.g., BRK-B)
- Disable dropdown options for unavailable data

### 3. News Feed

**Filters:**
- Ticker: All | AAPL | TSLA | ...
- Time: Last 24 Hours | Last 7 Days | Last 30 Days

**Deduplication:**
- Create fingerprint: lowercase headline, remove punctuation, first 50 chars
- Skip if duplicate fingerprint seen

**Sentiment (Keyword Heuristic):**
- Positive: surge, record, beats, growth, profit, rally, gains
- Negative: plunge, loss, cuts, lawsuit, recall, downgrade, tumbles
- Neutral: default

**Future Enhancement:** Swap to LLM API (Claude) for sentiment with structured output

**Display:**
- Card: headline (bold), source + time ago, summary (truncated), sentiment badge
- Click opens article in new tab

## Testing

### Unit Tests (Vitest)

Focus on business logic:

- **transformers.test.ts:** Price calculations (day change %, period change, normalization)
- **financial-metrics.test.ts:** Margin calculations, YoY growth, ratios, division by zero
- **validation.test.ts:** Ticker format validation, normalization (AAPL vs aapl, BRK.B vs BRK-B)
- **sentiment.test.ts:** Keyword detection (positive, negative, neutral)
- **news-dedup.test.ts:** Duplicate headline removal

### E2E Test (Playwright)

**Smoke test** (`smoke.spec.ts`):
1. Load app
2. Add ticker (AAPL)
3. Verify chart appears
4. Switch range (3M)
5. Click financials tab
6. Add second ticker (TSLA)
7. Enable comparison mode
8. Toggle dark mode

**Coverage Goals:**
- Unit: High-value business logic only (not targeting 100%)
- E2E: One comprehensive happy path test

## Deployment

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with API keys

# 3. Run dev server
npm run dev
# App: http://localhost:3000

# 4. Run tests
npm run test:unit
npm run test:e2e
```

### Environment Variables

```bash
ALPHA_VANTAGE_API_KEY=your_key
FINANCIAL_MODELING_PREP_API_KEY=your_key
FINNHUB_API_KEY=your_key

# Optional
PRICE_PROVIDER=alpha_vantage
FINANCIAL_PROVIDER=fmp
NEWS_PROVIDER=finnhub
```

**Get API Keys:**
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- FMP: https://site.financialmodelingprep.com/developer/docs
- Finnhub: https://finnhub.io/register

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy (automatic on push to main)

**Zero configuration required** - Vercel auto-detects Next.js and configures build settings.

## Sample Tickers for Testing

1. **AAPL** (Apple) - Normal ticker, full data
2. **TSLA** (Tesla) - High volatility, frequent news
3. **BRK.B** (Berkshire Hathaway) - Special character handling, may lack quarterly data

## Limitations & Known Issues

1. **Rate Limits:** 25 calls/day on Alpha Vantage free tier → cached data shown if exceeded
2. **Data Availability:** Some tickers lack quarterly financials
3. **Market Hours:** No real-time data (15-20 min delay)
4. **Sentiment Accuracy:** Keyword heuristic ~70% accurate (upgradeable to LLM)
5. **Browser Support:** Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+)

## Success Criteria

✅ User can add/remove tickers via input
✅ Price charts render with range selection
✅ Comparison mode normalizes multiple tickers
✅ Financial statements display with computed metrics
✅ News feed shows articles with sentiment
✅ Dark mode toggle works
✅ Responsive on mobile, tablet, desktop
✅ One-command local run: `npm run dev`
✅ Zero-config Vercel deployment
✅ Tests pass: unit + E2E smoke test

## Next Steps

1. Create detailed implementation plan (task breakdown)
2. Execute implementation with checkpoints
3. Deploy to Vercel
4. Update CLAUDE.md with project specifics
