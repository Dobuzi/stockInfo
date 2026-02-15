# Fundamental Comparison Enhancement

**Date:** February 15, 2026
**Status:** Design Approved
**Goal:** Add side-by-side fundamental metrics comparison for evaluating multiple stocks

---

## Overview

Enhance the Stock Dashboard with intelligent comparison capabilities that automatically switch between detail view (1 ticker) and comparison view (2+ tickers), allowing users to evaluate multiple stocks side-by-side using key fundamental metrics.

---

## Architecture

### Integration Approach

The comparison feature integrates into the existing dashboard with minimal architectural changes:

**Current Behavior (1 ticker):**
- Dashboard renders detail sections: price chart, financials, news

**New Behavior (2+ tickers):**
- Dashboard renders comparison table instead of detail sections
- Comparison table fetches company overview + key metrics for all tickers
- Uses same caching strategy (React Query + server-side cache)
- Clicking a ticker chip switches to detail view for that specific stock

**Key Principle:** Conditional rendering based on ticker count and selection state - the dashboard component already manages ticker state, we just add view logic.

---

## Data Layer

### New API Endpoint

**Route:** `app/api/overview/route.ts`

**Purpose:** Fetch company fundamentals and key metrics for a single ticker

**Data Source:** Alpha Vantage `OVERVIEW` function
- Included in free tier (same 25 calls/day limit)
- Returns comprehensive fundamental data
- Server-side cache: 24 hours (fundamentals change infrequently)

**Response Structure:**
```typescript
{
  ticker: string;
  data: {
    // Company Info
    name: string;
    sector: string;
    industry: string;
    marketCap: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    averageVolume: number;

    // Valuation
    peRatio: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
    evToEbitda: number | null;

    // Profitability
    profitMargin: number | null;
    operatingMargin: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;

    // Growth
    revenue: number | null;
    quarterlyRevenueGrowth: number | null;
    quarterlyEarningsGrowth: number | null;
    eps: number | null;

    // Financial Health
    debtToEquity: number | null;
    currentRatio: number | null;
    quickRatio: number | null;
    bookValue: number | null;

    // Dividends (optional)
    dividendYield: number | null;
    dividendPerShare: number | null;
    payoutRatio: number | null;
  }
}
```

### New Transformer

**File:** `lib/transformers/overview.ts`

**Purpose:** Transform Alpha Vantage OVERVIEW response to consistent format

**Functions:**
- `transformOverview(raw: AlphaVantageOverview): OverviewData` - Parse and normalize API response
- `formatMetric(value: string | undefined, type: 'number' | 'percent' | 'currency'): number | null` - Convert strings to numbers, handle "None"/"N/A"

### New Hook

**File:** `lib/hooks/useOverview.ts`

**Purpose:** React Query hook for fetching overview data

**Implementation:**
```typescript
export function useOverview(ticker: string) {
  return useQuery({
    queryKey: ['overview', ticker],
    queryFn: async () => {
      const response = await fetch(`/api/overview?ticker=${ticker}`);
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    },
    enabled: !!ticker && ticker.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });
}
```

### Data Flow

1. User adds tickers → triggers 2+ ticker state
2. Dashboard renders `ComparisonTable` component
3. `ComparisonTable` uses `useOverview` hook for each ticker
4. Hooks fetch in parallel from `/api/overview?ticker=AAPL`
5. Server checks cache (24hr TTL) → returns cached or fetches from Alpha Vantage
6. Client caches results (5min stale time)
7. Table renders with side-by-side metrics

---

## Components

### New Component: ComparisonTable

**File:** `components/comparison/ComparisonTable.tsx`

**Props:**
```typescript
interface ComparisonTableProps {
  tickers: string[];
}
```

**Structure:**
- Sticky header row with ticker symbols
- Grouped metric sections (collapsible on mobile)
- Each row: metric name + values for each ticker
- Responsive: horizontal scroll on mobile, full table on desktop

**Visual Design:**
- Alternating row colors for readability
- Color coding: relative comparison within row (green = best, red = worst for applicable metrics)
- Compact layout to fit 20+ metrics
- Dark mode support
- Loading skeleton for each ticker column
- "N/A" for missing/unavailable data

