import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, ArrowRight, Copy, Clock, CheckCircle } from 'lucide-react';
import { useStore } from '../store';
import { formatMonth, formatDate, isValidDate } from '../utils/dateUtils';
import { TransactionForm } from './TransactionForm';
import { MonthCopyDialog } from './MonthCopyDialog';
import type { Transaction } from '../types';

const formatCurrency = (amount: number) => `€${Math.abs(amount).toFixed(2)}`;

export const MonthlyTransactions = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    transactions,
    getTransactionsByMonth,
    copyTransactionsToMonth,
    carryOverToNextMonth,
    addMonthFromPrevious,
    toggleTransactionPending,
    deleteTransaction,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth
  } = useStore();

  const monthlyTransactions = useMemo(
    () => getTransactionsByMonth(selectedMonth, selectedYear),
    [transactions, getTransactionsByMonth, selectedMonth, selectedYear]
  );

  const totals = useMemo(() => {
    return monthlyTransactions.reduce(
      (acc, t) => {
        if (t.isPending) {
          acc.pending += t.type === 'income' ? t.amount : -t.amount;
        } else if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expenses += t.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0, pending: 0 }
    );
  }, [monthlyTransactions]);

  const balance = totals.income - totals.expenses;

  const navigateMonth = (direction: 'prev' | 'next') => {
    const date = new Date(selectedYear, selectedMonth + (direction === 'prev' ? -1 : 1), 1);
    setSelectedYear(date.getFullYear());
    setSelectedMonth(date.getMonth());
    setSelectedIds([]);
  };

  const goToCurrentMonth = () => {
    const date = new Date();
    setSelectedYear(date.getFullYear());
    setSelectedMonth(date.getMonth());
    setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === monthlyTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(monthlyTransactions.map(t => t.id));
    }
  };

  const handleAddFromPrevious = () => {
    if (monthlyTransactions.length > 0) {
      const confirm = window.confirm(
        'Dieser Monat enthält bereits Transaktionen. Sicher, dass der Vormonat als Vorlage hinzugefügt werden soll?'
      );
      if (!confirm) return;
    }
    const count = addMonthFromPrevious(selectedMonth, selectedYear);
    setFeedback(`${count} Transaktion(en) aus dem Vormonat übernommen`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCarryOverSelected = () => {
    if (selectedIds.length === 0) {
      setFeedback('Bitte mindestens eine Transaktion auswählen');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const nextDate = new Date(selectedYear, selectedMonth + 1, 1);
    const count = copyTransactionsToMonth(
      selectedMonth,
      selectedYear,
      nextDate.getMonth(),
      nextDate.getFullYear(),
      selectedIds
    );
    setFeedback(`${count} Transaktion(en) in ${formatMonth(nextDate.getMonth(), nextDate.getFullYear())} übernommen`);
    setSelectedIds([]);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCarryOverAll = () => {
    if (monthlyTransactions.length === 0) {
      setFeedback('Keine Transaktionen zum Übernehmen vorhanden');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const nextDate = new Date(selectedYear, selectedMonth + 1, 1);
    const count = carryOverToNextMonth(selectedMonth, selectedYear);
    setFeedback(`${count} Transaktion(en) in ${formatMonth(nextDate.getMonth(), nextDate.getFullYear())} übernommen`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm('Ausgewählte Transaktionen wirklich löschen?');
    if (confirm) {
      selectedIds.forEach(id => deleteTransaction(id));
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10 hover:bg-gray-100/5 dark:hover:bg-gray-700/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-display">Monatsplanung</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatMonth(selectedMonth, selectedYear)} · {monthlyTransactions.length} Transaktionen
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100/10 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              aria-label="Vorheriger Monat"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-display min-w-[160px] text-center">
              {formatMonth(selectedMonth, selectedYear)}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100/10 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              aria-label="Nächster Monat"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goToCurrentMonth}
              className="ml-2 px-3 py-1 text-sm rounded-lg bg-gray-100/10 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/50 transition-colors"
            >
              Aktuell
            </button>
          </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10">
          <p className="text-sm text-gray-500 dark:text-gray-400">Einnahmen</p>
          <p className="text-xl font-semibold text-emerald-600">{formatCurrency(totals.income)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ausgaben</p>
          <p className="text-xl font-semibold text-rose-600">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10">
          <p className="text-sm text-gray-500 dark:text-gray-400">Bilanz</p>
          <p className={`text-xl font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ausstehend</p>
          <p className="text-xl font-semibold text-amber-600">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600/80 hover:bg-purple-700/80 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neue Transaktion
        </button>

        <button
          onClick={handleAddFromPrevious}
          className="px-4 py-2 bg-gray-100/10 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Vorherigen Monat übernehmen
        </button>

        <button
          onClick={() => setShowCopyDialog(true)}
          className="px-4 py-2 bg-gray-100/10 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Monat auf Monat übertragen
        </button>

        <button
          onClick={handleCarryOverSelected}
          className="px-4 py-2 bg-gray-100/10 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Ausgewählte in nächsten Monat
        </button>

        <button
          onClick={handleCarryOverAll}
          className="px-4 py-2 bg-gray-100/10 dark:bg-gray-800/50 hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Alles in nächsten Monat
        </button>

        {selectedIds.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-rose-600/80 hover:bg-rose-700/80 text-white rounded-lg transition-colors"
          >
            Ausgewählte löschen
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-purple-600/20 border border-purple-600/30 text-sm">
          {feedback}
        </div>
      )}

      <div className="rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10 overflow-hidden">
        {monthlyTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead className="bg-gray-200/50 dark:bg-gray-900/50 border-b border-gray-300/50 dark:border-gray-700/50">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === monthlyTransactions.length && monthlyTransactions.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-display tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-display tracking-wider whitespace-nowrap">Datum</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-display tracking-wider whitespace-nowrap">Beschreibung</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-display tracking-wider whitespace-nowrap">Kategorie</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-right text-xs md:text-sm font-display tracking-wider whitespace-nowrap">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300/50 dark:divide-gray-700/50">
                {monthlyTransactions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-200/30 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(transaction.id)}
                          onChange={() => toggleSelection(transaction.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        <button
                          onClick={() => toggleTransactionPending(transaction.id)}
                          className="hover:text-purple-600 transition-colors"
                          title={transaction.isPending ? 'Als ausgeführt markieren' : 'Als ausstehend markieren'}
                        >
                          {transaction.isPending ? (
                            <Clock className="w-4 h-4 text-amber-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {isValidDate(new Date(transaction.date)) ? formatDate(new Date(transaction.date)) : 'Ungültig'}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-gray-900 dark:text-white max-w-[120px] md:max-w-none truncate">{transaction.description}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{transaction.category}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right text-sm font-display">
                        <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="font-display mb-2">Keine Transaktionen für {formatMonth(selectedMonth, selectedYear)}</p>
            <p className="text-sm opacity-75">
              Füge Transaktionen hinzu oder übernimm den vorherigen Monat.
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/10 rounded-2xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-display mb-4">
              Neue Transaktion für {formatMonth(selectedMonth, selectedYear)}
            </h3>
            <TransactionForm
              initialData={{ date: new Date(selectedYear, selectedMonth, 1), isPending: true }}
              onSubmit={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {showCopyDialog && (
        <MonthCopyDialog onClose={() => setShowCopyDialog(false)} />
      )}
    </div>
  )}
</div>
  );
};
