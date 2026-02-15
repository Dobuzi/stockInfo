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

Get free API keys from:
- [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (prices & financials)
- [Finnhub](https://finnhub.io/register) (news)

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
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
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

## API Limitations

- **Alpha Vantage:** 25 calls/day (free tier)
- **Finnhub:** 60 calls/minute (free tier)
- Cached data shown when rate limits exceeded
- 15-20 minute delay on price data (not real-time)

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API routes (prices, financials, news)
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── charts/           # Price & comparison charts
│   ├── financials/       # Financial tables & metrics
│   ├── news/             # News list & filters
│   ├── ticker/           # Ticker input & chips
│   └── ui/               # Base UI components
├── lib/
│   ├── hooks/            # React Query hooks
│   ├── providers/        # API provider implementations
│   ├── transformers/     # Data transformation logic
│   └── utils/            # Utilities (retry, formatting, validation)
└── __tests__/            # Unit & E2E tests
```

## License

MIT
