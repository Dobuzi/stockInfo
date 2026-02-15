import { NextRequest, NextResponse } from 'next/server';
import { AlphaVantageProvider } from '@/lib/providers/alpha-vantage';
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
    const provider = new AlphaVantageProvider();

    const data = await cacheOverview(ticker, async () => {
      return await provider.getOverview(ticker);
    });

    return NextResponse.json({
      ticker,
      data,
    });
  } catch (error) {
    console.error('Overview API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.message.includes('Invalid ticker')) {
        return NextResponse.json(
          { error: 'Invalid or unknown ticker symbol' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}
