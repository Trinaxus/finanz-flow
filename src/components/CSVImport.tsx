import React, { useRef, useState, useMemo } from 'react';
import { Upload, Download, AlertCircle, Calendar, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../store';
import { exportTransactionsToCSV } from '../utils/csvUtils';
import { parseGermanDate, formatMonth } from '../utils/dateUtils';
import type { Transaction } from '../types';

export const CSVImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Partial<Transaction>[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportMonths, setSelectedImportMonths] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const { 
    addTransaction, 
    addRecurringTransaction,
    transactions,
    recurringTransactions,
    deleteTransactionsByMonth,
    deleteTransactions,
    deleteRecurringTransaction
  } = useStore();

  // Get unique months from transactions
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      months.add(`${date.getFullYear()}-${date.getMonth()}`);
    });
    return Array.from(months)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return { key, label: formatMonth(month, year), year, month };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [transactions]);

  const years = useMemo(() => {
    const yearMap = new Map<number, typeof availableMonths>();
    availableMonths.forEach(m => {
      const current = yearMap.get(m.year) || [];
      current.push(m);
      yearMap.set(m.year, current);
    });
    return Array.from(yearMap.entries())
      .map(([year, months]) => ({ year, months }))
      .sort((a, b) => b.year - a.year);
  }, [availableMonths]);

  const allSelected = useMemo(
    () => availableMonths.length > 0 && selectedMonths.length === availableMonths.length,
    [availableMonths, selectedMonths]
  );

  const isYearSelected = (year: number) => {
    const yearMonths = years.find(y => y.year === year)?.months.map(m => m.key) || [];
    return yearMonths.length > 0 && yearMonths.every(key => selectedMonths.includes(key));
  };

  const isYearExpanded = (year: number) => expandedYears.includes(year);

  const toggleYear = (year: number) => {
    const yearMonths = years.find(y => y.year === year)?.months.map(m => m.key) || [];
    const allYearSelected = yearMonths.every(key => selectedMonths.includes(key));
    if (allYearSelected) {
      setSelectedMonths(prev => prev.filter(k => !yearMonths.includes(k)));
    } else {
      setSelectedMonths(prev => Array.from(new Set([...prev, ...yearMonths])));
    }
  };

  const toggleMonth = (key: string) => {
    setSelectedMonths(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(availableMonths.map(m => m.key));
    }
  };

  const toggleYearExpanded = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const parseCSV = async (file: File) => {
    try {
      setError(null);
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Expected column order (Wiederkehrend-Intervall optional)
      const expectedColumns = [
        'Status',
        'Datum',
        'Beschreibung',
        'Kategorie',
        'Betrag',
        'Typ',
        'Zahlungsart',
        'Wiederkehrend'
      ];

      // Validate column order
      const hasIntervalColumn = headers.length === 9 && headers[8] === 'Wiederkehrend-Intervall';
      const isValidOrder = headers.length >= expectedColumns.length && expectedColumns.every((col, idx) => headers[idx] === col);
      if (!isValidOrder) {
        throw new Error(`Ungültige Spaltenreihenfolge. Erwartet: ${expectedColumns.join(';')}[;Wiederkehrend-Intervall]`);
      }

      const intervalMap: Record<string, 'monthly' | 'weekly' | 'yearly'> = {
        'monatlich': 'monthly',
        'wöchentlich': 'weekly',
        'jährlich': 'yearly'
      };

      const transactions = rows.slice(1).map(row => {
        const values = row.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
        const data: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });

        const date = parseGermanDate(data['Datum']);
        if (!date) {
          throw new Error(`Ungültiges Datum in Zeile: ${row}`);
        }

        // Parse status - set isPending based on the status value
        const isPending = data['Status']?.toLowerCase()?.includes('ausstehend') ?? true;
        const isRecurring = data['Wiederkehrend']?.toLowerCase() === 'ja';

        const transaction: Partial<Transaction> = {
          id: crypto.randomUUID(),
          date,
          amount: Math.abs(Number(data['Betrag'].replace(',', '.')) || 0),
          description: data['Beschreibung'] || '',
          category: data['Kategorie'] || 'Sonstiges',
          type: data['Typ']?.toLowerCase().includes('einnahme') ? 'income' : 'expense',
          paymentMethod: data['Zahlungsart'] || 'Überweisung',
          isPending,
          isRecurring,
          recurringInterval: isRecurring && hasIntervalColumn ? intervalMap[data['Wiederkehrend-Intervall']] : undefined
        };

        if (isNaN(transaction.amount || 0)) {
          throw new Error(`Ungültiger Betrag in Zeile: ${row}`);
        }

        return transaction as Transaction;
      });

      const monthKeys = new Set<string>();
      transactions.forEach(t => {
        const date = new Date(t.date);
        monthKeys.add(`${date.getFullYear()}-${date.getMonth()}`);
      });

      setPendingTransactions(transactions);
      setSelectedImportMonths(Array.from(monthKeys));
      setShowImportModal(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Import der CSV-Datei');
    }
  };

  const handleExportCSV = () => {
    const monthsToExport = selectedMonths.length > 0 ? selectedMonths : undefined;
    exportTransactionsToCSV(transactions, recurringTransactions, monthsToExport);
    setShowExportModal(false);
  };

  const handleDeleteMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    if (window.confirm(`Möchten Sie wirklich alle Transaktionen für ${formatMonth(month, year)} löschen?`)) {
      deleteTransactionsByMonth(month, year);
    }
  };

  const handleDeleteYear = (year: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === year);
    if (yearTransactions.length === 0) return;
    if (window.confirm(`Möchten Sie wirklich alle ${yearTransactions.length} Transaktionen für das Jahr ${year} löschen?`)) {
      deleteTransactions(yearTransactions.map(t => t.id));
    }
  };

  const importYears = useMemo(() => {
    const map = new Map<number, { key: string; label: string; month: number }[]>();
    pendingTransactions.forEach(t => {
      const date = new Date(t.date!);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;
      const list = map.get(year) || [];
      if (!list.some(m => m.key === key)) {
        list.push({ key, label: formatMonth(month, year), month });
        map.set(year, list);
      }
    });
    return Array.from(map.entries())
      .map(([year, months]) => ({ year, months: months.sort((a, b) => a.month - b.month) }))
      .sort((a, b) => b.year - a.year);
  }, [pendingTransactions]);

  const importMonths = useMemo(
    () => importYears.flatMap(y => y.months),
    [importYears]
  );

  const allImportSelected = useMemo(
    () => importMonths.length > 0 && selectedImportMonths.length === importMonths.length,
    [importMonths, selectedImportMonths]
  );

  const isImportYearSelected = (year: number) => {
    const yearMonths = importYears.find(y => y.year === year)?.months.map(m => m.key) || [];
    return yearMonths.length > 0 && yearMonths.every(k => selectedImportMonths.includes(k));
  };

  const toggleImportYear = (year: number) => {
    const yearMonths = importYears.find(y => y.year === year)?.months.map(m => m.key) || [];
    const allSelected = yearMonths.every(k => selectedImportMonths.includes(k));
    if (allSelected) {
      setSelectedImportMonths(prev => prev.filter(k => !yearMonths.includes(k)));
    } else {
      setSelectedImportMonths(prev => Array.from(new Set([...prev, ...yearMonths])));
    }
  };

  const toggleImportMonth = (key: string) => {
    setSelectedImportMonths(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAllImport = () => {
    if (allImportSelected) {
      setSelectedImportMonths([]);
    } else {
      setSelectedImportMonths(importMonths.map(m => m.key));
    }
  };

  const handleImportSelected = () => {
    if (replaceExisting) {
      deleteTransactions(transactions.map(t => t.id));
      recurringTransactions.forEach(t => deleteRecurringTransaction(t.id));
    }
    const toImport = pendingTransactions.filter(t => {
      const date = new Date(t.date!);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return selectedImportMonths.includes(key);
    });
    toImport.forEach(t => {
      if (t.isRecurring && t.recurringInterval) {
        addRecurringTransaction(t);
      } else {
        addTransaction(t);
      }
    });
    setPendingTransactions([]);
    setSelectedImportMonths([]);
    setShowImportModal(false);
  };

  const handleCancelImport = () => {
    setPendingTransactions([]);
    setSelectedImportMonths([]);
    setShowImportModal(false);
  };

  return (
    <div className="p-4 rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10">
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className={`flex items-center justify-between cursor-pointer ${isExpanded ? 'mb-4' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Upload className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-display">CSV Import/Export</h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
            setShowExportModal(true);
          }}
          className="px-4 py-2 bg-gray-100/5 dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-600/50 transition-colors flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          <span>CSV Export</span>
        </button>
      </div>

      {isExpanded && (
        <div>
      {error && (
        <div className="mb-4 p-4 bg-rose-100/10 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            parseCSV(file);
          }
        }}
        accept=".csv"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full p-8 border-2 border-dashed border-gray-300/50 dark:border-gray-700/50 rounded-lg hover:border-purple-500/50 transition-colors"
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-center font-display">
          CSV-Datei hier ablegen oder klicken zum Auswählen
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Erforderliche Spaltenreihenfolge: Status;Datum;Beschreibung;
          Kategorie;Betrag;Typ;
          Zahlungsart;Wiederkehrend
        </p>
      </button>

      {/* Available Months */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display">Verfügbare Monate</h3>
          <span className="text-sm text-gray-500">{availableMonths.length} Monat(e)</span>
        </div>

        <div className="space-y-2">
          {years.map(({ year, months }) => (
            <div
              key={year}
              className="rounded-xl border border-gray-200/10 dark:border-gray-700/30 overflow-hidden"
            >
              <div
                onClick={() => toggleYearExpanded(year)}
                className="w-full flex items-center justify-between p-3 bg-white/5 dark:bg-gray-900/30 hover:bg-gray-100/5 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <span className="font-display">{year}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{months.length} Monat(e)</span>
                  {isYearExpanded(year) ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                  <button
                    onClick={(e) => handleDeleteYear(year, e)}
                    className="p-1 text-gray-500 hover:text-rose-500 transition-colors"
                    title="Jahr löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isYearExpanded(year) && (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {months.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-gray-800/30"
                    >
                      <span className="text-sm">{label}</span>
                      <button
                        onClick={() => handleDeleteMonth(key)}
                        className="p-1 text-gray-500 hover:text-rose-500 transition-colors"
                        title="Monat löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {availableMonths.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Noch keine Monate verfügbar
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 dark:bg-gray-800/50 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-display mb-4">Monate für Import auswählen</h3>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-300/20 dark:border-gray-700/30">
              <button
                onClick={toggleAllImport}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-500 transition-colors"
              >
                {allImportSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{allImportSelected ? 'Alle abwählen' : 'Alle auswählen'}</span>
              </button>
              <span className="text-sm text-gray-500">{selectedImportMonths.length} ausgewählt</span>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {importYears.map(({ year, months }) => (
                <div key={year} className="rounded-lg border border-gray-300/20 dark:border-gray-700/30 overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-100/5 dark:bg-gray-900/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isImportYearSelected(year)}
                        onChange={() => toggleImportYear(year)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-display">{year}</span>
                    </label>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {months.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 pl-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedImportMonths.includes(key)}
                          onChange={() => toggleImportMonth(key)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {importYears.length === 0 && (
                <p className="text-center text-gray-500 py-8">Keine Buchungen zur Auswahl</p>
              )}
            </div>

            <label className="flex items-center gap-2 mt-4 text-sm text-rose-600 dark:text-rose-400 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span>Vorhandene Daten vor dem Import löschen</span>
            </label>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleImportSelected}
                className="flex-1 py-2 px-4 bg-purple-600/50 text-white rounded-lg hover:bg-purple-700/50 transition-colors"
              >
                Importieren
              </button>
              <button
                onClick={handleCancelImport}
                className="flex-1 py-2 px-4 bg-gray-200/20 dark:bg-gray-700/50 rounded-lg hover:opacity-90 transition-opacity"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 dark:bg-gray-800/50 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-display mb-4">Monate für Export auswählen</h3>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-300/20 dark:border-gray-700/30">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-500 transition-colors"
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{allSelected ? 'Alle abwählen' : 'Alle auswählen'}</span>
              </button>
              <span className="text-sm text-gray-500">{selectedMonths.length} ausgewählt</span>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {years.map(({ year, months }) => (
                <div key={year} className="rounded-lg border border-gray-300/20 dark:border-gray-700/30 overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-100/5 dark:bg-gray-900/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isYearSelected(year)}
                        onChange={() => toggleYear(year)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-display">{year}</span>
                    </label>
                    <button
                      onClick={() => toggleYearExpanded(year)}
                      className="p-1 hover:text-purple-600 transition-colors"
                      aria-label="Jahr auf- / zuklappen"
                    >
                      {isYearExpanded(year) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {isYearExpanded(year) && (
                    <div className="p-3 space-y-2">
                      {months.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 pl-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(key)}
                            onChange={() => toggleMonth(key)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {availableMonths.length === 0 && (
                <p className="text-center text-gray-500 py-8">Keine Monate verfügbar</p>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleExportCSV}
                className="flex-1 py-2 px-4 bg-purple-600/50 text-white rounded-lg hover:bg-purple-700/50 transition-colors"
              >
                Exportieren
              </button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedMonths([]);
                }}
                className="flex-1 py-2 px-4 bg-gray-200/20 dark:bg-gray-700/50 rounded-lg hover:opacity-90 transition-opacity"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p className="font-medium mb-2">CSV Format:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Status: "Bestätigt" oder "Ausstehend"</li>
          <li>Datum: DD. MM YYYY (z.B. 15. Januar 2024)</li>
          <li>Beschreibung: Text</li>
          <li>Kategorie: Eine der vordefinierten Kategorien</li>
          <li>Betrag: Dezimalzahl mit Komma (z.B. 123,45)</li>
          <li>Typ: "Einnahme" oder "Ausgabe"</li>
          <li>Zahlungsart: Eine der vordefinierten Zahlungsarten</li>
          <li>Wiederkehrend: "Ja" oder "Nein"</li>
        </ul>
      </div>
        </div>
      )}
    </div>
  );
};