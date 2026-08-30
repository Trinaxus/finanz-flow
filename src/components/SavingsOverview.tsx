import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { ChevronDown, ChevronUp, Star, TrendingUp } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export const SavingsOverview = () => {
  const { transactions, selectedYear, setSelectedYear } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'year' | 'total'>('year');

  const allSavingsTransactions = useMemo(
    () => transactions.filter(t => t.category === 'Sparen'),
    [transactions]
  );

  const dataYears = useMemo(
    () => Array.from(new Set(allSavingsTransactions.map(t => new Date(t.date).getFullYear()))),
    [allSavingsTransactions]
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

  const savingsTransactions = allSavingsTransactions.filter(t => new Date(t.date).getFullYear() === selectedYear);

  const initialData = Array.from({ length: 12 }, (_, i) => ({
    date: `${selectedYear}-${String(i).padStart(2, '0')}`,
    savings: 0,
    monthlyDeposit: 0
  }));

  // Berechne die Ersparnisse im Zeitverlauf und die monatlichen Einzahlungen
  // Einnahmen mit Kategorie Sparen = Entnahme aus dem Sparvermögen (negativ)
  const savingsData = savingsTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    const entry = acc.find(d => d.date === monthKey);

    if (entry) {
      const signedAmount = transaction.type === 'expense'
        ? Math.abs(transaction.amount)
        : -Math.abs(transaction.amount);
      entry.monthlyDeposit += signedAmount;
      entry.savings += signedAmount;
    }
    return acc;
  }, initialData);

  // Berechne die kumulierten Ersparnisse
  savingsData.reduce((acc, entry) => {
    entry.savings += acc;
    return entry.savings;
  }, 0);

  // Gesamtdaten über alle Jahre
  const savingsTotalData = useMemo(() => {
    const monthMap = new Map<string, { date: string; year: number; month: number; monthlyDeposit: number; savings: number }>();
    allSavingsTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { date: key, year: date.getFullYear(), month: date.getMonth(), monthlyDeposit: 0, savings: 0 });
      }
      const entry = monthMap.get(key)!;
      const signedAmount = t.type === 'expense'
        ? Math.abs(t.amount)
        : -Math.abs(t.amount);
      entry.monthlyDeposit += signedAmount;
      entry.savings += signedAmount;
    });
    const sorted = Array.from(monthMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return sorted.map(entry => {
      running += entry.monthlyDeposit;
      return { ...entry, savings: running };
    });
  }, [allSavingsTransactions]);

  const chartData = viewMode === 'year' ? savingsData : savingsTotalData;

  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };

  // Berechne den höchsten Sparbetrag
  const maxSavings = Math.max(...chartData.map(d => d.savings), 0);

  // Gesamtersparnis über alle Buchungen hinweg
  const totalSavings = useMemo(() => {
    return allSavingsTransactions.reduce((sum, t) => {
      return sum + (t.type === 'expense' ? t.amount : -t.amount);
    }, 0);
  }, [allSavingsTransactions]);

  // Monatsnamen für die X-Achse
  const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const [yearStr, monthStr] = label.split('-');
      const monthIndex = parseInt(monthStr, 10);
      const monthName = viewMode === 'total'
        ? `${monthNames[monthIndex]} ${yearStr}`
        : monthNames[monthIndex] || label;
      const monthTransactions = allSavingsTransactions.filter(t => {
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
              <p className="text-xs text-gray-400">Einzelbeiträge:</p>
              {monthTransactions.map(t => {
                const isDeposit = t.type === 'expense';
                return (
                  <div key={t.id} className="text-xs flex items-center justify-between gap-4">
                    <span className="text-gray-300 truncate flex-1">{t.description}</span>
                    <span className={`font-medium ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isDeposit ? '+' : '-'}€{Math.abs(t.amount).toFixed(2)}
                    </span>
                  </div>
                );
              })}
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
        <h2 className="text-xl font-display">Sparübersicht</h2>
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
            {availableYears.length === 0 && (
              <option value={selectedYear}>{selectedYear}</option>
            )}
          </select>
        </div>
      </div>
      
      <div className="h-[400px] rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-200/10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
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
            <Area type="monotone" dataKey="savings" name="Gesamtsparstand" stroke="#34d399" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} />
            <Bar dataKey="monthlyDeposit" name="Monatliche Einzahlung" fill="rgba(234, 179, 8, 0.5)" barSize={10} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600/70 dark:text-emerald-400/70" />
            <p className="text-lg font-display text-emerald-900 dark:text-emerald-100">Höchster Sparbetrag: <span className="font-bold text-emerald-600 dark:text-emerald-400">{maxSavings.toFixed(2)}€</span></p>
          </div>
          <Star className="w-6 h-6 text-emerald-600/70 dark:text-emerald-400/70" title="Meilenstein erreicht!" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600/70 dark:text-emerald-400/70" />
            <p className="text-lg font-display text-emerald-900 dark:text-emerald-100">Gesamtersparnis: <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalSavings.toFixed(2)}€</span></p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10 overflow-hidden">
        <button
          onClick={toggleExpanded}
          className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-200/20 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-2 md:gap-4">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="text-lg font-display">Alle Transaktionen</h3>
          </div>
        </button>
        {expanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100/5 dark:bg-gray-900/30 border-b border-gray-200/10 dark:border-gray-700/30">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-display tracking-wider text-gray-500 dark:text-gray-400">Datum</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-display tracking-wider text-gray-500 dark:text-gray-400">Beschreibung</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-display tracking-wider text-gray-500 dark:text-gray-400">Betrag</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-display tracking-wider text-gray-500 dark:text-gray-400">Typ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/10 dark:divide-gray-700/30">
                {savingsTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`text-sm transition-colors hover:bg-gray-200/20 dark:hover:bg-gray-700/30 ${
                      index % 2 === 0
                        ? 'bg-white/5 dark:bg-gray-800/30'
                        : 'bg-gray-100/5 dark:bg-gray-900/20'
                    }`}
                  >
                    <td className="px-4 md:px-6 py-3 text-gray-500">{formatDate(new Date(transaction.date))}</td>
                    <td className="px-4 md:px-6 py-3 font-display">{transaction.description}</td>
                    <td className={`px-4 md:px-6 py-3 text-right font-display ${transaction.type === 'expense' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {transaction.type === 'expense' ? '+' : '-'}€{Math.abs(transaction.amount).toFixed(2)}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${transaction.type === 'expense' ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-600/20 text-rose-600 dark:text-rose-400'}`}>
                        {transaction.type === 'expense' ? 'Einzahlung' : 'Entnahme'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}; 