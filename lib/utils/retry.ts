export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry failed'); // Should never reach here
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailTime?: number;

  constructor(
    private readonly threshold = 5,
    private readonly resetTime = 60000 // 60 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker open - too many failures');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failures < this.threshold) {
      return false;
    }

    if (!this.lastFailTime) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastFailTime > this.resetTime) {
      this.reset();
      return false;
    }

    return true;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }

  private reset(): void {
    this.failures = 0;
    this.lastFailTime = undefined;
  }
}
