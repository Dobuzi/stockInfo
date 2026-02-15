export interface Holding {
  id: string;           // UUID for unique identification
  ticker: string;       // Stock symbol (uppercase)
  quantity: number;     // Number of shares (supports decimals)
  avgCost: number;      // Average cost per share in USD
  addedDate: string;    // ISO 8601 date (YYYY-MM-DD)
}
