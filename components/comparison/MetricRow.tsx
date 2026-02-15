interface MetricRowProps {
  label: string;
  values: (string | number | null)[];
  type?: 'text' | 'number' | 'percent' | 'currency';
}

export function MetricRow({ label, values, type = 'text' }: MetricRowProps) {
  const formatValue = (value: string | number | null) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (type === 'percent') {
      return `${Number(value).toFixed(2)}%`;
    }

    if (type === 'currency') {
      return `$${Number(value).toFixed(2)}`;
    }

    if (type === 'number' && typeof value === 'number') {
      return value.toFixed(2);
    }

    return String(value);
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {label}
      </td>
      {values.map((value, idx) => (
        <td
          key={idx}
          className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap text-right"
        >
          {formatValue(value)}
        </td>
      ))}
    </tr>
  );
}
