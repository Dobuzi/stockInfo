import { IPriceProvider, PriceData, TimeRange } from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

export class FinnhubPriceProvider implements IPriceProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async getPrices(ticker: string, range: TimeRange): Promise<PriceData[]> {
    const { from, to } = this.getRangeDates(range);

    const url = new URL(`${this.baseUrl}/stock/candle`);
    url.searchParams.set('symbol', ticker);
    url.searchParams.set('resolution', 'D'); // Daily
    url.searchParams.set('from', String(Math.floor(from.getTime() / 1000)));
    url.searchParams.set('to', String(Math.floor(to.getTime() / 1000)));
    url.searchParams.set('token', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Finnhub API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data.s === 'no_data') {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    if (!data.c || !data.o || !data.h || !data.l || !data.v || !data.t) {
      throw new Error('No price data available');
    }

    // Convert to our format
    const prices: PriceData[] = data.t.map((timestamp: number, i: number) => ({
      ticker,
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));

    // Sort newest first (reverse chronological)
    return prices.reverse();
  }

  async validateTicker(ticker: string): Promise<boolean> {
    try {
      await this.getPrices(ticker, '1W');
      return true;
    } catch {
      return false;
    }
  }

  private getRangeDates(range: TimeRange): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();

    switch (range) {
      case '1W':
        from.setDate(to.getDate() - 7);
        break;
      case '1M':
        from.setMonth(to.getMonth() - 1);
        break;
      case '3M':
        from.setMonth(to.getMonth() - 3);
        break;
      case '6M':
        from.setMonth(to.getMonth() - 6);
        break;
      case '1Y':
        from.setFullYear(to.getFullYear() - 1);
        break;
      case '5Y':
        from.setFullYear(to.getFullYear() - 5);
        break;
      case 'MAX':
        from.setFullYear(to.getFullYear() - 20); // Finnhub has ~20 years max
        break;
    }

    return { from, to };
  }
}
