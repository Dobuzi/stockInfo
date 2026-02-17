import { NextRequest, NextResponse } from 'next/server';
import { getOverviewProvider } from '@/lib/providers/factory';
import { AlphaVantageProvider } from '@/lib/providers/alpha-vantage';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import { cacheOverview } from '@/lib/cache/server-cache';
import { withFallback } from '@/lib/utils/with-fallback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawTicker = searchParams.get('ticker');

  if (!rawTicker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 });
  }

  const ticker = normalizeTicker(rawTicker);

  if (!validateTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker format' }, { status: 400 });
  }

  try {
    const primary = getOverviewProvider();
    const fallback = new AlphaVantageProvider();

    const { result: data, provider } = await cacheOverview(ticker, async () => {
      const { result, provider } = await withFallback(
        { name: process.env.OVERVIEW_PROVIDER ?? 'fmp', fn: () => primary.getOverview(ticker) },
        { name: 'alpha_vantage', fn: () => fallback.getOverview(ticker) }
      );
      return Object.assign(result, { __provider: provider });
    });

    const providerUsed = (data as any).__provider ?? 'unknown';
    const { __provider, ...cleanData } = data as any;

    console.log(`[API Overview] ${ticker} served by ${providerUsed}`);

    return NextResponse.json({ ticker, provider: providerUsed, data: cleanData });
  } catch (error) {
    console.error('Overview API error:', error);

    let errorMessage = 'Failed to fetch overview data';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('API limit reached')) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('Invalid ticker')) {
        errorMessage = 'Invalid or unknown ticker symbol';
        statusCode = 404;
      } else if (
        error.message.includes('Forbidden') ||
        error.message.includes('403') ||
        error.message.includes('API_KEY') ||
        error.message.includes('API KEY') ||
        error.message.includes('not set')
      ) {
        errorMessage = 'Overview service unavailable. Both providers failed.';
        statusCode = 503;
      }
    }

    return NextResponse.json({ error: errorMessage, ticker }, { status: statusCode });
  }
}
