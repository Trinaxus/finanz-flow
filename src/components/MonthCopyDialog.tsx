import React, { useMemo, useState, useEffect } from 'react';
import { X, Copy, Calendar, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../store';
import { formatMonth, formatDate, isValidDate } from '../utils/dateUtils';
import type { Transaction } from '../types';

const formatCurrency = (amount: number) => `€${Math.abs(amount).toFixed(2)}`;

interface MonthCopyDialogProps {
  onClose: () => void;
}

export const MonthCopyDialog: React.FC<MonthCopyDialogProps> = ({ onClose }) => {
  const { transactions, getTransactionsByMonth, copyTransactionsToMonth } = useStore();
  const now = new Date();

  const availableMonths = useMemo(() => {
    const months = new Map<string, { year: number; month: number; label: string }>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      if (!isValidDate(date)) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months.has(key)) {
        months.set(key, { year: date.getFullYear(), month: date.getMonth(), label: formatMonth(date.getMonth(), date.getFullYear()) });
      }
    });
    return Array.from(months.values()).sort((a, b) => b.year - a.year || b.month - a.month);
  }, [transactions]);

  const years = useMemo(() => {
    const allYears = new Set<number>([now.getFullYear(), now.getFullYear() + 1]);
    transactions.forEach(t => {
      const date = new Date(t.date);
      if (isValidDate(date)) allYears.add(date.getFullYear());
    });
    return Array.from(allYears).sort((a, b) => b - a);
  }, [transactions, now]);

  const [sourceYear, setSourceYear] = useState(availableMonths[0]?.year ?? now.getFullYear());
  const [sourceMonth, setSourceMonth] = useState(availableMonths[0]?.month ?? now.getMonth());
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getMonth());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sourceTransactions = useMemo(
    () => getTransactionsByMonth(sourceMonth, sourceYear),
    [getTransactionsByMonth, sourceMonth, sourceYear]
  );

  useEffect(() => {
    setSelectedIds(sourceTransactions.map(t => t.id));
  }, [sourceTransactions]);

  useEffect(() => {
    if (availableMonths.length > 0) {
      const first = availableMonths[0];
      setSourceYear(first.year);
      setSourceMonth(first.month);
    }
  }, [availableMonths]);

  const allSelected = selectedIds.length === sourceTransactions.length && sourceTransactions.length > 0;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : sourceTransactions.map(t => t.id));
  };

  const toggleTransaction = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCopy = () => {
    if (selectedIds.length === 0) {
      setFeedback('Bitte mindestens eine Transaktion auswählen');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const count = copyTransactionsToMonth(
      sourceMonth,
      sourceYear,
      targetMonth,
      targetYear,
      selectedIds
    );
    setFeedback(`${count} Transaktion(en) nach ${formatMonth(targetMonth, targetYear)} übertragen`);
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1500);
  };

  const sourceMonthOptions = useMemo(() => {
    return availableMonths.filter(m => m.year === sourceYear);
  }, [availableMonths, sourceYear]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display flex items-center gap-2">
            <Copy className="w-5 h-5 text-purple-600" />
            Monat auf Monat übertragen
          </h3>
          <button onClick={onClose} className="p-1 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3 p-4 rounded-xl bg-white/5 dark:bg-gray-900/30 border border-gray-200/10">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
              <Calendar className="w-4 h-4" />
              Quellmonat
            </div>
            <select
              value={sourceYear}
              onChange={(e) => {
                const year = Number(e.target.value);
                setSourceYear(year);
                const month = availableMonths.find(m => m.year === year)?.month ?? 0;
                setSourceMonth(month);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={sourceMonth}
              onChange={(e) => setSourceMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {sourceMonthOptions.length > 0 ? (
                sourceMonthOptions.map(m => (
                  <option key={m.month} value={m.month}>{m.label}</option>
                ))
              ) : (
                <option value={sourceMonth}>Keine Daten</option>
              )}
            </select>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-white/5 dark:bg-gray-900/30 border border-gray-200/10">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <ArrowRight className="w-4 h-4" />
              Zielmonat
            </div>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{formatMonth(i, targetYear)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 dark:bg-gray-900/30 border border-gray-200/10 overflow-hidden mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-100/5 dark:bg-gray-900/50 border-b border-gray-200/10">
            <span className="text-sm font-medium">
              {sourceTransactions.length} Transaktion(en) in {formatMonth(sourceMonth, sourceYear)}
            </span>
            {sourceTransactions.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-500 transition-colors"
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            )}
          </div>

          {sourceTransactions.length > 0 ? (
            <div className="max-h-[30vh] overflow-y-auto">
              <table className="w-full">
                <tbody className="divide-y divide-gray-300/30 dark:divide-gray-700/30">
                  {sourceTransactions
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(t => (
                      <tr
                        key={t.id}
                        onClick={() => toggleTransaction(t.id)}
                        className="hover:bg-gray-200/20 dark:hover:bg-gray-700/20 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={() => toggleTransaction(t.id)}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="px-2 py-2 text-sm">{formatDate(new Date(t.date))}</td>
                        <td className="px-2 py-2 text-sm">{t.description}</td>
                        <td className="px-2 py-2 text-sm text-right">
                          <span className={t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              Keine Transaktionen im Quellmonat
            </div>
          )}
        </div>

        {feedback && (
          <div className="mb-4 p-3 rounded-lg bg-purple-600/20 border border-purple-600/30 text-sm">
            {feedback}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleCopy}
            disabled={sourceTransactions.length === 0 || selectedIds.length === 0}
            className="flex-1 py-2 px-4 bg-purple-600/80 hover:bg-purple-700/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Übertragen
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200/20 dark:bg-gray-700/50 rounded-lg hover:opacity-90 transition-opacity"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
