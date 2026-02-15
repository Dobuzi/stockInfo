# Portfolio Tracking Design

**Date:** February 15, 2026
**Status:** Design Approved
**Goal:** Add basic portfolio tracking to monitor holdings, calculate P&L, and visualize allocation

---

## Overview

Add a dedicated Portfolio feature to the Stock Dashboard that allows users to track their stock holdings, view profit/loss calculations, and visualize portfolio allocation. This feature operates independently from the watchlist, enabling users to track investments separately from stocks they're analyzing.

---

## Architecture

### Integration Approach

The portfolio feature integrates as a new tab in the dashboard with independent state management:

**Dashboard Structure:**
- **Existing:** Tickers section (watchlist) → Price Charts → Financials → News → Comparison
- **New:** Portfolio tab (peer to Tickers section)

**Navigation:**
- Tab selector: "Watchlist" | "Portfolio"
- Portfolio tab shows when selected
- Independent of ticker selection state
- Persistent tab selection (could use URL params or localStorage)

**Data Architecture:**
```
Portfolio Holdings (localStorage)
    ↓
usePortfolio hook (state management)
    ↓
Fetch current prices (usePrices hook)
    ↓
Calculate P&L client-side
    ↓
Display in Portfolio components
```

**Key Principle:** Portfolio and watchlist are independent features serving different purposes:
- **Watchlist:** Stocks to analyze and research
- **Portfolio:** Stocks currently owned for investment tracking

They share no state, though tickers can exist in both lists.

---

## Data Model

### Holding Structure

```typescript
interface Holding {
  id: string;           // UUID v4 for unique identification
  ticker: string;       // Stock symbol (e.g., "AAPL") - uppercase, normalized
  quantity: number;     // Number of shares (supports decimals: 0.001 precision)
  avgCost: number;      // Average cost per share in USD (2 decimal precision)
  addedDate: string;    // ISO 8601 date (YYYY-MM-DD) when holding was added
}
```

### Storage

**localStorage Key:** `stock-dashboard-portfolio`

**Format:** JSON array of holdings

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticker": "AAPL",
    "quantity": 10,
    "avgCost": 150.25,
    "addedDate": "2024-01-15"
  },
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "ticker": "GOOGL",
    "quantity": 5.5,
    "avgCost": 140.00,
    "addedDate": "2024-02-01"
  }
]
```

**Constraints:**
- Max Holdings: Unlimited (no artificial limit)
- Unique Tickers: One holding per ticker (edit to update, or delete and re-add)
- Fractional Shares: Supported (min: 0.001)

### State Management

**New Hook:** `lib/hooks/usePortfolio.ts`

Follows same pattern as `useTickers`:

```typescript
interface UsePortfolioReturn {
  holdings: Holding[];
  addHolding: (holding: Omit<Holding, 'id'>) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
}

export function usePortfolio(): UsePortfolioReturn {
  // SSR-safe initialization from localStorage
  // Auto-persist on every change via useEffect
  // Validation on add/update
}
```

**Validation Rules:**
- **Ticker:** Must match validation regex (1-5 uppercase letters, optional dot/dash)
- **Quantity:** Must be > 0
- **Avg Cost:** Must be > 0
- **No Duplicates:** Cannot add ticker that already exists in portfolio

---

## P&L Calculations

All calculations happen client-side using current prices fetched from API.

### Per-Holding Calculations

**Inputs:**
- `holding.quantity` - Number of shares
- `holding.avgCost` - Average cost per share
- `currentPrice` - Latest price from API

**Calculations:**
```typescript
// Cost basis (total amount invested)
costBasis = quantity * avgCost

// Current market value
currentValue = quantity * currentPrice

// Absolute gain/loss
gainLoss = currentValue - costBasis