**Metric Groups:**

1. **Company Information**
   - Name, Sector, Industry
   - Market Cap, 52W High/Low, Avg Volume

2. **Valuation Metrics**
   - P/E Ratio, Forward P/E, PEG Ratio
   - P/B, P/S, EV/EBITDA

3. **Profitability**
   - Profit Margin %, Operating Margin %
   - ROE %, ROA %

4. **Growth**
   - Revenue (TTM), Quarterly Revenue Growth %
   - Quarterly Earnings Growth %, EPS

5. **Financial Health**
   - Debt-to-Equity, Current Ratio
   - Quick Ratio, Book Value Per Share

6. **Dividends** (if applicable)
   - Dividend Yield %, Dividend Per Share
   - Payout Ratio %

### Updated Component: DashboardPage

**File:** `app/page.tsx`

**Changes:**

Add view switching logic:
```typescript
const { tickers, addTicker, removeTicker } = useTickers();
const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

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
  if (tickers.length >= 2 && selectedTicker && tickers.length > previousLength) {
    setSelectedTicker(null);
  }
}, [tickers.length]);

return (
  <main>
    <TickerSection />

    {showEmpty && <EmptyState />}

    {showComparison && (
      <ComparisonTable tickers={tickers} />
    )}

    {showDetail && (
      <>
        <PriceChartSection ticker={selectedTicker} />
        <FinancialsSection ticker={selectedTicker} />
        <NewsSection ticker={selectedTicker} />
      </>
    )}
  </main>
);
```

Update `TickerChips` to handle selection:
```typescript
<TickerChips
  tickers={tickers}
  onRemove={removeTicker}
  selectedTicker={selectedTicker}
  onSelect={(ticker) => {
    if (selectedTicker === ticker && tickers.length >= 2) {
      setSelectedTicker(null); // Deselect → back to comparison
    } else {
      setSelectedTicker(ticker); // Select → show detail
    }
  }}
/>
```

---

## View Switching Logic

### State Management

**State Variables:**
- `tickers: string[]` - all added tickers (persisted in localStorage via `useTickers`)
- `selectedTicker: string | null` - currently selected ticker for detail view

**View Decision:**
```typescript
const showComparison = tickers.length >= 2 && !selectedTicker;
const showDetail = tickers.length >= 1 && selectedTicker;
const showEmpty = tickers.length === 0;
```

### User Flow Scenarios

| Action | Before State | After State | View Shown |
|--------|-------------|-------------|------------|
| Add 1st ticker | 0 tickers | 1 ticker, auto-selected | Detail |
| Add 2nd ticker | 1 ticker, selected | 2 tickers, none selected | Comparison |
| Click ticker chip | 2+ tickers, none selected | 2+ tickers, one selected | Detail |
| Click selected chip | 2+ tickers, one selected | 2+ tickers, none selected | Comparison |
| Remove selected ticker | 2+ tickers, one selected | 1+ tickers, none selected → auto-select first | Detail (if 1 remains) or Comparison (if 2+ remain) |
| Remove unselected ticker | 2+ tickers, one selected | 1+ tickers, still selected | Detail |

### Visual Indicators

- **Selected ticker chip:** Highlighted border/background (e.g., blue ring)
- **Unselected chips in comparison view:** Default state (no highlight)
- **Hover state:** Show "Click to view details" tooltip

---

## Error Handling

### Individual Ticker Failures

- If one ticker's overview data fails → show "Error" in that column
- Other tickers continue to display normally
- Allows partial comparison even if one API call fails

### Rate Limit Handling

- Server returns cached data with metadata: `{ data, cached: true, cachedAt: timestamp }`
- UI shows indicator: "Last updated: 2 hours ago"
- Graceful message: "Rate limit reached, showing cached data"

### Missing Metrics

