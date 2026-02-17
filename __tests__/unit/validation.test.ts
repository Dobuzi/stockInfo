import { describe, it, expect } from 'vitest';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';

describe('validateTicker', () => {
  it('accepts valid US ticker symbols', () => {
    expect(validateTicker('AAPL')).toBe(true);
    expect(validateTicker('TSLA')).toBe(true);
    expect(validateTicker('BRK.B')).toBe(true);
    expect(validateTicker('BRK-B')).toBe(true);
  });

  it('accepts international ticker symbols', () => {
    expect(validateTicker('005930.KS')).toBe(true); // Samsung KRX
    expect(validateTicker('RDS.A')).toBe(true);
  });

  it('rejects invalid symbols', () => {
    expect(validateTicker('AAPL#')).toBe(false);
    expect(validateTicker('')).toBe(false);
    expect(validateTicker('A')).toBe(false); // too short
    expect(validateTicker('ABCDEFGHIJK')).toBe(false); // 11 chars, too long
    expect(validateTicker('.AAPL')).toBe(false); // starts with dot
    expect(validateTicker('AAPL.')).toBe(false); // ends with dot
  });
});

describe('normalizeTicker', () => {
  it('converts to uppercase', () => {
    expect(normalizeTicker('aapl')).toBe('AAPL');
    expect(normalizeTicker('tsla')).toBe('TSLA');
  });

  it('preserves dots and hyphens', () => {
    expect(normalizeTicker('brk.b')).toBe('BRK.B');
    expect(normalizeTicker('brk-b')).toBe('BRK-B');
  });

  it('trims whitespace', () => {
    expect(normalizeTicker('  AAPL  ')).toBe('AAPL');
  });
});
