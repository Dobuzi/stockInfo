# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock Dashboard - A Next.js 16 web application for visualizing stock market data including price charts, financial statements, and news with sentiment analysis.

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run unit tests (watch mode)
npm run test:unit        # Run unit tests (single run)
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests in UI mode

# Type Checking & Linting
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
```

## Architecture

### Data Flow

```
Browser → React Components → React Query Hooks → API Routes → Providers → External APIs
                ↓                                    ↓
           localStorage                        Server Cache (Next.js)
```

### Key Patterns

- **Provider Adapter Pattern:** All external API calls go through provider interfaces (`IPriceProvider`, `IFinancialProvider`, `INewsProvider`, `IOverviewProvider`)
- **Server-Side Caching:** API routes use Next.js `unstable_cache` with different TTLs (prices: 5min, financials: 24h, news: 15min, overview: 24h)
- **Client-Side Caching:** React Query handles client-side data fetching with 1-minute stale time
- **Resilience:** All provider calls wrapped in retry logic with exponential backoff and circuit breaker

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

### Technical Indicators

**SMA Calculation (`lib/utils/indicators.ts`):**
- Simple moving averages calculated client-side from OHLC data
- No additional API calls required
- Memoized for performance (`useMemo` in component)

**Pattern:**
```typescript
// Calculate SMA
const sma20 = calculateSMA(priceData, 20);

// Memoized in component
const smaData = useMemo(() => ({
  sma20: calculateSMA(data, 20),
  sma50: calculateSMA(data, 50),
  sma200: calculateSMA(data, 200),
}), [data]);
```

**Chart Multi-Pane Layout:**
- Top pane (70%): Price candlesticks + SMA overlays
- Bottom pane (30%): Volume histogram
- Uses lightweight-charts v5 multi-series capability

### API Routes

- `GET /api/prices?ticker=AAPL&range=1M` - Stock prices with OHLC data
- `GET /api/financials?ticker=AAPL&statement=income&period=annual` - Financial statements
- `GET /api/news?ticker=AAPL&window=7d` - Company news with sentiment
- `GET /api/overview?ticker=AAPL` - Company overview with fundamental metrics

### Data Providers

- **Alpha Vantage:** Stock prices and financial statements (requires `ALPHA_VANTAGE_API_KEY`)
- **Finnhub:** Company news (requires `FINNHUB_API_KEY`)

Provider selection via environment variables in `lib/providers/factory.ts`.

### Ticker Normalization

Alpha Vantage uses dots for special characters (BRK.B), so tickers are normalized in providers:
```typescript
ticker.replace('-', '.') // BRK-B → BRK.B
```

## Testing

- **Unit Tests:** Located in `__tests__/unit/` - test utilities, transformers, and validation
- **E2E Tests:** Located in `__tests__/e2e/` - Playwright smoke tests for main user flows
- Test utilities: Vitest with jsdom for DOM testing
- Run tests before committing changes

## Common Development Tasks

### Adding a New Data Provider

1. Create provider class in `lib/providers/` implementing the interface
2. Update `lib/providers/factory.ts` to include new provider option
3. Add environment variable to `.env.example`
4. Update this file with new provider info

### Adding a New Chart Type

1. Create component in `components/charts/`
2. Use `lightweight-charts` library for consistency
3. Support dark mode (check `document.documentElement.classList.contains('dark')`)
4. Make responsive (handle window resize events)

### Modifying Financial Metrics

1. Update calculation in `lib/transformers/financials.ts`
2. Add corresponding tests in `__tests__/unit/financial-metrics.test.ts`
3. Update display in `components/financials/MetricsPanel.tsx`

## Notes

- Dark mode state is stored in localStorage and synced across components
- Tickers are persisted in localStorage (max 10 tickers)
- All dates should be ISO 8601 format for consistency
- Number formatting uses utilities in `lib/utils/formatting.ts` (K/M/B suffixes)
- Sentiment analysis uses keyword-based heuristic (extensible to LLM in future)
