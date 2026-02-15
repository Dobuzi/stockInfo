'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationData {
  ticker: string;
  value: number;
  percentage: number;
}

interface AllocationChartProps {
  data: AllocationData[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function AllocationChart({ data }: AllocationChartProps) {
  if (data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
    name: item.ticker,
    value: item.value,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Portfolio Allocation
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(props: any) => {
              const percentage = props.percentage || 0;
              const name = props.name || '';
              return `${name} ${percentage.toFixed(1)}%`;
            }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => {
              if (value === undefined) return 'N/A';
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value);
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
