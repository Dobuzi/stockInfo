# Value Score — Design Document

**Date:** 2026-02-17
**Status:** Approved
**Author:** Design validated through brainstorming session

## Goal

Add a valuation score (1–10, grade A–D) that answers "is the price right?" — the complement to the existing Buffett quality score which answers "is it a good business?" Together they implement Buffett's "wonderful company at a fair price" framework.

## Approach

Pure function `computeValueScore(overview: OverviewData)` using only data already fetched by `useOverview`. No new API routes, no new data fetches. Same mechanics as `computeBuffettScore`.

## Scoring Algorithm

Three metrics, universal thresholds (total = 100 pts → normalized to 1–10):

| Metric | OverviewData field | Best (10) | Worst (0) | Weight |
|---|---|---|---|---|
| P/E Ratio | `peRatio` | < 15 | > 40 | 50 |
| PEG Ratio | `pegRatio` | < 1.0 | > 3.0 | 30 |
| Price-to-Book | `priceToBook` | < 1.5 | > 5.0 | 20 |

Same linear interpolation as quality score — clamped sub-scores [0–10], null redistribution, independent of the quality score's P/B usage (P/B is a valuation signal as well as a quality signal).

### Special case: Negative P/E

Negative P/E (loss-making company) is treated as `null` — excluded from weighted average. A negative value has no valuation meaning and would invert the interpolation.

### Minimum metrics

Fewer than 2 of 3 metrics present → return `null` (no score shown). Lower bar than quality score (2 vs 3) since there are only 3 total metrics.

### Grades

| Score | Grade |
|---|---|
| 8.0–10.0 | A (green) |
| 6.0–7.9 | B (yellow) |
| 4.0–5.9 | C (orange) |
| < 4.0 | D (red) |

### Return type

```typescript
interface ValueScore {
  score: number;   // 1.0–10.0, one decimal
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    pe: number | null;
    peg: number | null;
    pb: number | null;
  };
}
```

## UI Placement

### 1. Ticker chips

Both badges side by side, labelled with Q:/V: prefix to distinguish:
```
[ AAPL  Q:A 9.1  V:B 6.3  × ]   [ JPM  Q:B 7.2  V:A 8.4  × ]
```
Existing `BuffettScoreBadge` gets "Q:" prefix added (text-only change, no prop changes).

### 2. Comparison table

New "Value Score" row directly below the existing "Buffett Score" row at the top of the table. Same color scheme.

### 3. Detail view

`BuffettScoreCard` renamed to `QualityValueCard`. Shows both scores in the collapsed header. When expanded, shows two breakdown tables (quality metrics, then value metrics). Renders with one section if only one score is available; renders nothing if both are null.

## Edge Cases

- **Negative P/E:** treated as `null` (excluded from weighted average).
- **Very high P/E (>40):** clamped to sub-score 0. No special handling needed.
- **Null metrics:** excluded, weight redistributed. Fewer than 2 present → return null.
- **Loading / error:** all score surfaces render nothing while overview is loading or errored.
- **Chip badge prefix:** existing `BuffettScoreBadge` text updated from `{grade} {score}` to `Q:{grade} {score}`.

## Architecture

### New files

```
lib/utils/value-score.ts              — pure function, zero deps beyond OverviewData
components/ui/ValueScoreBadge.tsx     — "V:A 8.4" chip badge
```

### Modified files

```
components/ui/BuffettScoreBadge.tsx        — add "Q:" prefix to badge text
components/ui/BuffettScoreCard.tsx         — rename to QualityValueCard, show both scores + breakdowns
components/ticker/TickerChips.tsx          — add ValueScoreBadge alongside existing badge
components/comparison/ComparisonTable.tsx  — add Value Score row below Buffett Score row
app/page.tsx                               — update import: BuffettScoreCard → QualityValueCard
```

### Data flow

```
useOverview(ticker) → OverviewData
    ↓
computeValueScore(overview) → ValueScore | null
    ↓
ValueScoreBadge       (ticker chips — "V:" prefix)
QualityValueCard      (detail panel — both scores, collapsible)
ComparisonTable       (value score row)
```

No new hooks, no new API routes.

## Testing

Six unit tests in `__tests__/unit/value-score.test.ts`:
1. High-value company (low P/E, PEG < 1, low P/B) → score ≥ 8, grade A
2. Low-value company (high P/E, PEG > 3, high P/B) → score ≤ 4, grade D
3. All nulls → returns null
4. Fewer than 2 metrics present → returns null
5. Negative P/E → treated as null (excluded)
6. Boundary: exactly at threshold values → correct interpolation
