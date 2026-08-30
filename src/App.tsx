import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { MonthlyTransactions } from './components/MonthlyTransactions';
import { MonthlyComparison } from './components/MonthlyComparison';
import { CategoryAnalysis } from './components/CategoryAnalysis';
import { CSVImport } from './components/CSVImport';
import { SavingsOverview } from './components/SavingsOverview';
import { CreditCardOverview } from './components/CreditCardOverview';
import { NeuralBackground } from './components/NeuralBackground';
import { useStore } from './store';

function App() {
  const theme = useStore(state => state.theme);
  const { transactions, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth } = useStore();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0F172A' : '#EFEBE3');
    }
  }, [theme]);

  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear + 1);
    years.add(selectedYear);
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, selectedYear, currentYear]);

  return (
    <div className={theme} style={{ position: 'relative', minHeight: '100vh' }}>
      <NeuralBackground />
      <div className="relative text-gray-900 dark:text-gray-100 transition-colors">
        <Header />

        <main className="container mx-auto px-4 pt-28 pb-8 space-y-8">
          <section id="dashboard">
            <Dashboard />
          </section>

          <div id="monthly-categories" className="rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10 overflow-hidden">
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 dark:hover:bg-black/5 transition-colors"
            >
              <h2 className="text-xl font-display">Monatsvergleich & Kategorien</h2>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300/50 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm text-sm"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300/50 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm text-sm"
                >
                  {monthNames.map((name, index) => (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>
                {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </div>
            </button>

            {expanded && (
              <div className="p-4 md:p-6 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section id="monthly">
                  <MonthlyComparison />
                </section>
                <section id="categories">
                  <CategoryAnalysis />
                </section>
              </div>
            )}
          </div>

          <section id="monthly-transactions">
            <MonthlyTransactions />
          </section>

          <section id="transactions">
            <TransactionManager />
          </section>

          <section id="savings">
            <SavingsOverview />
          </section>

          <section id="credit-card">
            <CreditCardOverview />
          </section>

          <section id="import">
            <CSVImport />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
