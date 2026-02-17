# Buffett Score — Design Document

**Date:** 2026-02-17
**Status:** Approved
**Author:** Design validated through brainstorming session

## Goal

Add a quality-first intrinsic value score (1–10, grade A–D) computed from existing overview data, displayed as a badge on ticker chips, a row in the comparison table, and a collapsible detail panel on the stock detail view.

## Approach

Pure function `computeBuffettScore(overview: OverviewData)` using only data already fetched by `useOverview`. No new API routes, no new data fetches.

## Scoring Algorithm

Seven metrics, quality-first weights (total = 100 pts → normalized to 1–10):

| Metric | OverviewData field | Buffett target (10) | Floor (0) | Weight |
|---|---|---|---|---|
| Return on Equity | `returnOnEquity` | >15% | <5% | 25 |
| Profit Margin | `profitMargin` | >20% | <5% | 20 |
| Operating Margin | `operatingMargin` | >15% | <3% | 15 |
| Earnings Growth | `quarterlyEarningsGrowth` | >15% | <0% | 15 |
| Debt-to-Equity | `debtToEquity` | <0.3 | >2.0 | 15 |
| Revenue Growth | `quarterlyRevenueGrowth` | >10% | <0% | 5 |
| Price-to-Book | `priceToBook` | <1.5 | >5.0 | 5 |

Each sub-score is linearly interpolated between floor and ceiling. Null metrics are excluded and their weight redistributed to non-null metrics. If fewer than 3 of 7 metrics are present, no score is shown.

### Grades

| Score | Grade |
|---|---|
| 8.0–10.0 | A (green) |
| 6.0–7.9 | B (yellow) |
| 4.0–5.9 | C (orange) |
| < 4.0 | D (red) |

### Return type

```typescript
interface BuffettScore {
  score: number;   // 1.0–10.0, one decimal
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
```

## Edge Cases

- **Null metrics:** excluded, weight redistributed. Fewer than 3 present → return null (no score shown).
- **Financial sector:** if `overview.sector` is "Financial Services" or "Banking", D/E sub-score excluded (high leverage is structural, not a quality signal).
- **Loading:** score surfaces render nothing while overview is loading.
- **Provider error:** score surfaces render nothing if `useOverview` returns an error.

## UI Placement

### 1. Ticker chips (watchlist)
Grade badge next to ticker label:
```
[ AAPL  A 9.1 ×]   [ TSLA  C 4.3 ×]
```
Color: green (A), yellow (B), orange (C), red (D).

### 2. Comparison table
New "Buffett Score" row at the top of the table (above "Company Information"). Colored score cell per ticker. Hover tooltip shows 7 sub-scores.

### 3. Detail view
Collapsible `BuffettScoreCard` between price chart section and financial statements section. Collapsed by default. Expanded view shows 7-row breakdown: metric name, current value, sub-score (0–10), visual bar, weight %.

## Architecture

### New files

```
lib/utils/buffett-score.ts           — pure function, zero deps
components/ui/BuffettScoreBadge.tsx  — chip badge (grade + score)
components/ui/BuffettScoreCard.tsx   — collapsible detail panel
```

### Modified files

```
components/ticker/TickerChips.tsx        — add overviews prop → render badge
components/comparison/ComparisonTable.tsx — add score row at top
app/page.tsx                              — pass overviews to TickerChips; insert ScoreCard
```

### Data flow

```
useOverview(ticker) → OverviewData
    ↓
computeBuffettScore(overview) → BuffettScore | null
    ↓
BuffettScoreBadge   (ticker chips)
BuffettScoreCard    (detail panel — collapsible)
ComparisonTable     (score row)
```

No new hooks, no new API routes. All score computation happens client-side from data already in-flight.

## Testing

Six unit tests in `__tests__/unit/buffett-score.test.ts`:
1. High-quality company (AAPL-like inputs) → score ≥ 8, grade A
2. Low-quality company (high D/E, low margins) → score ≤ 4, grade D
3. All nulls → returns null
4. Fewer than 3 metrics present → returns null
5. Bank sector → D/E excluded from weighted average
6. Boundary: exactly at threshold values → correct interpolation

One Playwright smoke test: add AAPL, verify badge element is visible (grade letter present) once overview loads.
