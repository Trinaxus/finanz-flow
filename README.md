# Finanzübersicht

Dieses Projekt ist eine umfassende Finanzübersichtsanwendung, die es Benutzern ermöglicht, ihre finanziellen Transaktionen zu verfolgen, zu analysieren und zu visualisieren. Die Anwendung bietet verschiedene Komponenten, um Einblicke in Einnahmen, Ausgaben, Ersparnisse und mehr zu erhalten.

## Hauptfunktionen

- **Dashboard**: Bietet eine Übersicht über den aktuellen Kontostand, Gesamteinnahmen und Gesamtausgaben.
  - Referenz: `src/components/Dashboard.tsx` (startLine: 6, endLine: 46)

- **Kreditkartenübersicht**: Verfolgt die Ausgaben, die mit der Zahlungsart "Kreditkarte" getätigt wurden, und zeigt diese in einem Diagramm an.
  - Referenz: `src/components/CreditCardOverview.tsx` (startLine: 6, endLine: 116)

- **Sparübersicht**: Analysiert und visualisiert die Ersparnisse über die Zeit.
  - Referenz: `src/components/SavingsOverview.tsx` (startLine: 6, endLine: 126)

- **Monatsvergleich**: Vergleicht Einnahmen, Ausgaben und Bilanz der letzten sechs Monate in einem Balkendiagramm.
  - Referenz: `src/components/MonthlyComparison.tsx` (startLine: 7, endLine: 90)

- **Jahresvergleich**: Bietet eine jährliche Analyse der Einnahmen, Ausgaben und Bilanz.
  - Referenz: `src/components/YearlyComparison.tsx` (startLine: 7, endLine: 102)

- **Kategorienanalyse**: Zeigt die Ausgaben nach Kategorien für den aktuellen Monat in einem Kreisdiagramm an.
  - Referenz: `src/components/CategoryAnalysis.tsx` (startLine: 8, endLine: 123)

- **Transaktionsliste**: Listet alle Transaktionen auf und bietet Funktionen zum Hinzufügen, Bearbeiten und Löschen von Transaktionen.
  - Referenz: `src/components/TransactionList.tsx` (startLine: 8, endLine: 144)

## Technologien

- **React**: Für die Benutzeroberfläche.
- **Recharts**: Für die Datenvisualisierung.
- **Lucide-React**: Für Icons.
- **Tailwind CSS**: Für das Styling.

## Installation

1. Klone das Repository:
   ```bash
   git clone [https://github.com/dein-benutzername/xx.git
   ```
2. Wechsle in das Projektverzeichnis:
   ```bash
   cd xx
   ```
3. Installiere die Abhängigkeiten:
   ```bash
   pnpm install
   ```
4. Starte die Anwendung:
   ```bash
   pnpm def
   ```

## Mitwirken

Beiträge sind willkommen! Bitte erstelle einen Fork des Repositories und reiche einen Pull-Request ein.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Weitere Informationen findest du in der `LICENSE`-Datei.
