# Chart Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add volume histogram and 20/50/200-day simple moving averages to price charts for essential technical analysis

**Architecture:** Extend existing PriceChart component with multi-pane layout (price + volume), calculate SMAs client-side from existing OHLC data, add line series overlays

**Tech Stack:** lightweight-charts v5.1.0, TypeScript, React hooks (useMemo for SMA calculation caching)

---

## Task 1: SMA Calculation Utility

Create utility function to calculate simple moving averages from price data

**Files:**
- Create: `lib/utils/indicators.ts`
- Test: `__tests__/unit/indicators.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/unit/indicators.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSMA } from '@/lib/utils/indicators';
import type { PriceData } from '@/lib/providers/interfaces';

describe('calculateSMA', () => {
  const generateTestData = (days: number): PriceData[] => {
    const data: PriceData[] = [];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);

      data.push({
        date: date.toISOString().split('T')[0],
        open: 100 + i,
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
        volume: 1000000,
      });
    }

    return data;
  };

  it('should calculate 20-day SMA correctly', () => {
    const data = generateTestData(30);
    const sma = calculateSMA(data, 20);

    expect(sma).toHaveLength(11); // 30 - 20 + 1

    // First SMA should be average of closes 0-19 (100-119)
    const expectedFirstAvg = (100 + 119) / 2; // 109.5
    expect(sma[0].value).toBeCloseTo(expectedFirstAvg, 1);
    expect(sma[0].time).toBe('2024-01-20');
  });

  it('should return empty array when data length < period', () => {
    const data = generateTestData(10);
    const sma = calculateSMA(data, 20);

    expect(sma).toEqual([]);
  });

  it('should handle period = 1 (returns closing prices)', () => {
    const data = generateTestData(5);
    const sma = calculateSMA(data, 1);

    expect(sma).toHaveLength(5);
    expect(sma[0].value).toBe(100);
    expect(sma[4].value).toBe(104);
  });

  it('should calculate 50-day SMA correctly', () => {
    const data = generateTestData(100);
    const sma = calculateSMA(data, 50);

    expect(sma).toHaveLength(51); // 100 - 50 + 1

    // First SMA should be average of closes 0-49 (100-149)
    const expectedFirstAvg = (100 + 149) / 2; // 124.5
    expect(sma[0].value).toBeCloseTo(expectedFirstAvg, 1);
  });

  it('should calculate 200-day SMA correctly', () => {
    const data = generateTestData(252);
    const sma = calculateSMA(data, 200);

    expect(sma).toHaveLength(53); // 252 - 200 + 1

    // First SMA should be average of closes 0-199 (100-299)
    const expectedFirstAvg = (100 + 299) / 2; // 199.5
    expect(sma[0].value).toBeCloseTo(expectedFirstAvg, 1);
  });

  it('should handle multiple SMAs calculation', () => {
    const data = generateTestData(252);

    const sma20 = calculateSMA(data, 20);
    const sma50 = calculateSMA(data, 50);
    const sma200 = calculateSMA(data, 200);

    expect(sma20).toHaveLength(233);
    expect(sma50).toHaveLength(203);
    expect(sma200).toHaveLength(53);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test __tests__/unit/indicators.test.ts`
Expected: FAIL with "Cannot find module '@/lib/utils/indicators'"

**Step 3: Write minimal implementation**

```typescript
// lib/utils/indicators.ts
import type { PriceData } from '@/lib/providers/interfaces';

export interface IndicatorPoint {
  time: string;
  value: number;
}

/**
 * Calculate Simple Moving Average for a given period
 * @param data - Array of price data points (must be in chronological order)
 * @param period - Number of periods to average (e.g., 20, 50, 200)
 * @returns Array of SMA values with time and value
 */
export function calculateSMA(
  data: PriceData[],
  period: number
): IndicatorPoint[] {
  if (data.length < period || period < 1) {
    return [];
  }

  const result: IndicatorPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;

    // Sum closing prices for the period
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

**Step 4: Run test to verify it passes**

Run: `npm test __tests__/unit/indicators.test.ts`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add lib/utils/indicators.ts __tests__/unit/indicators.test.ts
git commit -m "feat: add SMA calculation utility with tests"
```

