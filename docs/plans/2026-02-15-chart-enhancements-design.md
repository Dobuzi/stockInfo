# Chart Enhancements Design - Volume Bars & Moving Averages

**Date:** February 15, 2026
**Status:** Design Approved
**Goal:** Add volume bars and simple moving averages (20/50/200-day) to price charts for essential technical analysis

---

## Overview

Enhance the existing PriceChart component to display volume bars in a separate pane below the price chart, and overlay three simple moving averages (20-day, 50-day, 200-day) on the candlestick chart. This provides traders with the essential technical analysis tools needed to identify trends and confirm price movements.

---

## Architecture

### Integration Approach

The enhancement modifies the existing `PriceChart` component with minimal architectural changes:

**Current Structure:**
- Single candlestick chart using lightweight-charts v5.1.0
- Receives `PriceData[]` which already includes volume field
- Displays OHLC candlestick data only

**Enhanced Structure:**
- **Top pane (70% height):** Candlestick chart + 3 SMA line overlays (20/50/200-day)
- **Bottom pane (30% height):** Volume histogram
- Both panes share synchronized time scale (zoom/pan together)
- Each pane has independent price/volume scale

**Data Flow:**
```
Existing PriceData[] (OHLC + volume)
    ↓
calculateSMA(data, 20) → SMA 20-day series
calculateSMA(data, 50) → SMA 50-day series
calculateSMA(data, 200) → SMA 200-day series
    ↓
PriceChart renders:
  - Top pane: Candlesticks + 3 SMA overlays
  - Bottom pane: Volume histogram
```

**Key Principle:** Enhance, don't replace - extend the existing PriceChart component with new series while maintaining backward compatibility.

---

## SMA Calculation

### Algorithm

Simple Moving Average calculation for each period (20, 50, 200 days):

**Formula:**
```
SMA[i] = (Close[i] + Close[i-1] + ... + Close[i-period+1]) / period
```

**Implementation:**

New utility: `lib/utils/indicators.ts`

```typescript
export interface IndicatorPoint {
  time: string;
  value: number;
}

export function calculateSMA(
  data: PriceData[],
  period: number
): IndicatorPoint[] {
  if (data.length < period) {
    return []; // Not enough data for this period
  }

  const result: IndicatorPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const average = sum / period;

    result.push({
      time: data[i].date,
      value: average,
    });
  }

  return result;
}
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Data length < period | Return empty array (skip that SMA) |
| 1-day range | No SMAs shown |
| 1-week range (~5 days) | No SMAs shown |
| 1-month range (~21 days) | Only 20-day SMA shown |
| 3-month range (~63 days) | 20 and 50-day SMAs shown |
| 1-year+ range | All SMAs (20/50/200) shown |
| NaN/null in data | Skip those data points |

### Performance

**Complexity:** O(n*p) where n = data points, p = period
- Typical: 252 days × 3 SMAs = ~756 iterations
- Execution time: < 1ms
- Calculated once when data loads, cached in component state

---

## Chart Layout

### Pane Structure

**Overall Chart:**
- Total height: 550px (increased from current 400px)
- Width: Responsive (fills container)

**Top Pane (Price Chart):**
- Height: ~400px (70% of total)
- Contents:
  - Candlestick series (base layer)
  - 20-day SMA line series (overlay)
  - 50-day SMA line series (overlay)
  - 200-day SMA line series (overlay)
- Price scale: Right axis (auto-scaled)

**Bottom Pane (Volume):**
- Height: ~150px (30% of total)
- Contents: Histogram series
- Volume scale: Right axis (auto-scaled, separate from price)
- Gap: 10px separator between panes

**Synchronization:**
- **Time scale:** Shared - scrolling/zooming one pane affects both
- **Price scales:** Independent - price uses dollars, volume uses share count
- **Crosshair:** Synchronized - shows time on both panes

### Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| Desktop (>1024px) | Full 550px height, legend visible |
| Tablet (640-1024px) | Full 550px height, legend visible |
| Mobile (<640px) | Scaled to 450px total, legend hidden |

---

## Visual Design

### Moving Average Styling

**Colors:**
- **20-day SMA:** Blue (`#3b82f6`) - short-term trend
- **50-day SMA:** Orange (`#f97316`) - medium-term trend
- **200-day SMA:** Purple (`#a855f7`) - long-term trend

**Line Properties:**
- Width: 2px
- Opacity: 90%
- Style: Solid lines
- Line style: Continuous (not dashed)

**Rationale:**
- Blue/Orange/Purple: High contrast, colorblind-friendly, distinct from candlestick green/red
- 2px width: Visible but not overwhelming
- 90% opacity: Allows seeing candlesticks underneath

### Volume Histogram Styling

**Colors:**
- **Up volume (close > previous close):** Green (`#10b981`)
- **Down volume (close < previous close):** Red (`#ef4444`)
- Matches candlestick up/down colors for consistency

**Bar Properties:**
- Opacity: 70%
- Width: Auto (fills available space per time unit)
- No border

