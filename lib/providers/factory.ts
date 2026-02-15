import {
  IPriceProvider,
  IFinancialProvider,
  INewsProvider,
  IOverviewProvider,
  PriceProviderType,
  FinancialProviderType,
  NewsProviderType,
  OverviewProviderType,
} from './interfaces';
import { AlphaVantageProvider } from './alpha-vantage';
import { FinnhubProvider } from './finnhub';
import { FinnhubPriceProvider } from './finnhub-prices';
import { FMPProvider } from './fmp';
import { StooqProvider } from './stooq';
import { GDELTProvider } from './gdelt';

export function getPriceProvider(): IPriceProvider {
  const providerType = (process.env.PRICE_PROVIDER || 'finnhub') as PriceProviderType;

  switch (providerType) {
    case 'finnhub':
      // Try Finnhub first, fall back to Stooq if no API key
      if (process.env.FINNHUB_API_KEY) {
        return new FinnhubPriceProvider();
      }
      console.warn('FINNHUB_API_KEY not set, falling back to Stooq (EOD data only)');
      return new StooqProvider();
    case 'stooq':
      return new StooqProvider();
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    default:
      throw new Error(`Unknown price provider: ${providerType}`);
  }
}

export function getFinancialProvider(): IFinancialProvider {
  const providerType = (process.env.FINANCIAL_PROVIDER || 'fmp') as FinancialProviderType;

  switch (providerType) {
    case 'fmp':
      return new FMPProvider();
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    default:
      throw new Error(`Unknown financial provider: ${providerType}`);
  }
}

export function getOverviewProvider(): IOverviewProvider {
  const providerType = (process.env.OVERVIEW_PROVIDER || 'fmp') as OverviewProviderType;

  switch (providerType) {
    case 'fmp':
      return new FMPProvider();
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    default:
      throw new Error(`Unknown overview provider: ${providerType}`);
  }
}

export function getNewsProvider(): INewsProvider {
  const providerType = (process.env.NEWS_PROVIDER || 'gdelt') as NewsProviderType;

  switch (providerType) {
    case 'gdelt':
      return new GDELTProvider();
    case 'finnhub':
      return new FinnhubProvider();
    default:
      throw new Error(`Unknown news provider: ${providerType}`);
  }
}
