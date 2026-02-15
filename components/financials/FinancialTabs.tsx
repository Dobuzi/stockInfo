'use client';

import { useState } from 'react';

type StatementType = 'income' | 'balance' | 'cashflow';

interface FinancialTabsProps {
  onTabChange: (tab: StatementType) => void;
  defaultTab?: StatementType;
}

export function FinancialTabs({ onTabChange, defaultTab = 'income' }: FinancialTabsProps) {
  const [activeTab, setActiveTab] = useState<StatementType>(defaultTab);

  const tabs: { value: StatementType; label: string }[] = [
    { value: 'income', label: 'Income Statement' },
    { value: 'balance', label: 'Balance Sheet' },
    { value: 'cashflow', label: 'Cash Flow' },
  ];

  const handleTabClick = (tab: StatementType) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTabClick(tab.value)}
          className={`px-4 py-2 font-medium ${
            activeTab === tab.value
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
