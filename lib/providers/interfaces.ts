// Time range for price data
export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

// Price data point
export interface PriceData {
  ticker: string;
  date: string; // ISO 8601 format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Price provider interface
export interface IPriceProvider {
  getPrices(ticker: string, range: TimeRange): Promise<PriceData[]>;
  validateTicker(ticker: string): Promise<boolean>;
}

// Financial statement data
export interface FinancialStatement {
  ticker: string;
  fiscalDateEnding: string;
  reportedCurrency: string;
  [key: string]: string | number; // Dynamic fields like revenue, netIncome, etc.
}

// Financial provider interface
export interface IFinancialProvider {
  getIncomeStatement(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]>;
  getBalanceSheet(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]>;
  getCashFlow(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]>;
}

// News article
export interface NewsArticle {
  headline: string;
  source: string;
  url: string;
  publishedAt: string; // ISO 8601 format
  summary: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// News provider interface
export interface INewsProvider {
  getNews(ticker: string, windowDays: number): Promise<NewsArticle[]>;
}

// Overview provider interface
export interface IOverviewProvider {
  getOverview(ticker: string): Promise<import('@/lib/transformers/overview').OverviewData>;
}

// Provider factory return types
export type PriceProviderType = 'alpha_vantage' | 'finnhub' | 'stooq';
export type FinancialProviderType = 'fmp' | 'alpha_vantage';
export type NewsProviderType = 'finnhub' | 'gdelt';
export type OverviewProviderType = 'alpha_vantage' | 'fmp';
