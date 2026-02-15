'use client';

import { formatLargeNumber } from '@/lib/utils/formatting';
import { FinancialStatement } from '@/lib/providers/interfaces';

interface FinancialTableProps {
  data: FinancialStatement[];
}

export function FinancialTable({ data }: FinancialTableProps) {
  if (data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No data available</p>;
  }

  const keys = Object.keys(data[0]).filter(
    k => !['ticker', 'fiscalDateEnding', 'reportedCurrency'].includes(k)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b">
              Item
            </th>
            {data.map((stmt) => (
              <th
                key={stmt.fiscalDateEnding}
                className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300 border-b"
              >
                {new Date(stmt.fiscalDateEnding).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 border-b">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </td>
              {data.map((stmt) => (
                <td
                  key={stmt.fiscalDateEnding}
                  className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300 border-b"
                >
                  {formatLargeNumber(Number(stmt[key]) || 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