// Percentage gain/loss
gainLossPercent = (gainLoss / costBasis) * 100
```

**Example:**
- Holding: 10 shares of AAPL @ $150 avg cost
- Current Price: $180
- Cost Basis: 10 × $150 = $1,500
- Current Value: 10 × $180 = $1,800
- Gain/Loss: $1,800 - $1,500 = +$300
- Gain/Loss %: ($300 / $1,500) × 100 = +20%

### Portfolio Totals

**Total Cost (Amount Invested):**
```typescript
totalCost = sum(holding.quantity * holding.avgCost)
```

**Total Current Value:**
```typescript
totalValue = sum(holding.quantity * currentPrice)
```

**Total Gain/Loss:**
```typescript
totalGainLoss = totalValue - totalCost
```

**Portfolio Return Percentage:**
```typescript
portfolioReturn = (totalGainLoss / totalCost) * 100
```

### Allocation Calculation

**Per-Holding Allocation:**
```typescript
allocation = (holding.currentValue / totalValue) * 100
```

**Validation:** Sum of all allocations should equal 100%

### Data Fetching Strategy

**Current Prices:**
- Use existing `usePrices` hook for each ticker
- Fetch 1D range (only need latest price)
- React Query caching applies (5min stale time)
- Fetch all tickers in parallel

**Error Handling:**
- If price fetch fails for a ticker: Show "N/A" for calculations
- If all prices fail: Show error message with retry button
- Partial failures: Show available data, mark failed tickers

**Real-time Updates:**
- Calculations re-run automatically when prices update
- React Query background refetch on window focus/reconnect
- No manual refresh needed

---

## UI Components

### Component Hierarchy

```
PortfolioTab
├── PortfolioSummary (summary cards)
│   ├── SummaryCard (Total Value)
│   ├── SummaryCard (Total Gain/Loss)
│   └── SummaryCard (Portfolio Return %)
├── PortfolioActions (action bar)
│   ├── AddHoldingButton
│   └── HoldingsCount
├── HoldingsTable
│   ├── HoldingRow (per holding)
│   │   ├── Ticker
│   │   ├── Quantity
│   │   ├── Avg Cost
│   │   ├── Current Price
│   │   ├── Current Value
│   │   ├── Gain/Loss
│   │   └── Actions (Edit, Delete)
│   └── TableSorting
├── AllocationChart
│   ├── PieChart
│   └── Legend
└── AddHoldingModal / EditHoldingModal
```

### Portfolio Tab Layout

**1. Summary Cards Row** (3 cards, responsive grid)

**Card 1: Total Value**
- Primary metric: Current portfolio value (large, bold)
- Example: "$25,450.00"
- Color: Neutral (gray text)

**Card 2: Total Gain/Loss**
- Primary metric: Dollar gain/loss
- Example: "+$3,200.00" or "-$1,500.00"
- Color: Green (positive) / Red (negative)
- Icon: Up arrow (gain) / Down arrow (loss)

**Card 3: Portfolio Return**
- Primary metric: Percentage return
- Example: "+14.4%" or "-8.2%"
- Color: Green (positive) / Red (negative)
- Icon: Up arrow (gain) / Down arrow (loss)

**Mobile:** Stack cards vertically

---

**2. Action Bar**

- "Add Holding" button (primary, blue)
- Holdings count badge: "5 Holdings"
- Position: Flex row, space-between

---

**3. Holdings Table** (responsive, sortable)

**Columns:**
- Ticker (sortable, default sort)
- Quantity (right-aligned)
- Avg Cost (right-aligned, currency)
- Current Price (right-aligned, currency)
- Current Value (right-aligned, currency)
- Gain/Loss (right-aligned, currency + percentage, color-coded)
- Actions (edit icon, delete icon)

**Styling:**
- Alternating row colors for readability
- Hover state on rows
- Sticky header on scroll
- Green text for positive gains
- Red text for losses

**Mobile:**
- Stack columns as cards
- Show ticker + gain/loss prominently
- Collapse other details (expandable)

**Sorting:**
- Click column header to sort
- Default: Ticker (alphabetical)
- Supported: Ticker, Current Value, Gain/Loss

---

**4. Allocation Chart** (below table)

**Chart Type:** Pie chart (using recharts library)

**Data:**
- Each slice = one holding
- Slice size = holding's percentage of total portfolio value
- Colors: Distinct colors per ticker (use consistent color palette)

**Legend:**
- Ticker symbol + allocation percentage
- Example: "AAPL - 45.2%"
- Clickable to highlight slice

**Responsive:**
- Desktop: Chart + legend side-by-side
- Mobile: Chart above, legend below

---

### Add/Edit Holding Modal

**Modal Trigger:**
- Add: "Add Holding" button
- Edit: Edit icon on holding row

**Form Fields:**

1. **Ticker** (required)
   - Text input, uppercase, trimmed
   - Validation: Must be valid ticker format
   - Error message: "Invalid ticker symbol"
   - Auto-complete from watchlist (optional enhancement)

2. **Quantity** (required)
   - Number input, step: 0.001
   - Min: 0.001
   - Placeholder: "10.5"
   - Validation: Must be > 0
   - Error message: "Quantity must be greater than 0"

3. **Average Cost** (required)
   - Number input, step: 0.01
   - Min: 0.01
   - Placeholder: "150.25"
   - Validation: Must be > 0
   - Error message: "Average cost must be greater than 0"

4. **Date Added** (auto-filled, editable)
   - Date input
   - Default: Today's date
   - Format: YYYY-MM-DD
   - Optional: User can backdate

**Buttons:**
- Cancel (secondary, gray)
- Save (primary, blue) - disabled until form valid

**Edit Mode:**
- Pre-fill all fields with holding data
- Ticker field read-only (cannot change ticker, delete and re-add instead)
- Update button instead of Add

---

### Empty State

When portfolio is empty:
- Large icon (folder or chart)
- Message: "No holdings yet. Add your first holding to start tracking your portfolio."
- Large "Add Holding" button (primary)

---

### Loading States

**Summary Cards:** Show skeleton loaders while fetching prices

**Holdings Table:**
- Current Price column: Skeleton while fetching
- Current Value column: Skeleton while fetching
- Gain/Loss column: Skeleton while fetching

**Allocation Chart:** Show spinner while calculating

---

### Error States

**Price Fetch Failure (single ticker):**
- Show "N/A" in Current Price, Current Value, Gain/Loss columns
- Show warning icon with tooltip: "Unable to fetch current price"

**Price Fetch Failure (all tickers):**
- Show error banner above table
- Message: "Unable to fetch current prices. Please try again."
- Retry button

**Invalid Ticker in Modal:**
- Show error message below ticker input
- Prevent form submission

**Network Error:**
- Toast notification: "Network error. Please check your connection."

---

## Visual Design

### Color Coding

**Gains (Positive):**
- Text color: Green (#10b981)
- Background (subtle): Light green (#d1fae5) for dark mode
- Icon: Up arrow ↑

**Losses (Negative):**
- Text color: Red (#ef4444)
- Background (subtle): Light red (#fee2e2) for dark mode
- Icon: Down arrow ↓

**Neutral:**
- Cost values: Gray text
- Quantity: Gray text

### Typography

**Summary Cards:**
- Value: 2xl font, bold
- Label: sm font, medium weight

**Table:**
- Header: xs font, uppercase, medium weight
- Data: sm font, regular weight
- Currency: Tabular nums for alignment

**Modal:**
- Title: lg font, semibold
- Labels: sm font, medium weight
- Inputs: base font

### Dark Mode

All components support dark mode:
- Cards: Dark gray background (#1f2937)
- Table: Dark rows (#111827, #1f2937 alternating)
- Modal: Dark background with lighter fields
- Chart: Dark theme with light text
- Green/Red: Same colors, sufficient contrast

---

## Data Flow

### Adding a Holding

```
User clicks "Add Holding"
    ↓
