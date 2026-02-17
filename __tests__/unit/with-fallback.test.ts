import { describe, it, expect, vi } from 'vitest';
import { withFallback } from '@/lib/utils/with-fallback';

describe('withFallback', () => {
  it('returns primary result when primary succeeds', async () => {
    const primary = { name: 'primary', fn: vi.fn().mockResolvedValue([1, 2, 3]) };
    const secondary = { name: 'secondary', fn: vi.fn().mockResolvedValue([4, 5, 6]) };

    const { result, provider } = await withFallback(primary, secondary);

    expect(result).toEqual([1, 2, 3]);
    expect(provider).toBe('primary');
    expect(secondary.fn).not.toHaveBeenCalled();
  });

  it('falls back to secondary on 403 Forbidden', async () => {
    const primary = {
      name: 'finnhub',
      fn: vi.fn().mockRejectedValue(new Error('Finnhub API error: Forbidden')),
    };
    const secondary = { name: 'stooq', fn: vi.fn().mockResolvedValue([4, 5, 6]) };

    const { result, provider } = await withFallback(primary, secondary);

    expect(result).toEqual([4, 5, 6]);
    expect(provider).toBe('stooq');
  });

  it('falls back to secondary on 429 rate limit', async () => {
    const primary = {
      name: 'fmp',
      fn: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
    };
    const secondary = { name: 'alpha_vantage', fn: vi.fn().mockResolvedValue({ name: 'Apple' }) };

    const { result, provider } = await withFallback(primary, secondary);

    expect(result).toEqual({ name: 'Apple' });
    expect(provider).toBe('alpha_vantage');
  });

  it('throws when both providers fail', async () => {
    const primary = {
      name: 'primary',
      fn: vi.fn().mockRejectedValue(new Error('Finnhub API error: Forbidden')),
    };
    const secondary = {
      name: 'secondary',
      fn: vi.fn().mockRejectedValue(new Error('Stooq also failed')),
    };

    await expect(withFallback(primary, secondary)).rejects.toThrow('Stooq also failed');
  });

  it('does NOT fall back on non-retriable errors', async () => {
    const primary = {
      name: 'primary',
      fn: vi.fn().mockRejectedValue(new Error('Invalid ticker: FAKE')),
    };
    const secondary = { name: 'secondary', fn: vi.fn().mockResolvedValue([]) };

    await expect(withFallback(primary, secondary)).rejects.toThrow('Invalid ticker: FAKE');
    expect(secondary.fn).not.toHaveBeenCalled();
  });
});
