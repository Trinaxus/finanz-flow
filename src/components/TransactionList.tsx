import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Filter, Repeat, Zap } from 'lucide-react';
import { useStore } from '../store';
import { formatDate } from '../utils/dateUtils';
import { TransactionForm } from './TransactionForm';
import type { Transaction } from '../types';

export const TransactionList = () => {
  const { transactions, deleteTransaction } = useStore();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const filteredTransactions = useMemo(() => 
    transactions
      .filter(t => filter === 'all' || t.type === filter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, filter]
  );

  const formatAmount = (transaction: Transaction) => {
    const amount = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
    return `€${amount.toFixed(2)}`;
  };

  const toggleTable = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display">Transaktionen</h2>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'income' | 'expense')}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="all">Alle</option>
            <option value="income">Einnahmen</option>
            <option value="expense">Ausgaben</option>
          </select>
        </div>
      </div>

      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-display mb-4">Transaktion bearbeiten</h3>
            <TransactionForm
              initialData={editingTransaction}
              onSubmit={() => setEditingTransaction(null)}
              onCancel={() => setEditingTransaction(null)}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-transparent backdrop-blur-sm border border-gray-200/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200/10 dark:border-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-display">Datum</th>
                <th className="px-6 py-3 text-left text-sm font-display">Beschreibung</th>
                <th className="px-6 py-3 text-left text-sm font-display">Kategorie</th>
                <th className="px-6 py-3 text-left text-sm font-display">Betrag</th>
                <th className="px-6 py-3 text-left text-sm font-display">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/10 dark:divide-gray-700/50">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-100/5 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">{formatDate(new Date(transaction.date))}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {transaction.isRecurring ? (
                        <Repeat className="w-4 h-4 text-purple-500" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{transaction.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{transaction.category}</td>
                  <td className="px-6 py-4">
                    <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatAmount(transaction)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="p-1 hover:text-purple-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="p-1 hover:text-rose-600 transition-colors"
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
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="font-display">Keine Transaktionen gefunden</p>
          </div>
        )}
      </div>

      <button
        onClick={toggleTable}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        {isOpen ? 'Tabelle Zuklappen' : 'Tabelle Aufklappen'}
      </button>

      <div
        className={`overflow-hidden transition-max-height duration-500 ease-in-out rounded-2xl bg-transparent backdrop-blur-sm border border-gray-200/10 ${
          isOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <table className="w-full">
          <thead className="border-b border-gray-200/10 dark:border-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-display">Datum</th>
              <th className="px-6 py-3 text-left text-sm font-display">Beschreibung</th>
              <th className="px-6 py-3 text-left text-sm font-display">Kategorie</th>
              <th className="px-6 py-3 text-left text-sm font-display">Betrag</th>
              <th className="px-6 py-3 text-left text-sm font-display">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/10 dark:divide-gray-700/50">
            {filteredTransactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-gray-100/5 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4">{formatDate(new Date(transaction.date))}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {transaction.isRecurring ? (
                      <Repeat className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{transaction.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{transaction.category}</td>
                <td className="px-6 py-4">
                  <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatAmount(transaction)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="p-1 hover:text-purple-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="p-1 hover:text-rose-600 transition-colors"
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
    </div>
  );
};