Modal opens
    ↓
User fills form (ticker, quantity, avg cost)
    ↓
User clicks "Save"
    ↓
Validate inputs
    ↓
Generate UUID for holding
    ↓
Add to holdings array
    ↓
Persist to localStorage
    ↓
Modal closes
    ↓
Fetch current price for new ticker
    ↓
Calculate P&L
    ↓
Update UI (table + summary + chart)
```

### Editing a Holding

```
User clicks edit icon
    ↓
Modal opens pre-filled
    ↓
User modifies quantity or avg cost
    ↓
User clicks "Update"
    ↓
Validate inputs
    ↓
Update holding in array
    ↓
Persist to localStorage
    ↓
Modal closes
    ↓
Recalculate P/L
    ↓
Update UI
```

### Deleting a Holding

```
User clicks delete icon
    ↓
Confirmation dialog: "Delete [TICKER] from portfolio?"
    ↓
User confirms
    ↓
Remove from holdings array
    ↓
Persist to localStorage
    ↓
Recalculate totals
    ↓
Update UI (table + summary + chart)
```

---

## Testing Strategy

### Unit Tests

**File:** `__tests__/unit/portfolio-calculations.test.ts`

Test P&L calculation utilities:
```typescript
describe('calculateHoldingPnL', () => {
  it('calculates cost basis correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });
    expect(result.costBasis).toBe(1500);
  });

  it('calculates current value correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });
    expect(result.currentValue).toBe(1800);
  });

  it('calculates gain/loss correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });
    expect(result.gainLoss).toBe(300);
    expect(result.gainLossPercent).toBeCloseTo(20, 1);
  });

  it('handles fractional shares', () => {
    const result = calculateHoldingPnL({
      quantity: 5.5,
      avgCost: 100,
      currentPrice: 120,
    });
    expect(result.costBasis).toBe(550);
    expect(result.currentValue).toBe(660);
    expect(result.gainLoss).toBe(110);
  });

  it('handles losses', () => {
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
  it('sums holdings correctly', () => {
    const holdings = [
      { quantity: 10, avgCost: 150, currentPrice: 180 },
      { quantity: 5, avgCost: 200, currentPrice: 220 },
    ];
    const totals = calculatePortfolioTotals(holdings);
    expect(totals.totalCost).toBe(2500); // 1500 + 1000
    expect(totals.totalValue).toBe(2900); // 1800 + 1100
    expect(totals.totalGainLoss).toBe(400);
  });

  it('calculates portfolio return percentage', () => {
    const holdings = [
      { quantity: 10, avgCost: 100, currentPrice: 120 },
    ];
    const totals = calculatePortfolioTotals(holdings);
    expect(totals.portfolioReturn).toBeCloseTo(20, 1);
  });
});

