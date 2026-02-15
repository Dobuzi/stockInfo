import {
  IPriceProvider,
  IFinancialProvider,
  PriceData,
  TimeRange,
  FinancialStatement,
} from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

const circuitBreaker = new CircuitBreaker();

export class AlphaVantageProvider implements IPriceProvider, IFinancialProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async getPrices(ticker: string, range: TimeRange): Promise<PriceData[]> {
    // Alpha Vantage uses dots, not hyphens
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'TIME_SERIES_DAILY');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('outputsize', range === '5Y' || range === 'MAX' ? 'full' : 'compact');
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    if (data['Note']) {
      throw new Error('API rate limit exceeded');
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No price data available');
    }

    // Convert to our format
    const prices: PriceData[] = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      ticker,
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    }));

    // Filter by range
    return this.filterByRange(prices, range);
  }

  async validateTicker(ticker: string): Promise<boolean> {
    try {
      await this.getPrices(ticker, '1W');
      return true;
    } catch {
      return false;
    }
  }

  async getIncomeStatement(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'INCOME_STATEMENT');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    const statements = period === 'annual' ? data.annualReports : data.quarterlyReports;
    if (!statements) {
      throw new Error('No income statement data available');
    }

    return statements.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.fiscalDateEnding,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      totalRevenue: parseFloat(stmt.totalRevenue || '0'),
      grossProfit: parseFloat(stmt.grossProfit || '0'),
      operatingIncome: parseFloat(stmt.operatingIncome || '0'),
      netIncome: parseFloat(stmt.netIncome || '0'),
      ebitda: parseFloat(stmt.ebitda || '0'),
    }));
  }

  async getBalanceSheet(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'BALANCE_SHEET');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    const statements = period === 'annual' ? data.annualReports : data.quarterlyReports;
    if (!statements) {
      throw new Error('No balance sheet data available');
    }

    return statements.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.fiscalDateEnding,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      totalAssets: parseFloat(stmt.totalAssets || '0'),
      totalCurrentAssets: parseFloat(stmt.totalCurrentAssets || '0'),
      totalLiabilities: parseFloat(stmt.totalLiabilities || '0'),
      totalCurrentLiabilities: parseFloat(stmt.totalCurrentLiabilities || '0'),
      totalShareholderEquity: parseFloat(stmt.totalShareholderEquity || '0'),
    }));
  }

  async getCashFlow(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('function', 'CASH_FLOW');
    url.searchParams.set('symbol', normalizedTicker);
    url.searchParams.set('apikey', this.apiKey);

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (data['Error Message']) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }

    const statements = period === 'annual' ? data.annualReports : data.quarterlyReports;
    if (!statements) {
      throw new Error('No cash flow data available');
    }

    return statements.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.fiscalDateEnding,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      operatingCashflow: parseFloat(stmt.operatingCashflow || '0'),
      capitalExpenditures: parseFloat(stmt.capitalExpenditures || '0'),
      cashflowFromInvestment: parseFloat(stmt.cashflowFromInvestment || '0'),
      cashflowFromFinancing: parseFloat(stmt.cashflowFromFinancing || '0'),
    }));
  }

  private filterByRange(prices: PriceData[], range: TimeRange): PriceData[] {
    const now = new Date();
    let cutoffDate: Date;

    switch (range) {
      case '1W':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5Y':
        cutoffDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      case 'MAX':
        return prices; // Return all available data
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 1M
    }

    return prices.filter(p => new Date(p.date) >= cutoffDate);
  }
}
