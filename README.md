# Stock Dashboard

A production-quality stock dashboard built with Next.js, TypeScript, and TailwindCSS that visualizes stock prices, financial statements, and news.

## Features

- 📈 **Interactive Price Charts** - Candlestick charts with volume bars and moving averages (20/50/200-day SMAs)
- 🔄 **Smart Comparison View** - Side-by-side fundamental metrics comparison (auto-switches when 2+ tickers added)
- 📊 **Financial Statements** - Income statements, balance sheets, and cash flow with computed metrics
- 📰 **News Feed** - Latest news with sentiment analysis (positive/neutral/negative)
- 🌙 **Dark Mode** - Full dark mode support
- ⚡ **Fast** - Server-side caching and React Query for optimal performance
- 📱 **Responsive** - Works on mobile, tablet, and desktop

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **Charts:** lightweight-charts
- **Data Fetching:** TanStack Query (React Query)
- **Testing:** Vitest (unit) + Playwright (E2E)

## Getting Started

### Prerequisites

**Recommended Setup (Free Tier Optimized):**
- [Financial Modeling Prep](https://financialmodelingprep.com/developer/docs/) - 250 calls/day (overview & financials)
- [Finnhub](https://finnhub.io/register) - 60 calls/minute (price data)
- [GDELT](https://www.gdeltproject.org/) - Unlimited, no key required (news)
- [Stooq](https://stooq.com/) - Unlimited, no key required (EOD price fallback)

**Optional (Legacy/Fallback):**
- [Alpha Vantage](https://www.alphavantage.co/support/#api-key) - 25 calls/day (all data types)

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Create `.env.local` from template:
```bash
cp .env.example .env.local
```

3. Add your API keys to `.env.local`:
```bash
# Recommended for optimal free-tier usage
FMP_API_KEY=your_fmp_key_here
FINNHUB_API_KEY=your_finnhub_key_here

# Optional: Legacy provider (fallback)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Build for Production

```bash
npm run build
npm run start
```

## Technical Analysis

The price charts include essential technical analysis tools:

**Volume Histogram:**
- Displayed below price chart in separate pane
- Green bars: Price closed higher than open (bullish)
- Red bars: Price closed lower than open (bearish)
- Helps confirm price movements and identify accumulation/distribution

**Simple Moving Averages (SMAs):**
- **20-day SMA** (blue): Short-term trend
- **50-day SMA** (orange): Medium-term trend
- **200-day SMA** (purple): Long-term trend

**Key Signals:**
- **Golden Cross:** 50-day crosses above 200-day (bullish signal)
- **Death Cross:** 50-day crosses below 200-day (bearish signal)
- Price above all SMAs: Strong uptrend
- Price below all SMAs: Strong downtrend

**Note:** SMAs are only displayed when sufficient data is available (e.g., 200-day SMA requires 200+ days of price data).

## Sample Tickers

- **AAPL** - Apple (normal ticker, full data availability)
- **TSLA** - Tesla (high volatility, frequent news)
- **BRK.B** - Berkshire Hathaway (special character handling)

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

## API Configuration & Providers

The dashboard uses a **multi-provider architecture** optimized for free-tier APIs:

### Default Configuration (Recommended)
- **Prices:** Finnhub (60/min) → Stooq fallback (no key, EOD only)
- **Overview:** FMP (250/day)
- **Financials:** FMP (250/day)
- **News:** GDELT (unlimited, no key)

### Provider Customization
Set environment variables to override defaults:
```bash
PRICE_PROVIDER=finnhub      # Options: finnhub, stooq, alpha_vantage
OVERVIEW_PROVIDER=fmp        # Options: fmp, alpha_vantage
FINANCIAL_PROVIDER=fmp       # Options: fmp, alpha_vantage
NEWS_PROVIDER=gdelt          # Options: gdelt, finnhub
```

### API Limitations
- **FMP:** 250 calls/day (shared across overview + financials)
- **Finnhub:** 60 calls/minute (prices or news)
- **Alpha Vantage:** 25 calls/day (legacy fallback)
- **GDELT:** Unlimited (no key required)
- **Stooq:** Unlimited (EOD data, no key required)

### Caching Strategy
- **Prices:** 2 minutes (near-real-time EOD data)
- **Overview:** 6 hours (fundamentals change slowly)
- **Financials:** 24 hours (quarterly/annual updates)
- **News:** 10 minutes (balance freshness with limits)

Cached data shown when rate limits exceeded. Price data has 15-20 minute delay (not real-time).

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API routes (prices, financials, news)
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── charts/           # Price & comparison charts
│   ├── financials/       # Financial tables & metrics
│   ├── news/             # News list & filters
│   ├── portfolio/        # Portfolio tracking components
│   ├── ticker/           # Ticker input & chips
│   └── ui/               # Base UI components
├── lib/
│   ├── hooks/            # React Query hooks & portfolio hook
│   ├── providers/        # API provider implementations
│   ├── transformers/     # Data transformation logic
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utilities (retry, formatting, validation, portfolio)
└── __tests__/            # Unit & E2E tests
```

## License

MIT
