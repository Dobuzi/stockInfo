import { describe, it, expect, vi } from 'vitest';
import { withRetry, CircuitBreaker } from '@/lib/utils/retry';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10); // 3 attempts, 10ms base delay
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(withRetry(fn, 3, 10)).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('CircuitBreaker', () => {
  it('allows requests when circuit is closed', async () => {
    const breaker = new CircuitBreaker();
    const fn = vi.fn().mockResolvedValue('success');

    const result = await breaker.execute(fn);
    expect(result).toBe('success');
  });

  it('opens circuit after threshold failures', async () => {
    const breaker = new CircuitBreaker(3, 100); // 3 failures, 100ms reset
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    // Trigger 3 failures
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    await expect(breaker.execute(fn)).rejects.toThrow('fail');

    // Circuit should be open now
    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker open');
  });
});
