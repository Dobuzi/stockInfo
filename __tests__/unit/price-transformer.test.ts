import { describe, it, expect } from 'vitest';
import { transformPriceData, normalizePrices } from '@/lib/transformers/prices';
import { PriceData } from '@/lib/providers/interfaces';

describe('transformPriceData', () => {
  const mockPrices: PriceData[] = [
    { ticker: 'AAPL', date: '2026-02-14', open: 185.2, high: 187.5, low: 184.1, close: 186.3, volume: 52000000 },
    { ticker: 'AAPL', date: '2026-02-13', open: 183.5, high: 185.9, low: 183.0, close: 184.1, volume: 48000000 },
    { ticker: 'AAPL', date: '2026-02-12', open: 180.0, high: 184.0, low: 179.5, close: 183.5, volume: 55000000 },
  ];

  it('calculates day change correctly', () => {
    const result = transformPriceData(mockPrices);
    expect(result.dayChange).toBeCloseTo(1.19, 1); // (186.3 - 184.1) / 184.1 * 100
  });

  it('calculates period change correctly', () => {
    const result = transformPriceData(mockPrices);
    expect(result.periodChange).toBeCloseTo(1.53, 1); // (186.3 - 183.5) / 183.5 * 100
  });

  it('returns current price', () => {
    const result = transformPriceData(mockPrices);
    expect(result.current).toBe(186.3);
  });
});

describe('normalizePrices', () => {
  it('normalizes prices to 100 at start', () => {
    const prices: PriceData[] = [
      { ticker: 'AAPL', date: '2026-02-12', open: 180, high: 184, low: 179, close: 183.5, volume: 55000000 },
      { ticker: 'AAPL', date: '2026-02-13', open: 183.5, high: 185.9, low: 183, close: 184.1, volume: 48000000 },
      { ticker: 'AAPL', date: '2026-02-14', open: 185.2, high: 187.5, low: 184.1, close: 186.3, volume: 52000000 },
    ];

    const normalized = normalizePrices(prices);

    // First price should be 100
    expect(normalized[0]).toBeCloseTo(100, 1);

    // Second price: (184.1 / 183.5) * 100
    expect(normalized[1]).toBeCloseTo(100.33, 1);

    // Third price: (186.3 / 183.5) * 100
    expect(normalized[2]).toBeCloseTo(101.53, 1);
  });
});
