import {
  IFinancialProvider,
  IOverviewProvider,
  FinancialStatement,
} from './interfaces';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';
import { transformOverview, type OverviewData } from '@/lib/transformers/overview';

const circuitBreaker = new CircuitBreaker();

export class FMPProvider implements IFinancialProvider, IOverviewProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://financialmodelingprep.com/api/v3';

  constructor() {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
      throw new Error('FMP_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async getOverview(ticker: string): Promise<OverviewData> {
    const normalizedTicker = ticker.replace('-', '.');

    // Fetch core data (required) and supplementary data (optional) separately
    // so a failed ratios/metrics call does not take down the whole response
    const [profile, quote] = await Promise.all([
      this.fetchProfile(normalizedTicker),
      this.fetchQuote(normalizedTicker),
    ]);

    // Supplementary endpoints — swallow failures (free tier may not include them)
    const [ratios, metrics] = await Promise.allSettled([
      this.fetchRatios(normalizedTicker),
      this.fetchKeyMetrics(normalizedTicker),
    ]).then(results => results.map(r => (r.status === 'fulfilled' ? r.value : [])));

    const r = (ratios as any[])[0] ?? {};
    const m = (metrics as any[])[0] ?? {};
    const price = quote.price || 1; // avoid divide-by-zero

    const raw = {
      Name: profile.companyName,
      Sector: profile.sector,
      Industry: profile.industry,
      MarketCapitalization: String(profile.mktCap || 0),
      '52WeekHigh': String(quote.yearHigh || 0),
      '52WeekLow': String(quote.yearLow || 0),
      Volume: String(quote.avgVolume || 0),
      PERatio: String(quote.pe || r.peRatioTTM || 0),
      ForwardPE: String(r.forwardPE || 0),
      PEGRatio: String(r.pegRatio || 0),
      PriceToBookRatio: String(quote.priceToBook || r.priceToBookRatioTTM || 0),
      PriceToSalesRatioTTM: String(r.priceToSalesRatioTTM || 0),
      EVToEBITDA: String(r.enterpriseValueOverEBITDATTM || 0),
      ProfitMargin: String((r.netProfitMarginTTM || 0) / 100),
      OperatingMarginTTM: String((r.operatingProfitMarginTTM || 0) / 100),
      ReturnOnEquityTTM: String((r.returnOnEquityTTM || 0) / 100),
      ReturnOnAssetsTTM: String((r.returnOnAssetsTTM || 0) / 100),
      RevenueTTM: String((m.revenuePerShareTTM || 0) * (profile.mktCap || 0) / price || 0),
      QuarterlyRevenueGrowthYOY: String((r.revenueGrowthTTM || 0) / 100),
      QuarterlyEarningsGrowthYOY: String((r.earningsGrowthTTM || 0) / 100),
      DilutedEPSTTM: String(quote.eps || 0),
      DebtToEquity: String(r.debtEquityRatioTTM || 0),
      CurrentRatio: String(r.currentRatioTTM || 0),
      QuickRatio: String(r.quickRatioTTM || 0),
      BookValue: String(m.bookValuePerShareTTM || 0),
      DividendYield: String((profile.lastDiv || 0) / price || 0),
      DividendPerShare: String(profile.lastDiv || 0),
      PayoutRatio: String((r.payoutRatioTTM || 0) / 100),
    };

    return transformOverview(raw);
  }

  async getIncomeStatement(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');
    const endpoint = period === 'annual' ? 'income-statement' : 'income-statement';
    const url = `${this.baseUrl}/${endpoint}/${normalizedTicker}?period=${period}&limit=5&apikey=${this.apiKey}`;

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`FMP API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No income statement data available');
    }

    return data.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.date || stmt.fillingDate,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      totalRevenue: parseFloat(stmt.revenue || '0'),
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
    const url = `${this.baseUrl}/balance-sheet-statement/${normalizedTicker}?period=${period}&limit=5&apikey=${this.apiKey}`;

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`FMP API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No balance sheet data available');
    }

    return data.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.date || stmt.fillingDate,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      totalAssets: parseFloat(stmt.totalAssets || '0'),
      totalCurrentAssets: parseFloat(stmt.totalCurrentAssets || '0'),
      totalLiabilities: parseFloat(stmt.totalLiabilities || '0'),
      totalCurrentLiabilities: parseFloat(stmt.totalCurrentLiabilities || '0'),
      totalShareholderEquity: parseFloat(stmt.totalStockholdersEquity || '0'),
    }));
  }

  async getCashFlow(
    ticker: string,
    period: 'annual' | 'quarterly'
  ): Promise<FinancialStatement[]> {
    const normalizedTicker = ticker.replace('-', '.');
    const url = `${this.baseUrl}/cash-flow-statement/${normalizedTicker}?period=${period}&limit=5&apikey=${this.apiKey}`;

    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`FMP API error: ${response.statusText}`);
        }
        return response.json();
      })
    );

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No cash flow data available');
    }

    return data.map((stmt: any) => ({
      ticker,
      fiscalDateEnding: stmt.date || stmt.fillingDate,
      reportedCurrency: stmt.reportedCurrency || 'USD',
      operatingCashflow: parseFloat(stmt.operatingCashFlow || '0'),
      capitalExpenditures: parseFloat(stmt.capitalExpenditure || '0'),
      cashflowFromInvestment: parseFloat(stmt.netCashUsedForInvestingActivites || '0'),
      cashflowFromFinancing: parseFloat(stmt.netCashUsedProvidedByFinancingActivities || '0'),
    }));
  }

  private async fetchProfile(ticker: string): Promise<any> {
    const url = `${this.baseUrl}/profile/${ticker}?apikey=${this.apiKey}`;
    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FMP API error: ${response.statusText}`);
        return response.json();
      })
    );
    // FMP returns {"Error Message": "..."} for auth errors
    if (data?.['Error Message']) {
      throw new Error(`FMP API error: ${data['Error Message']}`);
    }
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }
    return data[0];
  }

  private async fetchQuote(ticker: string): Promise<any> {
    const url = `${this.baseUrl}/quote/${ticker}?apikey=${this.apiKey}`;
    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FMP API error: ${response.statusText}`);
        return response.json();
      })
    );
    if (data?.['Error Message']) {
      throw new Error(`FMP API error: ${data['Error Message']}`);
    }
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Invalid ticker: ${ticker}`);
    }
    return data[0];
  }

  private async fetchRatios(ticker: string): Promise<any[]> {
    const url = `${this.baseUrl}/ratios-ttm/${ticker}?apikey=${this.apiKey}`;
    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FMP API error: ${response.statusText}`);
        return response.json();
      })
    );
    return Array.isArray(data) ? data : [];
  }

  private async fetchKeyMetrics(ticker: string): Promise<any[]> {
    const url = `${this.baseUrl}/key-metrics-ttm/${ticker}?apikey=${this.apiKey}`;
    const data = await circuitBreaker.execute(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FMP API error: ${response.statusText}`);
        return response.json();
      })
    );
    return Array.isArray(data) ? data : [];
  }
}
