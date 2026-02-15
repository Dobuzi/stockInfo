interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative';
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const styles = {
    positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${styles[sentiment]}`}
    >
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
}
