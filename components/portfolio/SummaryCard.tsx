interface SummaryCardProps {
  label: string;
  value: string;
  valueColor?: 'green' | 'red' | 'gray';
  icon?: React.ReactNode;
}

export function SummaryCard({ label, value, valueColor = 'gray', icon }: SummaryCardProps) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-500',
    red: 'text-red-600 dark:text-red-500',
    gray: 'text-gray-900 dark:text-white',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        {icon && <span className={colorClasses[valueColor]}>{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${colorClasses[valueColor]}`}>{value}</p>
    </div>
  );
}
