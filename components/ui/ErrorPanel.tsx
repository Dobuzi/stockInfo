interface ErrorPanelProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-red-800 dark:text-red-200 mb-2">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
