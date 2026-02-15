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
