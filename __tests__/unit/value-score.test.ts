import { describe, it, expect } from 'vitest';
import { computeValueScore } from '@/lib/utils/value-score';
import type { OverviewData } from '@/lib/transformers/overview';

const NULL_OVERVIEW: OverviewData = {
  name: null, sector: null, industry: null, marketCap: null,
  fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null, averageVolume: null,
  peRatio: null, forwardPE: null, pegRatio: null, priceToBook: null,
  priceToSales: null, evToEbitda: null, profitMargin: null,
  operatingMargin: null, returnOnEquity: null, returnOnAssets: null,
  revenue: null, quarterlyRevenueGrowth: null, quarterlyEarningsGrowth: null,
  eps: null, debtToEquity: null, currentRatio: null, quickRatio: null,
  bookValue: null, dividendYield: null, dividendPerShare: null, payoutRatio: null,
};

describe('computeValueScore', () => {
  it('high-value company scores ≥ 8 with grade A', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      peRatio: 10,
      pegRatio: 0.5,
      priceToBook: 1.0,
    };
    const result = computeValueScore(overview);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(8);
    expect(result!.grade).toBe('A');
  });

  it('low-value company scores ≤ 4 with grade D', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      peRatio: 60,
      pegRatio: 5.0,
      priceToBook: 8.0,
    };
    const result = computeValueScore(overview);
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThanOrEqual(4);
    expect(result!.grade).toBe('D');
  });

  it('returns null when all metrics are null', () => {
    expect(computeValueScore(NULL_OVERVIEW)).toBeNull();
  });

  it('returns null when fewer than 2 metrics are present', () => {
    const overview: OverviewData = { ...NULL_OVERVIEW, peRatio: 15 };
    expect(computeValueScore(overview)).toBeNull();
  });

  it('treats negative P/E as null (loss-making company)', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      peRatio: -20,
      pegRatio: 1.5,
      priceToBook: 2.0,
    };
    const result = computeValueScore(overview);
    expect(result).not.toBeNull();
    expect(result!.breakdown.pe).toBeNull();
  });

  it('correctly interpolates at exact boundary values', () => {
    const atWorst = { ...NULL_OVERVIEW, peRatio: 40, pegRatio: 3.0, priceToBook: 5.0 };
    const atBest  = { ...NULL_OVERVIEW, peRatio: 15, pegRatio: 1.0, priceToBook: 1.5 };

    const resultWorst = computeValueScore(atWorst)!;
    const resultBest  = computeValueScore(atBest)!;

    expect(resultWorst.breakdown.pe).toBe(0);
    expect(resultBest.breakdown.pe).toBe(10);
    expect(resultWorst.breakdown.peg).toBe(0);
    expect(resultBest.breakdown.peg).toBe(10);
    expect(resultWorst.breakdown.pb).toBe(0);
    expect(resultBest.breakdown.pb).toBe(10);
    expect(resultBest.score).toBeGreaterThan(resultWorst.score);
  });
});
