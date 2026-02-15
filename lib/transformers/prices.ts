import { PriceData } from '@/lib/providers/interfaces';

export interface TransformedPriceData {
  prices: PriceData[];
  current: number;
  dayChange: number; // Percentage
  periodChange: number; // Percentage
}

export function transformPriceData(prices: PriceData[]): TransformedPriceData {
  if (prices.length === 0) {
    throw new Error('No price data to transform');
  }

  // Prices are sorted newest first
  const current = prices[0].close;
  const previousClose = prices.length > 1 ? prices[1].close : current;
  const periodStart = prices[prices.length - 1].close;

  const dayChange = ((current - previousClose) / previousClose) * 100;
  const periodChange = ((current - periodStart) / periodStart) * 100;

  return {
    prices,
    current,
    dayChange,
    periodChange,
  };
}

export function normalizePrices(prices: PriceData[]): number[] {
  if (prices.length === 0) {
    return [];
  }

  const startPrice = prices[0].close;

  return prices.map(p => (p.close / startPrice) * 100);
}
