import { NextRequest, NextResponse } from 'next/server';
import { getPriceProvider } from '@/lib/providers/factory';
import { StooqProvider } from '@/lib/providers/stooq';
import { cachePrices } from '@/lib/cache/server-cache';
import { transformPriceData } from '@/lib/transformers/prices';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import { withFallback } from '@/lib/utils/with-fallback';
import { TimeRange } from '@/lib/providers/interfaces';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const range = (searchParams.get('range') || '1M') as TimeRange;

  if (!tickerParam) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 });
  }

  const ticker = normalizeTicker(tickerParam);

  if (!validateTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker format' }, { status: 400 });
  }

  try {
    const primary = getPriceProvider();
    const stooq = new StooqProvider();

    const { result: prices, provider } = await cachePrices(ticker, range, async () => {
      const { result, provider } = await withFallback(
        { name: process.env.PRICE_PROVIDER ?? 'finnhub', fn: () => primary.getPrices(ticker, range) },
        { name: 'stooq', fn: () => stooq.getPrices(ticker, range) }
      );
      // attach provider name so cache wrapper can pass it through
      (result as any).__provider = provider;
      return result;
    });

    const providerUsed = (prices as any).__provider ?? 'unknown';
    const cleanPrices = prices.filter((p: any) => p.__provider === undefined || true).map(({ __provider, ...p }: any) => p);

    const transformed = transformPriceData(cleanPrices);

    console.log(`[API Prices] ${ticker}/${range} served by ${providerUsed}`);

    return NextResponse.json({
      ticker,
      range,
      provider: providerUsed,
      data: transformed.prices,
      meta: {
        currentPrice: transformed.current,
        dayChange: transformed.dayChange,
        periodChange: transformed.periodChange,
      },
    });
  } catch (error: any) {
    console.error('[API Prices]', error);

    let errorMessage = 'Failed to fetch price data';
    let statusCode = 500;

    if (error.message?.includes('Invalid ticker') || error.message?.includes('no_data')) {
      errorMessage = 'Ticker not found';
      statusCode = 404;
    } else if (
      error.message?.includes('Forbidden') ||
      error.message?.includes('403') ||
      error.message?.includes('API_KEY') ||
      error.message?.includes('API KEY') ||
      error.message?.includes('not set')
    ) {
      errorMessage = 'Price service unavailable. Both providers failed.';
      statusCode = 503;
    }

    return NextResponse.json({ error: errorMessage, ticker }, { status: statusCode });
  }
}
