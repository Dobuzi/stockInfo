import { NextRequest, NextResponse } from 'next/server';
import { getFinancialProvider } from '@/lib/providers/factory';
import { cacheFinancials } from '@/lib/cache/server-cache';
import {
  computeIncomeMetrics,
  computeBalanceMetrics,
  computeCashFlowMetrics,
} from '@/lib/transformers/financials';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker');
  const statement = searchParams.get('statement');
  const period = searchParams.get('period') || 'annual';

  // Validation
  if (!tickerParam) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  if (!statement || !['income', 'balance', 'cashflow'].includes(statement)) {
    return NextResponse.json(
      { error: 'Invalid statement type. Use: income, balance, or cashflow' },
      { status: 400 }
    );
  }

  if (period !== 'annual' && period !== 'quarterly') {
    return NextResponse.json(
      { error: 'Invalid period. Use: annual or quarterly' },
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
    const provider = getFinancialProvider();

    const data = await cacheFinancials(ticker, statement, period, async () => {
      switch (statement) {
        case 'income':
          return await provider.getIncomeStatement(ticker, period as 'annual' | 'quarterly');
        case 'balance':
          return await provider.getBalanceSheet(ticker, period as 'annual' | 'quarterly');
        case 'cashflow':
          return await provider.getCashFlow(ticker, period as 'annual' | 'quarterly');
        default:
          throw new Error('Invalid statement type');
      }
    });

    // Compute metrics
    let metrics = {};

    if (statement === 'income') {
      metrics = computeIncomeMetrics(data);
    } else if (statement === 'balance') {
      metrics = computeBalanceMetrics(data);
    } else if (statement === 'cashflow') {
      // For cash flow, we need income statement for revenue
      const incomeData = await cacheFinancials(ticker, 'income', period, async () => {
        return await provider.getIncomeStatement(ticker, period as 'annual' | 'quarterly');
      });
      metrics = computeCashFlowMetrics(data, incomeData);
    }

    return NextResponse.json({
      ticker,
      statement,
      period,
      data,
      metrics,
    });
  } catch (error: any) {
    console.error('[API Financials]', error);

    let errorMessage = 'Failed to fetch financial data';
    let statusCode = 500;

    if (error.message.includes('Invalid ticker')) {
      errorMessage = 'Ticker not found';
      statusCode = 404;
    } else if (error.message.includes('rate limit') || error.message.includes('API limit reached')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('No') && error.message.includes('data available')) {
      errorMessage = `${statement} data not available for this ticker`;
      statusCode = 404;
    } else if (error.message.includes('API_KEY') || error.message.includes('not set')) {
      errorMessage = 'Financial data service configuration error. Please check API keys.';
      statusCode = 503;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        ticker,
        provider: process.env.FINANCIAL_PROVIDER || 'fmp'
      },
      { status: statusCode }
    );
  }
}
