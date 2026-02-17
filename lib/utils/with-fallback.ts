/**
 * Tries primary provider, falls back to secondary on 403/429/network errors.
 * Returns { result, provider } so route can log which provider succeeded.
 */
export async function withFallback<T>(
  primary: { name: string; fn: () => Promise<T> },
  secondary: { name: string; fn: () => Promise<T> }
): Promise<{ result: T; provider: string }> {
  try {
    const result = await primary.fn();
    return { result, provider: primary.name };
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    const isFallbackTrigger =
      msg.includes('403') ||
      msg.includes('Forbidden') ||
      msg.includes('rate limit') ||
      msg.includes('API limit reached') ||
      msg.includes('429') ||
      msg.includes('ECONNRESET') ||
      msg.includes('fetch failed');

    if (!isFallbackTrigger) throw err; // bubble non-retriable errors

    console.warn(`[withFallback] ${primary.name} failed (${msg.slice(0, 80)}), trying ${secondary.name}`);

    const result = await secondary.fn();
    return { result, provider: secondary.name };
  }
}
