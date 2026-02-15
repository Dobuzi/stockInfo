export function validateTicker(ticker: string): boolean {
  if (!ticker || ticker.length < 2 || ticker.length > 5) {
    return false;
  }

  // Allow uppercase letters, dots, and hyphens only
  const regex = /^[A-Z]+[.-]?[A-Z]*$/;
  return regex.test(ticker);
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}
