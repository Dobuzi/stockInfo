export function validateTicker(ticker: string): boolean {
  if (!ticker || ticker.length < 2 || ticker.length > 10) {
    return false;
  }

  // Allow uppercase letters, digits, dots, and hyphens (supports international tickers like 005930.KS)
  const regex = /^[A-Z0-9][A-Z0-9.-]*[A-Z0-9]$/;
  return regex.test(ticker);
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}