describe('calculateAllocation', () => {
  it('calculates percentages that sum to 100', () => {
    const holdings = [
      { currentValue: 1800 },
      { currentValue: 1100 },
      { currentValue: 1100 },
    ];
    const allocations = calculateAllocation(holdings, 4000);
    expect(allocations).toEqual([45, 27.5, 27.5]);
    expect(allocations.reduce((sum, a) => sum + a, 0)).toBe(100);
  });
});
```

---

### Hook Tests

**File:** `__tests__/unit/usePortfolio.test.ts`

Test portfolio state management:
```typescript
describe('usePortfolio', () => {
  it('initializes from localStorage', () => {
    localStorage.setItem('stock-dashboard-portfolio', JSON.stringify([
      { id: '1', ticker: 'AAPL', quantity: 10, avgCost: 150, addedDate: '2024-01-01' }
    ]));

    const { result } = renderHook(() => usePortfolio());
    expect(result.current.holdings).toHaveLength(1);
    expect(result.current.holdings[0].ticker).toBe('AAPL');
  });

  it('adds holding and persists', () => {
    const { result } = renderHook(() => usePortfolio());

    act(() => {
      result.current.addHolding({
        ticker: 'GOOGL',
        quantity: 5,
        avgCost: 140,
        addedDate: '2024-02-01',
      });
    });

    expect(result.current.holdings).toHaveLength(1);
    expect(result.current.holdings[0].ticker).toBe('GOOGL');

    const stored = JSON.parse(localStorage.getItem('stock-dashboard-portfolio')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].ticker).toBe('GOOGL');
  });

  it('prevents duplicate tickers', () => {
    const { result } = renderHook(() => usePortfolio());

    act(() => {
      result.current.addHolding({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
        addedDate: '2024-01-01',
      });
    });

    act(() => {
      result.current.addHolding({
        ticker: 'AAPL',
        quantity: 5,
        avgCost: 160,
        addedDate: '2024-02-01',
      });
    });

    expect(result.current.holdings).toHaveLength(1);
    expect(result.current.holdings[0].quantity).toBe(10); // First add wins
  });

  it('updates holding', () => {
    const { result } = renderHook(() => usePortfolio());

    act(() => {
      result.current.addHolding({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
        addedDate: '2024-01-01',
      });
    });

    const holdingId = result.current.holdings[0].id;

    act(() => {
      result.current.updateHolding(holdingId, { quantity: 15 });
    });

    expect(result.current.holdings[0].quantity).toBe(15);
  });

  it('removes holding', () => {
    const { result } = renderHook(() => usePortfolio());

    act(() => {
      result.current.addHolding({
        ticker: 'AAPL',
        quantity: 10,
        avgCost: 150,
        addedDate: '2024-01-01',
      });
    });

    const holdingId = result.current.holdings[0].id;

    act(() => {
      result.current.removeHolding(holdingId);
    });

    expect(result.current.holdings).toHaveLength(0);
  });
});
```

---

### Integration Tests

**File:** `__tests__/integration/portfolio-flow.test.tsx`

Test complete portfolio workflows:
```typescript
it('adds holding and displays P&L', async () => {
  render(<PortfolioTab />);

  // Click add button
  await userEvent.click(screen.getByText('Add Holding'));

  // Fill form
  await userEvent.type(screen.getByLabelText('Ticker'), 'AAPL');
  await userEvent.type(screen.getByLabelText('Quantity'), '10');
  await userEvent.type(screen.getByLabelText('Average Cost'), '150');

  // Submit
  await userEvent.click(screen.getByText('Save'));

  // Verify holding appears
  expect(await screen.findByText('AAPL')).toBeInTheDocument();
  expect(screen.getByText('10')).toBeInTheDocument();

  // Verify P&L calculated (mocked price: $180)
  expect(screen.getByText('+$300.00')).toBeInTheDocument();
  expect(screen.getByText('+20.0%')).toBeInTheDocument();
});
```

---

### E2E Tests

**File:** `__tests__/e2e/portfolio.spec.ts`

Test user workflows:
```typescript
test('complete portfolio management flow', async ({ page }) => {
  await page.goto('/');

  // Navigate to Portfolio tab
  await page.click('text=Portfolio');

  // Should show empty state
  await expect(page.locator('text=No holdings yet')).toBeVisible();

  // Add first holding
  await page.click('text=Add Holding');
  await page.fill('input[name="ticker"]', 'AAPL');
  await page.fill('input[name="quantity"]', '10');
  await page.fill('input[name="avgCost"]', '150');
  await page.click('button:has-text("Save")');

  // Verify holding appears
  await expect(page.locator('text=AAPL')).toBeVisible();

  // Verify summary cards update
  const totalValue = page.locator('text=Total Value').locator('..');
  await expect(totalValue).toContainText('$');

  // Edit holding
  await page.click('[aria-label="Edit AAPL"]');
  await page.fill('input[name="quantity"]', '15');
  await page.click('button:has-text("Update")');

  // Verify quantity updated
  await expect(page.locator('td:has-text("15")')).toBeVisible();

  // Delete holding
  await page.click('[aria-label="Delete AAPL"]');
  await page.click('button:has-text("Confirm")');

  // Verify back to empty state
  await expect(page.locator('text=No holdings yet')).toBeVisible();
});

