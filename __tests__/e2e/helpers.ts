/**
 * E2E test helpers
 */

/**
 * Check if API keys are configured
 * Used to conditionally skip tests that require real API calls
 */
export function hasApiKeys(): boolean {
  return !!(
    process.env.ALPHA_VANTAGE_API_KEY &&
    process.env.FINNHUB_API_KEY
  );
}

/**
 * Get skip reason if API keys are missing
 */
export function skipWithoutApiKeys(): string | boolean {
  return hasApiKeys()
    ? false
    : 'Skipping - API keys not configured. Set ALPHA_VANTAGE_API_KEY and FINNHUB_API_KEY to run this test.';
}
