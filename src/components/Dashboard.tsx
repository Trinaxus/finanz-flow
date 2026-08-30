import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { AccountBalance } from './AccountBalance';
import { MonthlyBalanceChart } from './MonthlyBalanceChart';
import { YearlyComparison } from './YearlyComparison';

export const Dashboard = () => {
  const { transactions, selectedYear, getYearlyAnalysis } = useStore();

  // Grundlegende Berechnungen
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.isPending)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !t.isPending)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Jahresverlauf für Mini-Sparklines (reagiert auf selectedYear)
  const monthlyData = useMemo(() => {
    return getYearlyAnalysis(selectedYear).map(analysis => ({
      income: analysis.income,
      expenses: analysis.expenses
    }));
  }, [selectedYear, getYearlyAnalysis]);

  const hasIncomeData = monthlyData.some(d => d.income !== 0);
  const hasExpenseData = monthlyData.some(d => d.expenses !== 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        <AccountBalance />

        {/* Einnahmen Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex flex-col">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm opacity-75 font-display">Gesamteinnahmen</p>
              <p className="text-xl sm:text-2xl font-bold">€{totalIncome.toFixed(2)}</p>
            </div>
          </div>
          {hasIncomeData && (
            <div className="mt-4 flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    fill="url(#incomeSpark)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Ausgaben Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-rose-600/10 dark:bg-rose-600/10 backdrop-blur-sm border border-rose-500/30 flex flex-col">
          <div className="flex items-center gap-4">
            <TrendingDown className="w-6 sm:w-8 h-6 sm:h-8 text-rose-500/80 dark:text-rose-400/80" />
            <div>
              <p className="text-sm font-display text-rose-900/70 dark:text-rose-100/70">Gesamtausgaben</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">€{totalExpenses.toFixed(2)}</p>
            </div>
          </div>
          {hasExpenseData && (
            <div className="mt-4 flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f43f5e"
                    fill="url(#expenseSpark)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* MonthlyBalanceChart */}
      <MonthlyBalanceChart />

      {/* YearlyComparison */}
      <YearlyComparison />
    </div>
  );
};