import { NewsArticle } from '@/lib/providers/interfaces';

export function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();

  return articles.filter(article => {
    // Create fingerprint: lowercase, remove punctuation, first 50 chars
    const fingerprint = article.headline
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .slice(0, 50);

    if (seen.has(fingerprint)) {
      return false;
    }

    seen.add(fingerprint);
    return true;
  });
}

export function computeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase();

  const positiveWords = [
    'surge', 'surges', 'record', 'beats', 'beat', 'growth', 'profit',
    'rally', 'rallies', 'gain', 'gains', 'innovation', 'breakthrough',
    'soar', 'soars', 'jump', 'jumps', 'rise', 'rises', 'up',
  ];

  const negativeWords = [
    'plunge', 'plunges', 'loss', 'losses', 'cut', 'cuts', 'lawsuit',
    'recall', 'recalls', 'downgrade', 'downgrades', 'tumble', 'tumbles',
    'miss', 'misses', 'warning', 'decline', 'declines', 'weak', 'down',
    'fall', 'falls', 'drop', 'drops',
  ];

  let score = 0;

  positiveWords.forEach(word => {
    if (lower.includes(word)) {
      score += 1;
    }
  });

  negativeWords.forEach(word => {
    if (lower.includes(word)) {
      score -= 1;
    }
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}
