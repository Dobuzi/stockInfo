import { describe, it, expect } from 'vitest';
import { formatLargeNumber, formatPercentage, formatCurrency } from '@/lib/utils/formatting';

describe('formatLargeNumber', () => {
  it('formats billions correctly', () => {
    expect(formatLargeNumber(394328000000)).toBe('$394.3B');
    expect(formatLargeNumber(1500000000)).toBe('$1.5B');
  });

  it('formats millions correctly', () => {
    expect(formatLargeNumber(52000000)).toBe('$52.0M');
    expect(formatLargeNumber(1500000)).toBe('$1.5M');
  });

  it('formats thousands correctly', () => {
    expect(formatLargeNumber(250000)).toBe('$250.0K');
    expect(formatLargeNumber(1500)).toBe('$1.5K');
  });

  it('formats small numbers correctly', () => {
    expect(formatLargeNumber(500)).toBe('$500');
  });

  it('handles negative numbers', () => {
    expect(formatLargeNumber(-1000000)).toBe('-$1.0M');
  });
});

describe('formatPercentage', () => {
  it('formats percentages with 1 decimal place', () => {
    expect(formatPercentage(0.123)).toBe('12.3%');
    expect(formatPercentage(0.056)).toBe('5.6%');
  });

  it('handles negative percentages', () => {
    expect(formatPercentage(-0.023)).toBe('-2.3%');
  });
});

describe('formatCurrency', () => {
  it('formats currency with 2 decimal places', () => {
    expect(formatCurrency(186.3)).toBe('$186.30');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('adds thousands separators', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });
});
