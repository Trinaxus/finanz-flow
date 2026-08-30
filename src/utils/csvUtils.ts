import { Transaction } from '../types';
import { formatDate } from './dateUtils';

export const exportTransactionsToCSV = (
  transactions: Transaction[],
  recurringTransactions: Transaction[],
  monthKeys?: string[]
) => {
  // Filtere Transaktionen nach ausgewählten Monaten
  let filteredTransactions = transactions;
  if (monthKeys && monthKeys.length > 0) {
    filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return monthKeys.includes(key);
    });
  }

  const intervalLabels: Record<string, string> = {
    monthly: 'monatlich',
    weekly: 'wöchentlich',
    yearly: 'jährlich'
  };

  const headers = [
    'Status',
    'Datum',
    'Beschreibung',
    'Kategorie',
    'Betrag',
    'Typ',
    'Zahlungsart',
    'Wiederkehrend',
    'Wiederkehrend-Intervall'
  ];

  const toRow = (t: Transaction) => [
    t.isPending ? 'Ausstehend' : 'Bestätigt',
    formatDate(new Date(t.date)),
    t.description,
    t.category,
    t.amount.toFixed(2).replace('.', ','),
    t.type === 'income' ? 'Einnahme' : 'Ausgabe',
    t.paymentMethod,
    t.isRecurring ? 'Ja' : 'Nein',
    t.recurringInterval ? intervalLabels[t.recurringInterval] || '' : ''
  ];

  const rows = [
    ...filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(toRow),
    ...recurringTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(toRow)
  ];

  // CSV-Inhalt erstellen
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  // Download initiieren
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `finanzflow-export-${formatDate(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};