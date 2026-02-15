import { NextRequest, NextResponse } from 'next/server';
import { getOverviewProvider } from '@/lib/providers/factory';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import { cacheOverview } from '@/lib/cache/server-cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawTicker = searchParams.get('ticker');

  if (!rawTicker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  const ticker = normalizeTicker(rawTicker);

  if (!validateTicker(ticker)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  try {
    const provider = getOverviewProvider();

    const data = await cacheOverview(ticker, async () => {
      return await provider.getOverview(ticker);
    });

    return NextResponse.json({
      ticker,
      data,
    });
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
      } else if (error.message.includes('API_KEY') || error.message.includes('not set')) {
        errorMessage = 'Overview service configuration error. Please check API keys.';
        statusCode = 503;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        ticker,
        provider: process.env.OVERVIEW_PROVIDER || 'fmp'
      },
      { status: statusCode }
    );
  }
}