**Rationale:**
- 70% opacity: Visible but recedes to background, keeps focus on price
- Color matching: Reinforces price direction correlation

### Legend

**Position:** Top-right corner of price pane (floating overlay)

**Content:**
```
SMA 20 • SMA 50 • SMA 200
```

**Styling:**
- Small colored dots before each label (matching SMA colors)
- Font size: 12px
- Background: Semi-transparent white/gray (dark mode aware)
- Padding: 8px
- Border radius: 4px

**Responsive:**
- Hidden on mobile (<640px) to save space
- Visible on tablet and desktop

### Dark Mode

**Compatibility:**
- All SMA colors (blue/orange/purple) have sufficient contrast in both light and dark modes
- Grid lines already adapt via existing theme system
- Volume colors (green/red) work in both modes
- Legend background adapts: `bg-white/80 dark:bg-gray-800/80`

**Visual Hierarchy:**
1. **Primary:** Candlesticks (most prominent, solid colors)
2. **Secondary:** Moving averages (trend context, semi-transparent lines)
3. **Tertiary:** Volume (supporting data, faded histogram)

---

## Component Changes

### Modified Component: PriceChart

**File:** `components/charts/PriceChart.tsx`

**New Props (optional, for future extensibility):**
```typescript
interface PriceChartProps {
  data: PriceData[];
  height?: number;
  showVolume?: boolean;     // Default: true
  showSMAs?: boolean;        // Default: true
  smaPerios?: number[];      // Default: [20, 50, 200]
}
```

**Implementation Changes:**

1. **Calculate SMAs:**
```typescript
const sma20 = calculateSMA(data, 20);
const sma50 = calculateSMA(data, 50);
const sma200 = calculateSMA(data, 200);
```

2. **Create volume data:**
```typescript
const volumeData = data.map(d => ({
  time: d.date,
  value: d.volume,
  color: d.close >= d.open ? '#10b981' : '#ef4444',
}));
```

3. **Add SMA series to price chart:**
```typescript
const sma20Line = chart.addLineSeries({
  color: '#3b82f6',
  lineWidth: 2,
  priceLineVisible: false,
  lastValueVisible: false,
});
sma20Line.setData(sma20);
// Repeat for sma50 and sma200
```

4. **Add volume pane:**
```typescript
const volumeSeries = chart.addHistogramSeries({
  priceFormat: { type: 'volume' },
  priceScaleId: 'volume',
});
volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.8, bottom: 0 },
});
volumeSeries.setData(volumeData);
```

5. **Add legend:**
```typescript
<div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 rounded px-2 py-1 text-xs hidden sm:block">
  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
  SMA 20
  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-2 mr-1" />
  SMA 50
  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 ml-2 mr-1" />
  SMA 200
</div>
```

---

## Testing Strategy

### Unit Tests

**File:** `__tests__/unit/indicators.test.ts`

Test SMA calculation:
```typescript
describe('calculateSMA', () => {
  it('calculates 20-day SMA correctly', () => {
    const data = generateTestData(30); // 30 days of price data
    const sma = calculateSMA(data, 20);

    expect(sma).toHaveLength(11); // 30 - 20 + 1
    expect(sma[0].value).toBeCloseTo(expectedAverage, 2);
  });

  it('returns empty array when data length < period', () => {
    const data = generateTestData(10);
    const sma = calculateSMA(data, 20);

    expect(sma).toEqual([]);
  });

  it('handles period = 1 (returns closing prices)', () => {
    const data = generateTestData(5);
    const sma = calculateSMA(data, 1);

    expect(sma).toHaveLength(5);
    expect(sma[0].value).toBe(data[0].close);
  });

  it('calculates multiple SMAs correctly', () => {
    const data = generateTestData(252); // 1 year

    const sma20 = calculateSMA(data, 20);
    const sma50 = calculateSMA(data, 50);
    const sma200 = calculateSMA(data, 200);

    expect(sma20).toHaveLength(233);
    expect(sma50).toHaveLength(203);
    expect(sma200).toHaveLength(53);
  });
});
```

### Component Tests

Test PriceChart rendering (visual regression):
- Snapshot test with volume + SMAs enabled
- Verify correct number of series added to chart
- Test responsive behavior (height scaling)

### Integration Tests

**File:** `__tests__/integration/chart-indicators.test.tsx`

Test with real data flow:
```typescript
it('displays SMAs when data is sufficient', async () => {
  const { container } = render(
    <PriceChart data={mockPriceData252Days} />
  );

  // Wait for chart to render
  await waitFor(() => {
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  // Verify SMAs calculated (check data length)
  // Note: Actual visual verification requires E2E
});

it('hides 200-day SMA when data < 200 days', async () => {
  const { container } = render(
    <PriceChart data={mockPriceData100Days} />
  );

  // Only 20 and 50-day SMAs should be calculated
});
```

### E2E Tests

**File:** `__tests__/e2e/chart-enhancements.spec.ts`

