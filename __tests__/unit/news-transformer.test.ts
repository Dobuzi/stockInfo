import { describe, it, expect } from 'vitest';
import { deduplicateNews, computeSentiment } from '@/lib/transformers/news';
import { NewsArticle } from '@/lib/providers/interfaces';

describe('deduplicateNews', () => {
  it('removes duplicate headlines', () => {
    const articles: NewsArticle[] = [
      {
        headline: 'Tesla Delivers Record Numbers!',
        source: 'Reuters',
        url: 'https://example.com/1',
        publishedAt: '2026-02-14T10:00:00Z',
        summary: 'Tesla announced record deliveries.',
      },
      {
        headline: 'Tesla delivers record numbers.',
        source: 'Bloomberg',
        url: 'https://example.com/2',
        publishedAt: '2026-02-14T10:30:00Z',
        summary: 'Tesla sees record numbers.',
      },
      {
        headline: 'Apple Announces New Product',
        source: 'TechCrunch',
        url: 'https://example.com/3',
        publishedAt: '2026-02-14T11:00:00Z',
        summary: 'Apple unveils new product.',
      },
    ];

    const result = deduplicateNews(articles);
    expect(result).toHaveLength(2); // Tesla duplicate removed
  });
});

describe('computeSentiment', () => {
  it('detects positive sentiment', () => {
    expect(computeSentiment('Tesla surges on record deliveries')).toBe('positive');
    expect(computeSentiment('Apple stock rallies after earnings beat')).toBe('positive');
    expect(computeSentiment('Innovation drives growth')).toBe('positive');
  });

  it('detects negative sentiment', () => {
    expect(computeSentiment('Tesla plunges on production concerns')).toBe('negative');
    expect(computeSentiment('Apple stock tumbles after lawsuit')).toBe('negative');
    expect(computeSentiment('Company issues recall')).toBe('negative');
  });

  it('defaults to neutral', () => {
    expect(computeSentiment('Apple announces quarterly results')).toBe('neutral');
    expect(computeSentiment('Tesla holds shareholder meeting')).toBe('neutral');
  });
});
