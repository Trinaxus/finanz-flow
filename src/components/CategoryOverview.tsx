import React from 'react';
import { Layers } from 'lucide-react';

interface CategoryProps {
  category: string;
  spent: number;
  budget: number;
}

export const CategoryOverview = () => {
  const { transactions, budgets } = useStore();
  
  const getCategorySpending = (category: string) => {
    return transactions
      .filter(t => t.category === category && t.type === 'expense' && !t.isPending)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-display">Top Kategorien</h2>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map(category => {
          const spent = getCategorySpending(category);
          const budget = budgets.find(b => b.category === category)?.limit || 0;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;

          return (
            <div key={category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm">{category}</span>
                <span className="text-sm">€{spent.toFixed(2)} / €{budget.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className={`h-full rounded-full ${
                    percentage > 90 ? 'bg-rose-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 