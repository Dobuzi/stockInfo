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
