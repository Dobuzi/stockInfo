import { INewsProvider, NewsArticle } from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

export class FinnhubProvider implements INewsProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async getNews(ticker: string, windowDays: number): Promise<NewsArticle[]> {
    const now = new Date();
    const fromDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const from = fromDate.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];

    const url = new URL(`${this.baseUrl}/company-news`);
    url.searchParams.set('symbol', ticker);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
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

    if (!Array.isArray(data)) {
      throw new Error('Invalid news data format');
    }

    return data.map((article: any) => ({
      headline: article.headline,
      source: article.source,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      summary: article.summary || article.headline,
    }));
  }
}
