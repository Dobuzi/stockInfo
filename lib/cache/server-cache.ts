import { unstable_cache } from 'next/cache';

export const cachePrices = (
  ticker: string,
  range: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`prices-${ticker}-${range}`], {
    revalidate: 120, // 2 minutes (optimized for free-tier APIs)
    tags: [`prices`, `ticker-${ticker}`],
  })();

export const cacheFinancials = (
  ticker: string,
  statement: string,
  period: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`financials-${ticker}-${statement}-${period}`], {
    revalidate: 86400, // 24 hours
    tags: [`financials`, `ticker-${ticker}`],
  })();

export const cacheNews = (
  ticker: string,
  window: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`news-${ticker}-${window}`], {
    revalidate: 600, // 10 minutes (balance freshness with API limits)
    tags: [`news`, `ticker-${ticker}`],
  })();

export const cacheOverview = (ticker: string, fn: () => Promise<any>) =>
  unstable_cache(fn, [`overview-${ticker}`], {
    revalidate: 21600, // 6 hours (fundamentals change slowly)
    tags: [`overview`, `ticker-${ticker}`],
  })();
