import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Tag } from 'lucide-react';
import { useStore } from '../store';
import { formatMonth } from '../utils/dateUtils';

export const CATEGORY_COLORS = [
  '#8b5cf6', // Violett
  '#ec4899', // Pink
  '#f59e0b', // Orange
  '#10b981', // Smaragdgrün
  '#3b82f6', // Blau
  '#ef4444', // Rot
  '#06b6d4', // Cyan
  '#f97316', // Helles Orange
  '#6366f1', // Indigo
  '#84cc16', // Limette
  '#a855f7', // Lila
  '#14b8a6', // Türkis
];

export const getCategoryColor = (category: string): string => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

export const CategoryAnalysis = () => {
  const { transactions, getYearlyAnalysis, selectedYear, selectedMonth } = useStore();
  const yearlyData = getYearlyAnalysis(selectedYear);
  const analysis = yearlyData.find(a => a.month === selectedMonth) || yearlyData[0] || { categories: {} };

  const categoryData = Object.entries(analysis.categories)
    .map(([name, amount]) => ({
      name,
      value: Math.abs(amount)
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const categoryName = payload[0].name;
      const categoryTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return (
          t.category === categoryName &&
          !t.isPending &&
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      }).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      return (
        <div className="backdrop-blur-md bg-gray-900/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg border border-gray-700/50 max-w-xs">
          <p className="text-gray-200 font-medium mb-2">{categoryName}</p>
          <p className="text-sm text-purple-400 mb-2">
            Summe: €{Number(payload[0].value).toFixed(2)}
          </p>
          {categoryTransactions.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {categoryTransactions.map(t => (
                <div key={t.id} className="text-xs flex items-center justify-between gap-4">
                  <span className="text-gray-300 truncate flex-1">{t.description}</span>
                  <span className={t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                    {t.type === 'income' ? '+' : '-'}€{Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, fill } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text
          x={x}
          y={y}
          fill={fill}
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="font-medium"
          fontSize={13}
        >
          {`€${value.toFixed(2)}`}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-display">Kategorien {formatMonth(selectedMonth, selectedYear)}</h2>
      </div>
      
      <div className="h-[300px] rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-200/10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={4}
              stroke="none"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categoryData.map((category) => (
          <div
            key={category.name}
            className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCategoryColor(category.name) }}
              />
              <span className="font-display text-sm">{category.name}</span>
            </div>
            <p className="mt-1 text-lg font-bold">€{Number(category.value).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};