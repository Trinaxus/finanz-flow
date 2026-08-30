import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const CreditCardOverview = () => {
  const { transactions, selectedYear, setSelectedYear } = useStore();
  const [viewMode, setViewMode] = useState<'year' | 'total'>('year');

  const allCreditCardTransactions = useMemo(
    () => transactions.filter(t => t.paymentMethod === 'Kreditkarte'),
    [transactions]
  );

  const dataYears = useMemo(
    () => Array.from(new Set(allCreditCardTransactions.map(t => new Date(t.date).getFullYear()))),
    [allCreditCardTransactions]
  );
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>(dataYears);
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear + 1);
    years.add(selectedYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [dataYears, selectedYear]);

  const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  const yearData = useMemo(() => {
    const initialData = Array.from({ length: 12 }, (_, i) => ({
      date: `${selectedYear}-${String(i).padStart(2, '0')}`,
      monthlySpending: 0
    }));

    const creditCardTransactions = allCreditCardTransactions.filter(t => new Date(t.date).getFullYear() === selectedYear);

    return creditCardTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const entry = acc.find(d => d.date === monthKey);

      if (entry) {
        entry.monthlySpending += Math.abs(transaction.amount);
      }
      return acc;
    }, initialData);
  }, [allCreditCardTransactions, selectedYear]);

  const totalData = useMemo(() => {
    const monthMap = new Map<string, { date: string; year: number; month: number; monthlySpending: number }>();
    allCreditCardTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { date: key, year: date.getFullYear(), month: date.getMonth(), monthlySpending: 0 });
      }
      const entry = monthMap.get(key)!;
      entry.monthlySpending += Math.abs(t.amount);
    });
    return Array.from(monthMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [allCreditCardTransactions]);

  const chartData = viewMode === 'year' ? yearData : totalData;

  const maxSpending = Math.max(...chartData.map(d => d.monthlySpending), 0);
  const minSpending = useMemo(() => {
    const positive = chartData.filter(d => d.monthlySpending > 0).map(d => d.monthlySpending);
    return positive.length ? Math.min(...positive) : 0;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const [yearStr, monthStr] = label.split('-');
      const monthIndex = parseInt(monthStr, 10);
      const monthName = viewMode === 'total'
        ? `${monthNames[monthIndex]} ${yearStr}`
        : monthNames[monthIndex];
      const monthTransactions = allCreditCardTransactions.filter(t => {
        const date = new Date(t.date);
        return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}` === label;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
        <div className="backdrop-blur-md bg-gray-900/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg border border-gray-700/50 max-w-xs">
          <p className="text-gray-200 font-medium mb-2">{monthName}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                €{Number(entry.value).toFixed(2)}
              </span>
            </p>
          ))}
          {monthTransactions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-1">
              <p className="text-xs text-gray-400">Einzelbuchungen:</p>
              {monthTransactions.map(t => (
                <div key={t.id} className="text-xs flex items-center justify-between gap-4">
                  <span className="text-gray-300 truncate flex-1">{t.description}</span>
                  <span className="text-rose-400 font-medium">€{Math.abs(t.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-display">Kreditkartenübersicht</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300/50 dark:border-gray-700/50 overflow-hidden">
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'year'
                  ? 'bg-purple-600/50 text-white'
                  : 'bg-white/5 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/30'
              }`}
            >
              Jahr
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'total'
                  ? 'bg-purple-600/50 text-white'
                  : 'bg-white/5 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/30'
              }`}
            >
              Gesamt
            </button>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={viewMode === 'total'}
            className="px-3 py-1.5 rounded-lg border border-gray-300/50 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[400px] rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-200/10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={(tick) => {
                const [y, m] = tick.split('-');
                return viewMode === 'total'
                  ? `${monthNames[parseInt(m, 10)]} '${y.slice(2)}`
                  : monthNames[parseInt(m, 10)];
              }}
              tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              interval={viewMode === 'total' ? 'preserveStartEnd' : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Area type="monotone" dataKey="monthlySpending" name="Kreditkarten-Ausgaben" stroke="#f87171" fillOpacity={1} fill="url(#colorSpending)" strokeWidth={2} />
            <Bar dataKey="monthlySpending" name="Monatliche Ausgaben" fill="rgba(234, 179, 8, 0.5)" barSize={10} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-rose-600/10 dark:bg-rose-600/10 backdrop-blur-sm border border-rose-500/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-rose-500/80 dark:text-rose-400/80" />
            <p className="text-lg font-display text-rose-900/80 dark:text-rose-100/80">Höchster Ausgabenbetrag: <span className="font-bold text-rose-600 dark:text-rose-400">{maxSpending.toFixed(2)}€</span></p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-rose-600/10 dark:bg-rose-600/10 backdrop-blur-sm border border-rose-500/30">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-500/80 dark:text-rose-400/80" />
            <p className="text-lg font-display text-rose-900/80 dark:text-rose-100/80">Niedrigster Ausgabenbetrag: <span className="font-bold text-rose-600 dark:text-rose-400">{minSpending.toFixed(2)}€</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
