import { IPriceProvider, PriceData, TimeRange } from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

/**
 * Stooq provider for EOD (end-of-day) historical prices
 * No API key required - uses CSV download endpoint
 * Limitations: EOD data only (15-20 min delay), US stocks only
 */
export class StooqProvider implements IPriceProvider {
  private readonly baseUrl = 'https://stooq.com/q/d/l';

  async getPrices(ticker: string, range: TimeRange): Promise<PriceData[]> {
    // Stooq uses .US suffix for US stocks
    const stooqTicker = ticker.toUpperCase() + '.US';

    const { from, to } = this.getRangeDates(range);

    const url = new URL(this.baseUrl);
    url.searchParams.set('s', stooqTicker);
    url.searchParams.set('d1', this.formatDate(from));
    url.searchParams.set('d2', this.formatDate(to));
    url.searchParams.set('i', 'd'); // Daily interval

    const csvData = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Stooq API error: ${response.statusText}`);
        }
        return response.text();
      })
    );

    const prices = this.parseCSV(csvData, ticker);

    if (prices.length === 0) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    return prices;
  }

  async validateTicker(ticker: string): Promise<boolean> {
    try {
      const prices = await this.getPrices(ticker, '1W');
      return prices.length > 0;
    } catch {
      return false;
    }
  }

  private parseCSV(csv: string, ticker: string): PriceData[] {
    const lines = csv.trim().split('\n');

    // Skip header row
    if (lines.length < 2) {
      return [];
    }

    const prices: PriceData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');

      // Format: Date,Open,High,Low,Close,Volume
      if (columns.length < 6) continue;

      const [date, open, high, low, close, volume] = columns;

      // Skip invalid rows
      if (!date || date === 'Date' || open === 'null') continue;

      prices.push({
        ticker,
        date,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseInt(volume, 10) || 0,
      });
    }

    // Stooq returns oldest first, we need newest first
    return prices.reverse();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
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
        from.setFullYear(to.getFullYear() - 20);
        break;
    }

    return { from, to };
  }
}
