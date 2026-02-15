import { NextRequest, NextResponse } from 'next/server';
import { getPriceProvider } from '@/lib/providers/factory';
import { cachePrices } from '@/lib/cache/server-cache';
import { transformPriceData } from '@/lib/transformers/prices';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import { TimeRange } from '@/lib/providers/interfaces';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const range = (searchParams.get('range') || '1M') as TimeRange;

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

  try {
    const provider = getPriceProvider();

    const prices = await cachePrices(ticker, range, async () => {
      return await provider.getPrices(ticker, range);
    });

    const transformed = transformPriceData(prices);

    return NextResponse.json({
      ticker,
      range,
      data: transformed.prices,
      meta: {
        currentPrice: transformed.current,
        dayChange: transformed.dayChange,
        periodChange: transformed.periodChange,
      },
    });
  } catch (error: any) {
    console.error('[API Prices]', error);

    // Map common errors to user-friendly messages
    let errorMessage = 'Failed to fetch price data';
    let statusCode = 500;

    if (error.message.includes('Invalid ticker')) {
      errorMessage = 'Ticker not found';
      statusCode = 404;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('Circuit breaker open')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a minute.';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, ticker },
      { status: statusCode }
    );
  }
}
