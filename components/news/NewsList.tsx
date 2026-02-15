'use client';

import { NewsArticle } from '@/lib/providers/interfaces';
import { formatTimeAgo } from '@/lib/utils/formatting';
import { SentimentBadge } from './SentimentBadge';

interface NewsListProps {
  articles: NewsArticle[];
}

export function NewsList({ articles }: NewsListProps) {
  if (articles.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No news available</p>;
  }

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <a
          key={index}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {article.headline}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {article.summary}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {article.source} • {formatTimeAgo(article.publishedAt)}
              </div>
            </div>
            {article.sentiment && <SentimentBadge sentiment={article.sentiment} />}
          </div>
        </a>
      ))}
    </div>
  );
}
