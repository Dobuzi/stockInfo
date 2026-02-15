import { describe, it, expect } from 'vitest';
import { transformOverview, formatMetric } from '@/lib/transformers/overview';

describe('formatMetric', () => {
  it('should convert valid number string to number', () => {
    expect(formatMetric('123.45', 'number')).toBe(123.45);
  });

  it('should handle "None" as null', () => {
    expect(formatMetric('None', 'number')).toBeNull();
  });

  it('should handle undefined as null', () => {
    expect(formatMetric(undefined, 'number')).toBeNull();
  });

  it('should convert percent string to decimal', () => {
    expect(formatMetric('0.25', 'percent')).toBe(25);
  });

  it('should handle negative numbers', () => {
    expect(formatMetric('-15.5', 'number')).toBe(-15.5);
  });
});

describe('transformOverview', () => {
  it('should transform complete Alpha Vantage response', () => {
    const raw = {
      Symbol: 'AAPL',
      Name: 'Apple Inc',
      Sector: 'Technology',
      Industry: 'Consumer Electronics',
      MarketCapitalization: '3000000000000',
      '52WeekHigh': '199.62',
      '52WeekLow': '164.08',
      '50DayMovingAverage': '185.23',
      PERatio: '30.5',
      ForwardPE: '28.3',
      PEGRatio: '2.1',
      PriceToBookRatio: '45.2',
      PriceToSalesRatioTTM: '7.8',
      EVToEBITDA: '23.4',
      ProfitMargin: '0.25',
      OperatingMarginTTM: '0.30',
      ReturnOnEquityTTM: '1.47',
      ReturnOnAssetsTTM: '0.22',
      RevenueTTM: '383000000000',
      QuarterlyRevenueGrowthYOY: '0.02',
      QuarterlyEarningsGrowthYOY: '0.11',
      DilutedEPSTTM: '6.13',
      DebtToEquity: '1.96',
      CurrentRatio: '0.98',
      QuickRatio: '0.82',
      BookValue: '4.26',
      DividendYield: '0.0045',
      DividendPerShare: '0.96',
      PayoutRatio: '0.16',
    };

    const result = transformOverview(raw);

    expect(result).toEqual({
      name: 'Apple Inc',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 3000000000000,
      fiftyTwoWeekHigh: 199.62,
      fiftyTwoWeekLow: 164.08,
      averageVolume: null,
      peRatio: 30.5,
      forwardPE: 28.3,
      pegRatio: 2.1,
      priceToBook: 45.2,
      priceToSales: 7.8,
      evToEbitda: 23.4,
      profitMargin: 25,
      operatingMargin: 30,
      returnOnEquity: 147,
      returnOnAssets: 22,
      revenue: 383000000000,
      quarterlyRevenueGrowth: 2,
      quarterlyEarningsGrowth: 11,
      eps: 6.13,
      debtToEquity: 1.96,
      currentRatio: 0.98,
      quickRatio: 0.82,
      bookValue: 4.26,
      dividendYield: 0.45,
      dividendPerShare: 0.96,
      payoutRatio: 16,
    });
  });

  it('should handle missing fields gracefully', () => {
    const raw = {
      Symbol: 'TEST',
      Name: 'Test Company',
      Sector: 'None',
      PERatio: 'None',
      DividendYield: 'None',
    };

    const result = transformOverview(raw);

    expect(result.name).toBe('Test Company');
    expect(result.sector).toBeNull();
    expect(result.peRatio).toBeNull();
    expect(result.dividendYield).toBeNull();
  });
});
