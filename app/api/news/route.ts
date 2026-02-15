import { NextRequest, NextResponse } from 'next/server';
import { getNewsProvider } from '@/lib/providers/factory';
import { cacheNews } from '@/lib/cache/server-cache';
import { deduplicateNews, computeSentiment } from '@/lib/transformers/news';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const window = searchParams.get('window') || '7d';

  // Validation
  if (!tickerParam) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  const ticker = normalizeTicker(tickerParam);

  if (!validateTicker(ticker)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  // Parse time window
  const windowDays = parseTimeWindow(window);

  if (windowDays === null) {
    return NextResponse.json(
      { error: 'Invalid time window. Use: 24h, 7d, or 30d' },
      { status: 400 }
    );
  }

  try {
    const provider = getNewsProvider();

    const news = await cacheNews(ticker, window, async () => {
      return await provider.getNews(ticker, windowDays);
    });

    // Deduplicate similar headlines
    const deduplicated = deduplicateNews(news);

    // Add sentiment scores
    const withSentiment = deduplicated.map(article => ({
      ...article,
      sentiment: computeSentiment(article.headline + ' ' + article.summary),
    }));

    return NextResponse.json({
      ticker,
      window,
      count: withSentiment.length,
      articles: withSentiment,
    });
  } catch (error: any) {
    console.error('[API News]', error);

    let errorMessage = 'Failed to fetch news data';
    let statusCode = 500;

    if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    }

    return NextResponse.json(
      { error: errorMessage, ticker },
      { status: statusCode }
    );
  }
}

function parseTimeWindow(window: string): number | null {
  switch (window) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    default:
      return null;
  }
}