---

## Task 2: Enhanced PriceChart - Add Volume Pane

Modify PriceChart to display volume histogram in separate pane below price chart

**Files:**
- Modify: `components/charts/PriceChart.tsx:1-73`

**Step 1: Import indicators utility and update props**

```typescript
// components/charts/PriceChart.tsx
// Add to imports at top
import { calculateSMA, type IndicatorPoint } from '@/lib/utils/indicators';
import { useMemo } from 'react'; // Add to existing 'react' import

// Update interface (around line 7)
interface PriceChartProps {
  data: PriceData[];
  height?: number;
  showVolume?: boolean;  // Optional: default true
  showSMAs?: boolean;    // Optional: default true
}

export function PriceChart({
  data,
  height = 550,  // Changed from 400 to 550 to accommodate volume pane
  showVolume = true,
  showSMAs = true
}: PriceChartProps) {
```

**Step 2: Add volume data preparation**

```typescript
// components/charts/PriceChart.tsx
// Add after chartRef declaration (around line 14)

const volumeData = useMemo(() => {
  if (!showVolume) return [];

  return data.map(d => ({
    time: d.date,
    value: d.volume,
    color: d.close >= d.open ? '#10b981' : '#ef4444', // green up, red down
  }));
}, [data, showVolume]);
```

**Step 3: Add volume series to chart**

```typescript
// components/charts/PriceChart.tsx
// Add after candlestick series setup (around line 51)

// Add volume histogram in separate pane
if (showVolume && volumeData.length > 0) {
  const volumeSeries = chart.addHistogramSeries({
    color: '#26a69a',
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: 'volume',
  });

  volumeSeries.priceScale().applyOptions({
    scaleMargins: {
      top: 0.7, // Volume takes bottom 30% of chart
      bottom: 0,
    },
  });

  volumeSeries.setData(volumeData);
}
```

**Step 4: Test manually**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Add a ticker (e.g., AAPL)
Expected: Price chart shows with volume histogram below

**Step 5: Commit**

```bash
git add components/charts/PriceChart.tsx
git commit -m "feat: add volume histogram pane to price chart"
```

---

## Task 3: Enhanced PriceChart - Add SMA Overlays

Add 20/50/200-day simple moving average line overlays to price chart

**Files:**
- Modify: `components/charts/PriceChart.tsx:1-90`

**Step 1: Calculate SMAs with memoization**

```typescript
// components/charts/PriceChart.tsx
// Add after volumeData useMemo (around line 22)

const smaData = useMemo(() => {
  if (!showSMAs) {
    return { sma20: [], sma50: [], sma200: [] };
  }

  return {
    sma20: calculateSMA(data, 20),
    sma50: calculateSMA(data, 50),
    sma200: calculateSMA(data, 200),
  };
}, [data, showSMAs]);
```

**Step 2: Add SMA line series to chart**

```typescript
// components/charts/PriceChart.tsx
// Add after volume series setup (around line 70)

// Add SMA line series
if (showSMAs) {
  if (smaData.sma20.length > 0) {
    const sma20Series = chart.addLineSeries({
      color: '#3b82f6', // blue
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
    });
    sma20Series.setData(smaData.sma20);
  }

  if (smaData.sma50.length > 0) {
    const sma50Series = chart.addLineSeries({
      color: '#f97316', // orange
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
    });
    sma50Series.setData(smaData.sma50);
  }

  if (smaData.sma200.length > 0) {
    const sma200Series = chart.addLineSeries({
      color: '#a855f7', // purple
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
    });
    sma200Series.setData(smaData.sma200);
  }
}
```

**Step 3: Test manually**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Add ticker with sufficient data (e.g., AAPL with 1Y range)
Expected: Blue (20), orange (50), and purple (200) SMA lines overlay on candlesticks