- Display "N/A" for metrics not available from API
- Common scenarios:
  - Non-dividend stocks → dividend metrics = N/A
  - Startups/unprofitable companies → P/E ratio = N/A
  - Private companies (shouldn't happen) → most metrics = N/A

### Loading States

- Skeleton loader for each ticker column while fetching
- Shows metric labels immediately
- Values load progressively as each ticker's data arrives
- Parallel fetching means tickers load independently

---

## Testing Strategy

### Unit Tests

**File:** `__tests__/unit/overview-transformer.test.ts`

Test cases:
- Transform complete Alpha Vantage response
- Handle missing/null fields → return null
- Handle "None" string → return null
- Format large numbers (market cap, revenue)
- Format percentages correctly
- Format ratios with proper decimal places

**File:** `__tests__/unit/formatting.test.ts` (extend existing)

Add test cases:
- `formatMetric()` - number, percent, currency types
- Handle edge cases (zero, negative, very large numbers)

### Component Tests

**File:** `__tests__/unit/ComparisonTable.test.tsx`

Test cases:
- Render with 2 tickers → shows 2 columns
- Render with 5 tickers → shows 5 columns
- Loading state → shows skeleton
- Error state for one ticker → shows "Error" in column
- Missing metrics → shows "N/A"
- Metric grouping → renders all 6 sections
- Color coding → highlights best/worst values

### Integration Tests

**File:** `__tests__/integration/view-switching.test.tsx`

Test cases:
- Add 1 ticker → detail view shown
- Add 2nd ticker → comparison view shown
- Click ticker chip in comparison → detail view shown
- Click selected chip → back to comparison
- Remove ticker while selected → appropriate view shown

### E2E Tests

**File:** `__tests__/e2e/comparison.spec.ts`

Test flow:
1. Start with empty dashboard
2. Add "AAPL" → verify detail view
3. Add "GOOGL" → verify comparison table appears
4. Verify comparison table has both tickers
5. Verify key metrics are displayed (market cap, P/E, etc.)
6. Click "AAPL" chip → verify detail view for AAPL
7. Click "AAPL" chip again → verify back to comparison
8. Remove "GOOGL" → verify detail view for AAPL only

**Update:** `__tests__/e2e/smoke.spec.ts`

Add comparison flow to existing smoke test.

---

## Performance Considerations

### Parallel Data Fetching

- All tickers' overview data fetched in parallel (React Query batching)
- No sequential waterfall - independent queries
- Total time = slowest ticker fetch time (not sum of all)

### Caching Strategy

**Server-side (Next.js `unstable_cache`):**
- TTL: 24 hours
- Tag: `overview-{ticker}`
- Revalidate: manual via revalidateTag if needed

**Client-side (React Query):**
- Stale time: 5 minutes
- GC time: 30 minutes
- Background refetch on focus/reconnect

### Rate Limit Optimization

- With 25 calls/day limit:
  - Each ticker's overview = 1 call (first fetch)
  - Cached for 24 hours
  - Typical usage: 5-10 tickers compared per day = sustainable
- Cache-first strategy minimizes API calls

---

## Future Enhancements (Out of Scope)

- Export comparison table as CSV/PNG
- Custom metric selection (choose which metrics to display)
- Sort by column (sort tickers by P/E ratio, market cap, etc.)
- Highlight/color code user-defined thresholds (e.g., P/E > 30 = red)
- Save comparison presets ("Tech Giants", "Value Stocks", etc.)
- Historical metric comparison (compare P/E ratios over time)

---

## Success Criteria

- ✅ Adding 2+ tickers automatically shows comparison table
- ✅ Comparison table displays all 6 metric groups with accurate data
- ✅ Clicking ticker chip switches to detail view
- ✅ Clicking selected chip returns to comparison view
- ✅ Loading states and errors handled gracefully
- ✅ All tests passing (unit, integration, E2E)
- ✅ No performance degradation (parallel fetching, caching)
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ Dark mode support throughout

---

## Implementation Notes

- Follow TDD methodology for transformers and utilities
- Reuse existing patterns: provider factory, caching, error handling
- Maintain consistent styling with existing components
- Update CLAUDE.md with new components and patterns
- Update README.md with comparison feature documentation