test('displays allocation chart', async ({ page }) => {
  // ... add multiple holdings
  // Verify pie chart renders
  // Verify legend shows all tickers
});
```

---

## Performance Considerations

### Data Fetching

**Current Prices:**
- Parallel fetching for all holdings (React Query batching)
- Each ticker fetches independently (non-blocking)
- Cached for 5 minutes (existing React Query config)

**Optimization:**
- Only fetch prices for holdings, not all watchlist tickers
- Stale-while-revalidate strategy (show cached while fetching fresh)

### Calculation Performance

**P&L Calculations:**
- O(n) complexity where n = number of holdings
- Typical: 5-20 holdings = negligible compute time (< 1ms)
- Memoize portfolio totals (useMemo)

### Rendering Performance

**Holdings Table:**
- Virtual scrolling if > 50 holdings (react-virtual)
- Memoize table rows (React.memo)

**Allocation Chart:**
- Only re-render when data changes
- Lightweight library (recharts optimized for React)

---

## Future Enhancements (Out of Scope)

- Transaction history (buy/sell log)
- Cost basis methods (FIFO, LIFO, Specific Identification)
- Realized vs unrealized gains tracking
- Dividend tracking
- Export portfolio to CSV
- Import holdings from brokerage CSV
- Historical portfolio performance chart
- Multi-currency support
- Tax lot tracking
- Benchmarking (compare to S&P 500)

---

## Success Criteria

- ✅ Portfolio tab accessible from dashboard
- ✅ Add holdings via modal form
- ✅ Edit existing holdings
- ✅ Delete holdings with confirmation
- ✅ Holdings table displays all data correctly
- ✅ Summary cards show accurate totals
- ✅ Allocation pie chart displays proportions
- ✅ P&L calculations accurate (validated against manual calculations)
- ✅ Green/red color coding for gains/losses
- ✅ Data persists across sessions (localStorage)
- ✅ Responsive on mobile/tablet/desktop
- ✅ Dark mode support throughout
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ No TypeScript errors
- ✅ Production build successful

---

## Implementation Notes

- Follow TDD methodology for calculation utilities
- Use recharts library for pie chart (already used for comparison charts)
- Reuse existing validation utilities (validateTicker)
- Maintain consistency with existing modal styling
- Update CLAUDE.md with portfolio data flow
- Update README.md with portfolio feature documentation