**Step 4: Commit**

```bash
git add components/charts/PriceChart.tsx
git commit -m "feat: add 20/50/200-day SMA overlays to price chart"
```

---

## Task 4: Add SMA Legend

Display legend showing which SMAs are active

**Files:**
- Modify: `components/charts/PriceChart.tsx:1-100`

**Step 1: Add legend component**

```typescript
// components/charts/PriceChart.tsx
// Add before closing </div> in return statement (around line 72)

{showSMAs && (smaData.sma20.length > 0 || smaData.sma50.length > 0 || smaData.sma200.length > 0) && (
  <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 rounded px-3 py-2 text-xs backdrop-blur-sm hidden sm:block">
    {smaData.sma20.length > 0 && (
      <div className="flex items-center gap-1.5 mb-1">
        <span className="inline-block w-3 h-0.5 bg-blue-500" />
        <span className="text-gray-700 dark:text-gray-300">SMA 20</span>
      </div>
    )}
    {smaData.sma50.length > 0 && (
      <div className="flex items-center gap-1.5 mb-1">
        <span className="inline-block w-3 h-0.5 bg-orange-500" />
        <span className="text-gray-700 dark:text-gray-300">SMA 50</span>
      </div>
    )}
    {smaData.sma200.length > 0 && (
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-0.5 bg-purple-500" />
        <span className="text-gray-700 dark:text-gray-300">SMA 200</span>
      </div>
    )}
  </div>
)}
```

**Step 2: Update chart container to position relative**

```typescript
// components/charts/PriceChart.tsx
// Update return statement (around line 72)
return (
  <div className="w-full relative">
    <div ref={chartContainerRef} className="w-full" />
    {/* Legend goes here */}
  </div>
);
```

**Step 3: Test legend visibility**

Run: `npm run dev`
- Desktop: Legend should appear in top-right corner
- Mobile (<640px): Legend should be hidden
- Dark mode: Legend should adapt to dark background

**Step 4: Commit**

```bash
git add components/charts/PriceChart.tsx
git commit -m "feat: add SMA legend to price chart"
```

---

## Task 5: Integration Testing - E2E

Create E2E test for chart enhancements

**Files:**
- Create: `__tests__/e2e/chart-enhancements.spec.ts`

**Step 1: Write E2E test**

```typescript
// __tests__/e2e/chart-enhancements.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chart Enhancements', () => {
  test('should display volume histogram and SMA indicators', async ({ page }) => {
    await page.goto('/');

    // Add ticker with sufficient data for all SMAs
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');

    // Wait for chart to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Change to 1Y range to ensure enough data for 200-day SMA
    await page.click('button:has-text("1Y")');

    // Wait for chart update
    await page.waitForTimeout(2000);

    // Verify legend shows SMA indicators (desktop only)
    const legend = page.locator('text=SMA 20');
    if (await page.viewportSize().then(v => v!.width >= 640)) {
      await expect(legend).toBeVisible();
      await expect(page.locator('text=SMA 50')).toBeVisible();
      await expect(page.locator('text=SMA 200')).toBeVisible();
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/chart-with-indicators.png',
      fullPage: false,
    });
  });

  test('should show appropriate SMAs based on data range', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'MSFT');
    await page.click('button:has-text("Add")');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // 1-month range: should show 20-day SMA only (maybe 50 if data permits)
    await page.click('button:has-text("1M")');
    await page.waitForTimeout(2000);

    // Legend should show at least SMA 20
    const viewport = await page.viewportSize();
    if (viewport && viewport.width >= 640) {
      await expect(page.locator('text=SMA 20')).toBeVisible();
    }
  });

  test('should display volume histogram below price chart', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'TSLA');
    await page.click('button:has-text("Add")');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Chart container should be taller (550px vs original 400px)
    const chartSection = page.locator('section:has(canvas)');
    const boundingBox = await chartSection.boundingBox();

    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThan(500);
  });

  test('should work in dark mode', async ({ page }) => {
    await page.goto('/');

    // Toggle dark mode
    await page.click('button[aria-label="Toggle dark mode"]');

    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'GOOGL');
    await page.click('button:has-text("Add")');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("1Y")');
    await page.waitForTimeout(2000);

    // Take dark mode screenshot
    await page.screenshot({
      path: 'test-results/chart-dark-mode.png',
      fullPage: false,
    });

    // Verify legend is visible in dark mode (desktop)
    const viewport = await page.viewportSize();
    if (viewport && viewport.width >= 640) {
      const legend = page.locator('div:has-text("SMA 20")').first();
      await expect(legend).toBeVisible();
    }
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All 4 tests pass

**Step 3: Commit**

```bash
git add __tests__/e2e/chart-enhancements.spec.ts
git commit -m "test: add E2E tests for chart enhancements"
```

---

## Task 6: Update Documentation

Update README and CLAUDE.md with chart enhancement details

**Files:**
- Modify: `README.md:1-112`
- Modify: `CLAUDE.md:1-102`

**Step 1: Update README features**

```markdown
<!-- README.md - Update Features section (around line 7) -->

