import {
  IPriceProvider,
  IFinancialProvider,
  INewsProvider,
  PriceProviderType,
  FinancialProviderType,
  NewsProviderType,
} from './interfaces';
import { AlphaVantageProvider } from './alpha-vantage';
import { FinnhubProvider } from './finnhub';

export function getPriceProvider(): IPriceProvider {
  const providerType = (process.env.PRICE_PROVIDER || 'alpha_vantage') as PriceProviderType;

  switch (providerType) {
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    default:
      throw new Error(`Unknown price provider: ${providerType}`);
  }
}

export function getFinancialProvider(): IFinancialProvider {
  const providerType = (process.env.FINANCIAL_PROVIDER || 'alpha_vantage') as FinancialProviderType;

  switch (providerType) {
    case 'alpha_vantage':
      return new AlphaVantageProvider();
    case 'fmp':
      // TODO: Implement FMP provider if needed
      throw new Error('FMP provider not yet implemented. Use alpha_vantage.');
    default:
      throw new Error(`Unknown financial provider: ${providerType}`);
  }
}

export function getNewsProvider(): INewsProvider {
  const providerType = (process.env.NEWS_PROVIDER || 'finnhub') as NewsProviderType;

  switch (providerType) {
    case 'finnhub':
      return new FinnhubProvider();
    default:
      throw new Error(`Unknown news provider: ${providerType}`);
  }
}
