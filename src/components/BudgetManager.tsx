import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Wallet, Plus, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import type { Budget } from '../types';

const COLORS = ['#10b981', '#ef4444'];

export const BudgetManager = () => {
  const { budgets, updateBudget } = useStore();
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: '',
    period: 'monthly'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudget({
      category: newBudget.category,
      limit: Number(newBudget.limit),
      spent: 0,
      period: newBudget.period as 'monthly' | 'yearly'
    });
    setNewBudget({ category: '', limit: '', period: 'monthly' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-display">Budgetverwaltung</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={newBudget.category}
          onChange={e => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
          placeholder="Kategorie"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        <input
          type="number"
          value={newBudget.limit}
          onChange={e => setNewBudget(prev => ({ ...prev, limit: e.target.value }))}
          placeholder="Limit"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(budget => (
          <BudgetCard key={budget.category} budget={budget} />
        ))}
      </div>
    </div>
  );
};

const BudgetCard = ({ budget }: { budget: Budget }) => {
  const percentage = (budget.spent / budget.limit) * 100;
  const isOverBudget = percentage > 100;

  const data = [
    { name: 'Spent', value: budget.spent },
    { name: 'Remaining', value: Math.max(budget.limit - budget.spent, 0) }
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">{budget.category}</h3>
        {isOverBudget && (
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        )}
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={40}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Ausgegeben</span>
          <span>€{budget.spent.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Limit</span>
          <span>€{budget.limit.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};