## Features

- 📈 **Interactive Price Charts** - Candlestick charts with volume bars and moving averages (20/50/200-day SMAs)
- 🔄 **Smart Comparison View** - Side-by-side fundamental metrics comparison (auto-switches when 2+ tickers added)
- 📊 **Financial Statements** - Income statements, balance sheets, and cash flow with computed metrics
- 📰 **News Feed** - Latest news with sentiment analysis (positive/neutral/negative)
- 🌙 **Dark Mode** - Full dark mode support
- ⚡ **Fast** - Server-side caching and React Query for optimal performance
- 📱 **Responsive** - Works on mobile, tablet, and desktop
```

**Step 2: Add technical analysis section**

```markdown
<!-- README.md - Add after Using Comparison View section -->

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
```

**Step 3: Update CLAUDE.md**

```markdown
<!-- CLAUDE.md - Add to Key Patterns section -->

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
```

**Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: update docs with chart enhancement details"
```

---

## Task 7: Final Verification

Run all tests and verify production build

**Step 1: Run all unit tests**

Run: `npm run test:unit`
Expected: All tests pass (including new indicators tests)

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (including new chart enhancement tests)

**Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Build for production**

Run: `npm run build`
Expected: Successful build

**Step 5: Visual verification**

Run: `npm run dev`
Test manually:
- [ ] Volume bars display below price chart
- [ ] Volume colors match price direction (green up, red down)
- [ ] 20-day SMA displays in blue (when data permits)
- [ ] 50-day SMA displays in orange (when data permits)
- [ ] 200-day SMA displays in purple (when data permits)
- [ ] Legend shows in top-right on desktop
- [ ] Legend hidden on mobile
- [ ] Dark mode: all elements visible
- [ ] Panes zoom/pan together
- [ ] Different time ranges show appropriate SMAs

**Step 6: Commit**

```bash
git commit --allow-empty -m "chore: final verification complete - all tests passing"
```

---

## Execution Summary

**Total Tasks:** 7
**Estimated Time:** 2-3 hours (following TDD methodology)

**Task Breakdown:**
1. SMA calculation utility (30 min)
2. Volume pane (25 min)
3. SMA overlays (30 min)
4. Legend (20 min)
5. E2E testing (30 min)
6. Documentation (20 min)
7. Final verification (15 min)

**Key Testing Points:**
- Unit tests for SMA calculation (6 tests)
- E2E tests for visual verification (4 tests)
- Manual testing for different time ranges
- Dark mode compatibility check

**Success Criteria:**
- All unit tests passing
- All E2E tests passing
- No TypeScript errors
- Production build successful
- Volume bars display correctly
- SMAs calculate and display accurately
- Legend shows appropriate indicators
- Responsive behavior works on mobile/tablet/desktop
