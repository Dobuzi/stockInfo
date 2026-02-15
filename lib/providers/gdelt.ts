import { INewsProvider, NewsArticle } from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

/**
 * GDELT provider for news articles
 * No API key required - uses public GKG API
 * Provides global news coverage with company name mentions
 */
export class GDELTProvider implements INewsProvider {
  private readonly baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';

  async getNews(ticker: string, windowDays: number): Promise<NewsArticle[]> {
    // Map ticker to company name for better GDELT results
    const companyQuery = await this.getCompanyName(ticker);

    const now = new Date();
    const fromDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const url = new URL(this.baseUrl);
    url.searchParams.set('query', companyQuery);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('maxrecords', '250');
    url.searchParams.set('format', 'json');
    url.searchParams.set('sort', 'datedesc');
    url.searchParams.set('startdatetime', this.formatGDELTDate(fromDate));
    url.searchParams.set('enddatetime', this.formatGDELTDate(now));

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`GDELT API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    // Filter and transform articles
    const articles: NewsArticle[] = data.articles
      .filter((article: any) => article.url && article.title)
      .slice(0, 50) // Limit to 50 most recent
      .map((article: any) => ({
        headline: article.title,
        source: article.domain || new URL(article.url).hostname,
        url: article.url,
        publishedAt: this.parseGDELTDate(article.seendate),
        summary: article.socialimage || article.title, // GDELT doesn't provide summaries
      }));

    return articles;
  }

  private async getCompanyName(ticker: string): Promise<string> {
    // Common ticker-to-name mappings for better GDELT search
    const knownMappings: Record<string, string> = {
      AAPL: 'Apple Inc',
      GOOGL: 'Google Alphabet',
      GOOG: 'Google Alphabet',
      MSFT: 'Microsoft',
      AMZN: 'Amazon',
      TSLA: 'Tesla',
      META: 'Meta Facebook',
      NVDA: 'NVIDIA',
      NFLX: 'Netflix',
      'BRK.B': 'Berkshire Hathaway',
      'BRK.A': 'Berkshire Hathaway',
    };

    return knownMappings[ticker.toUpperCase()] || ticker;
  }

  private formatGDELTDate(date: Date): string {
    // Format: YYYYMMDDhhmmss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private parseGDELTDate(gdeltDate: string): string {
    // Parse YYYYMMDDThhmmssZ format
    if (!gdeltDate || gdeltDate.length < 8) {
      return new Date().toISOString();
    }

    const year = parseInt(gdeltDate.substring(0, 4));
    const month = parseInt(gdeltDate.substring(4, 6)) - 1;
    const day = parseInt(gdeltDate.substring(6, 8));
    const hour = parseInt(gdeltDate.substring(9, 11) || '0');
    const minute = parseInt(gdeltDate.substring(11, 13) || '0');
    const second = parseInt(gdeltDate.substring(13, 15) || '0');

    return new Date(year, month, day, hour, minute, second).toISOString();
  }
}
