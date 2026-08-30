import React, { useMemo, useState } from 'react';
import { X, Copy, ArrowRight, CheckSquare, Square, Search } from 'lucide-react';
import { useStore } from '../store';
import { formatMonth, isValidDate } from '../utils/dateUtils';
import type { Transaction } from '../types';

const formatCurrency = (amount: number) => `€${Math.abs(amount).toFixed(2)}`;

interface QuickInsertDialogProps {
  targetMonth: number;
  targetYear: number;
  onClose: () => void;
}

export const QuickInsertDialog: React.FC<QuickInsertDialogProps> = ({
  targetMonth,
  targetYear,
  onClose
}) => {
  const { transactions, addExistingToMonth } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const templates = useMemo(() => {
    const seen = new Map<string, Transaction>();
    transactions.forEach(t => {
      if (!isValidDate(new Date(t.date))) return;
      const key = `${t.description}|${t.category}|${t.type}|${t.amount}|${t.paymentMethod}`;
      if (!seen.has(key)) {
        seen.set(key, t);
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.description.localeCompare(b.description));
  }, [transactions]);

  const filteredTemplates = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return templates;
    return templates.filter(t =>
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      t.type.toLowerCase().includes(term) ||
      t.paymentMethod.toLowerCase().includes(term)
    );
  }, [templates, searchTerm]);

  const allSelected = selectedIds.length === filteredTemplates.length && filteredTemplates.length > 0;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : filteredTemplates.map(t => t.id));
  };

  const toggleTransaction = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleInsert = () => {
    if (selectedIds.length === 0) {
      setFeedback('Bitte mindestens eine Transaktion auswählen');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const count = addExistingToMonth(selectedIds, targetMonth, targetYear);
    setFeedback(`${count} Transaktion(en) in ${formatMonth(targetMonth, targetYear)} eingefügt`);
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display flex items-center gap-2">
            <Copy className="w-5 h-5 text-purple-600" />
            Bestehende einfügen
          </h3>
          <button onClick={onClose} className="p-1 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-white/5 dark:bg-gray-900/30 border border-gray-200/10 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <ArrowRight className="w-4 h-4" />
            Ziel: {formatMonth(targetMonth, targetYear)}
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Vorlagen filtern..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 dark:bg-gray-900/30 border border-gray-200/10 text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white/5 dark:bg-gray-900/30 border border-gray-200/10 overflow-hidden mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-100/5 dark:bg-gray-900/50 border-b border-gray-200/10">
            <span className="text-sm font-medium">
              {filteredTemplates.length} Vorlage(n)
            </span>
            {filteredTemplates.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-500 transition-colors"
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            )}
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="max-h-[40vh] overflow-y-auto">
              <table className="w-full">
                <tbody className="divide-y divide-gray-300/30 dark:divide-gray-700/30">
                  {filteredTemplates.map(t => (
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
                      <td className="px-2 py-2 text-sm">{t.description}</td>
                      <td className="px-2 py-2 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200/80 dark:bg-gray-700/50">
                          {t.category}
                        </span>
                      </td>
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
              Keine bestehenden Transaktionen verfügbar
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
            onClick={handleInsert}
            disabled={templates.length === 0 || selectedIds.length === 0}
            className="flex-1 py-2 px-4 bg-purple-600/80 hover:bg-purple-700/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Einfügen
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
