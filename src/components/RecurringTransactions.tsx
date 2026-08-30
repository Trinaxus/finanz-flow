import React, { useState } from 'react';
import { Repeat, Edit2, Trash2, Plus, Calendar } from 'lucide-react';
import { useStore } from '../store';
import { formatDate, formatMonth } from '../utils/dateUtils';
import { TransactionForm } from './TransactionForm';
import type { Transaction } from '../types';

export const RecurringTransactions = () => {
  const { 
    recurringTransactions, 
    deleteRecurringTransaction,
    applyRecurringTransactions,
    editRecurringTransaction,
    updateRecurringTransactions
  } = useStore();
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const handleApply = () => {
    applyRecurringTransactions(selectedMonth, selectedYear);
    setShowApplyModal(false);
  };

  const formatAmount = (transaction: Transaction) => {
    const amount = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
    return `€${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-display">Wiederkehrende Transaktionen</h2>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          <span>Für Monat anwenden</span>
        </button>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-display mb-4">Monat auswählen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Jahr</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Monat</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  {months.map(month => (
                    <option key={month} value={month}>
                      {formatMonth(month, selectedYear)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Anwenden
                </button>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-display">Beschreibung</th>
                <th className="px-6 py-3 text-left text-sm font-display">Kategorie</th>
                <th className="px-6 py-3 text-left text-sm font-display">Betrag</th>
                <th className="px-6 py-3 text-left text-sm font-display">Intervall</th>
                <th className="px-6 py-3 text-left text-sm font-display">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recurringTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">{transaction.description}</td>
                  <td className="px-6 py-4">{transaction.category}</td>
                  <td className="px-6 py-4">
                    <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatAmount(transaction)}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize">{transaction.recurringInterval}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="p-1 hover:text-purple-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRecurringTransaction(transaction.id)}
                        className="p-1 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {recurringTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Repeat className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-display">Keine wiederkehrenden Transaktionen</p>
          </div>
        )}
      </div>
    </div>
  );
};