Visual verification:
```typescript
test('displays volume bars and SMAs on price chart', async ({ page }) => {
  await page.goto('/');

  // Add ticker
  await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
  await page.click('button:has-text("Add")');

  // Wait for chart to load
  await expect(page.locator('canvas')).toBeVisible();

  // Verify legend shows SMA indicators
  await expect(page.locator('text=SMA 20')).toBeVisible();
  await expect(page.locator('text=SMA 50')).toBeVisible();
  await expect(page.locator('text=SMA 200')).toBeVisible();

  // Visual check: Take screenshot for manual verification
  await page.screenshot({
    path: 'test-results/chart-with-indicators.png',
    fullPage: false
  });
});

test('volume pane shows below price chart', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'TSLA');
  await page.click('button:has-text("Add")');

  await expect(page.locator('canvas')).toBeVisible();

  // Chart should be taller (550px vs original 400px)
  const chartContainer = page.locator('div').filter({ has: page.locator('canvas') }).first();
  const height = await chartContainer.evaluate(el => el.clientHeight);
  expect(height).toBeGreaterThan(500);
});
```

### Manual Testing Checklist

**Visual Verification:**
- [ ] 20-day SMA displays in blue with correct line width
- [ ] 50-day SMA displays in orange
- [ ] 200-day SMA displays in purple
- [ ] Volume histogram shows below price chart
- [ ] Up volume bars are green, down volume bars are red
- [ ] Panes zoom together when scrolling
- [ ] Panes pan together when dragging
- [ ] Crosshair synchronizes across panes
- [ ] Legend shows in top-right corner (desktop)
- [ ] Legend hidden on mobile (<640px)
- [ ] Dark mode: all elements remain visible
- [ ] Dark mode: colors have sufficient contrast

**Edge Cases:**
- [ ] 1-day range: No SMAs visible (expected)
- [ ] 1-week range: No SMAs visible (insufficient data)
- [ ] 1-month range: Only 20-day SMA visible
- [ ] 3-month range: 20 and 50-day SMAs visible
- [ ] 1-year range: All SMAs (20/50/200) visible

**Technical Analysis Accuracy:**
- [ ] SMAs cross at appropriate points (visual verification against known data)
- [ ] "Golden cross" (50 crosses above 200) displays correctly
- [ ] "Death cross" (50 crosses below 200) displays correctly
- [ ] Volume spikes correlate with price movements

---

## Performance Considerations

### Calculation Performance

**SMA Computation:**
- Time complexity: O(n*p) where n = data points, p = period
- Typical case: 252 days × 3 SMAs = ~756 iterations
- Execution time: < 1ms (negligible)
- Runs once per data update (cached in component)

**Rendering Performance:**
- lightweight-charts optimized for multiple series
- Volume histogram: negligible overhead
- 3 additional line series: minimal impact
- Total render time increase: < 5ms

### Memory Usage

**Additional Data:**
- SMA arrays: ~2KB per SMA (252 points × 8 bytes)
- Total: ~6KB for all 3 SMAs
- Volume data: already exists in PriceData
- Total memory increase: < 10KB

### Optimization Strategies

**Memoization:**
```typescript
const smaData = useMemo(() => ({
  sma20: calculateSMA(data, 20),
  sma50: calculateSMA(data, 50),
  sma200: calculateSMA(data, 200),
}), [data]);
```

**Conditional Calculation:**
- Only calculate SMAs when data length permits
- Skip 200-day if data < 200 points (saves computation)

---

## Future Enhancements (Out of Scope)

- Exponential Moving Averages (EMA) - weighted toward recent prices
- RSI (Relative Strength Index) - momentum oscillator
- MACD (Moving Average Convergence Divergence) - trend indicator
- Bollinger Bands - volatility bands around price
- Configurable SMA periods (user-customizable)
- Toggle indicators on/off (show/hide specific SMAs)
- Volume-weighted average price (VWAP)
- On-chart annotations (support/resistance lines)

---

## Success Criteria

- ✅ Volume histogram displays below price chart in separate pane
- ✅ 20-day SMA displays in blue when data permits (≥20 points)
- ✅ 50-day SMA displays in orange when data permits (≥50 points)
- ✅ 200-day SMA displays in purple when data permits (≥200 points)
- ✅ Panes synchronize (zoom/pan together)
- ✅ Volume bars color correctly (green up, red down)
- ✅ Legend shows SMA indicators on desktop
- ✅ Dark mode: all indicators visible with good contrast
- ✅ Responsive: chart adapts to mobile/tablet/desktop
- ✅ All unit tests passing (SMA calculation)
- ✅ All E2E tests passing (visual verification)
- ✅ No performance degradation (render time < 5ms increase)

---

## Implementation Notes

- Follow TDD methodology for SMA calculation utility
- Reuse existing dark mode detection logic
- Maintain consistency with existing chart styling
- Update CLAUDE.md with indicator calculation patterns
- Update README.md with chart features documentation
- Ensure accessibility: legend text readable, sufficient color contrast
