import { describe, it, expect } from 'vitest';
import { computeBuffettScore } from '@/lib/utils/buffett-score';
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

describe('computeBuffettScore', () => {
  it('high-quality company scores ≥ 8 with grade A', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 25,
      profitMargin: 28,
      operatingMargin: 30,
      quarterlyEarningsGrowth: 20,
      debtToEquity: 0.1,
      quarterlyRevenueGrowth: 15,
      priceToBook: 1.0,
    };
    const result = computeBuffettScore(overview);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(8);
    expect(result!.grade).toBe('A');
  });

  it('low-quality company scores ≤ 4 with grade D', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 2,
      profitMargin: 1,
      operatingMargin: 0,
      quarterlyEarningsGrowth: -10,
      debtToEquity: 3.0,
      quarterlyRevenueGrowth: -5,
      priceToBook: 8.0,
    };
    const result = computeBuffettScore(overview);
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThanOrEqual(4);
    expect(result!.grade).toBe('D');
  });

  it('returns null when all metrics are null', () => {
    expect(computeBuffettScore(NULL_OVERVIEW)).toBeNull();
  });

  it('returns null when fewer than 3 metrics are present', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 20,
      profitMargin: 25,
    };
    expect(computeBuffettScore(overview)).toBeNull();
  });

  it('excludes D/E from Financial Services companies and still returns a score', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      sector: 'Financial Services',
      returnOnEquity: 20,
      profitMargin: 25,
      operatingMargin: 22,
      debtToEquity: 15.0,
    };
    const result = computeBuffettScore(overview);
    expect(result).not.toBeNull();
    expect(result!.breakdown.debtToEquity).toBeNull();
    expect(result!.score).toBeGreaterThan(5);
  });

  it('correctly interpolates at exact boundary values', () => {
    const atWorst = { ...NULL_OVERVIEW, returnOnEquity: 5, profitMargin: 12, operatingMargin: 9 };
    const atBest  = { ...NULL_OVERVIEW, returnOnEquity: 15, profitMargin: 12, operatingMargin: 9 };

    const resultWorst = computeBuffettScore(atWorst)!;
    const resultBest  = computeBuffettScore(atBest)!;

    expect(resultWorst.breakdown.roe).toBe(0);
    expect(resultBest.breakdown.roe).toBe(10);
    expect(resultBest.score).toBeGreaterThan(resultWorst.score);
  });

  it('returns a score when exactly 3 metrics are present', () => {
    const overview: OverviewData = {
      ...NULL_OVERVIEW,
      returnOnEquity: 20,
      profitMargin: 25,
      operatingMargin: 15,
    };
    expect(computeBuffettScore(overview)).not.toBeNull();
  });
});
