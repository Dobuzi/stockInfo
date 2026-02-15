import { unstable_cache } from 'next/cache';

export const cachePrices = (
  ticker: string,
  range: string,
  fn: () => Promise<any>
) =>
  unstable_cache(fn, [`prices-${ticker}-${range}`], {
    revalidate: 300, // 5 minutes
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
    revalidate: 900, // 15 minutes
    tags: [`news`, `ticker-${ticker}`],
  })();
