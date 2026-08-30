import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Store, Transaction, Budget, MonthlyAnalysis } from './types';
import { isValidDate } from './utils/dateUtils';

interface StoreState {
  theme: string;
  transactions: Transaction[];
  budgets: Budget[];
  recurringTransactions: Transaction[];
  baseAccountBalance: number;
  neuralBackground: boolean;
  selectedYear: number;
  selectedMonth: number;
}

interface StoreActions {
  toggleTheme: () => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  updateBaseAccountBalance: (balance: number) => void;
  getCurrentBalance: () => number;
  addTransaction: (transaction: Partial<Transaction>) => void;
  editTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactionsByMonth: (year: number, month: number) => void;
  updateBudget: (budget: Budget) => void;
  addRecurringTransaction: (transaction: Partial<Transaction>) => void;
  editRecurringTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteRecurringTransaction: (id: string) => void;
  applyRecurringTransactions: (month: number, year: number) => void;
  toggleTransactionPending: (id: string) => void;
  getMonthlyAnalysis: (months: number) => MonthlyAnalysis[];
  getCurrentMonthAnalysis: () => MonthlyAnalysis;
  getYearlyAnalysis: (year: number) => MonthlyAnalysis[];
  calculateMonthBalance: (month: number, year: number) => {
    income: number;
    expenses: number;
    balance: number;
    pending: number;
    available: number;
  };
  getAvailableBalance: () => number;
  updateRecurringTransactions: (recurringId: string, updates: Partial<Transaction>) => void;
  deleteTransactions: (transactionIds: string[]) => void;
  toggleNeuralBackground: () => void;
  getTransactionsByMonth: (month: number, year: number) => Transaction[];
  copyTransactionsToMonth: (
    sourceMonth: number,
    sourceYear: number,
    targetMonth: number,
    targetYear: number,
    transactionIds?: string[]
  ) => number;
  carryOverToNextMonth: (month: number, year: number) => number;
  addMonthFromPrevious: (month: number, year: number) => number;
  fillMissingMonths: (year: number) => number;
  addExistingToMonth: (transactionIds: string[], month: number, year: number) => number;
}

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      transactions: [],
      budgets: [],
      recurringTransactions: [],
      baseAccountBalance: 0,
      neuralBackground: true,
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),

      setSelectedYear: (year) => set(() => ({ selectedYear: year })),
      setSelectedMonth: (month) => set(() => ({ selectedMonth: month })),
      
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      
      updateBaseAccountBalance: (balance) => set(() => ({
        baseAccountBalance: balance
      })),

      getCurrentBalance: () => {
        const { baseAccountBalance, transactions } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isValidDate(date) &&
                 date.getMonth() === currentMonth && 
                 date.getFullYear() === currentYear &&
                 !t.isPending;
        });

        return monthTransactions.reduce((balance, t) => {
          return t.type === 'income' 
            ? balance + t.amount
            : balance - t.amount;
        }, baseAccountBalance);
      },

      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, { 
          ...transaction, 
          id: transaction.id || crypto.randomUUID(),
          isPending: transaction.isPending ?? true
        }]
      })),
      
      editTransaction: (id, transaction) => set((state) => ({
        transactions: state.transactions.map(t => 
          t.id === id ? { ...t, ...transaction } : t
        )
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),

      deleteTransactionsByMonth: (month: number, year: number) => set((state) => ({
        transactions: state.transactions.filter(t => {
          const date = new Date(t.date);
          return !isValidDate(date) || 
                 date.getMonth() !== month || 
                 date.getFullYear() !== year;
        })
      })),
      
      updateBudget: (budget) => set((state) => ({
        budgets: [
          ...state.budgets.filter(b => b.category !== budget.category),
          budget
        ]
      })),

      addRecurringTransaction: (transaction) => set((state) => ({
        recurringTransactions: [...state.recurringTransactions, { 
          ...transaction, 
          id: transaction.id || crypto.randomUUID(),
          isRecurring: true 
        }]
      })),

      editRecurringTransaction: (id, transaction) => set((state) => ({
        recurringTransactions: state.recurringTransactions.map(t =>
          t.id === id ? { ...t, ...transaction } : t
        )
      })),

      deleteRecurringTransaction: (id) => set((state) => ({
        recurringTransactions: state.recurringTransactions.filter(t => t.id !== id)
      })),

      applyRecurringTransactions: (month: number, year: number) => {
        const { recurringTransactions, addTransaction } = get();
        
        recurringTransactions.forEach(transaction => {
          const newTransaction = {
            ...transaction,
            date: new Date(year, month, 1),
            isRecurring: false
          };
          const { id, ...transactionWithoutId } = newTransaction;
          addTransaction(transactionWithoutId);
        });
      },

      toggleTransactionPending: (id) => set((state) => ({
        transactions: state.transactions.map(t =>
          t.id === id ? { ...t, isPending: !t.isPending } : t
        )
      })),
      
      getMonthlyAnalysis: (months: number) => {
        const { transactions } = get();
        const analyses: MonthlyAnalysis[] = [];
        
        for (let i = 0; i < months; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return isValidDate(tDate) &&
                   tDate.getMonth() === month && 
                   tDate.getFullYear() === year;
          });
          
          const income = monthTransactions
            .filter(t => t.type === 'income' && !t.isPending)
            .reduce((sum, t) => sum + t.amount, 0);
            
          const expenses = monthTransactions
            .filter(t => t.type === 'expense' && !t.isPending)
            .reduce((sum, t) => sum + t.amount, 0);
            
          const categories = monthTransactions
            .filter(t => !t.isPending)
            .reduce((acc, t) => ({
              ...acc,
              [t.category]: (acc[t.category] || 0) + (t.type === 'expense' ? -t.amount : t.amount)
            }), {} as Record<string, number>);
          
          analyses.push({
            month,
            year,
            income,
            expenses,
            balance: income - expenses,
            categories
          });
        }
        
        return analyses;
      },
      
      getCurrentMonthAnalysis: () => {
        const { getMonthlyAnalysis } = get();
        return getMonthlyAnalysis(1)[0];
      },

      getYearlyAnalysis: (year: number) => {
        const { transactions } = get();
        const analyses: MonthlyAnalysis[] = [];
        
        for (let month = 0; month < 12; month++) {
          const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return isValidDate(tDate) &&
                   tDate.getMonth() === month && 
                   tDate.getFullYear() === year && 
                   !t.isPending;
          });
          
          const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
          const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
          const categories = monthTransactions.reduce((acc, t) => ({
            ...acc,
            [t.category]: (acc[t.category] || 0) + (t.type === 'expense' ? -t.amount : t.amount)
          }), {} as Record<string, number>);
          
          analyses.push({
            month,
            year,
            income,
            expenses,
            balance: income - expenses,
            categories
          });
        }
        
        return analyses;
      },

      calculateMonthBalance: (month: number, year: number) => {
        const { transactions, baseAccountBalance } = get();
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isValidDate(date) &&
                 date.getMonth() === month && 
                 date.getFullYear() === year;
        });

        const totals = monthTransactions.reduce((acc, t) => {
          const amount = t.amount;
          
          if (t.isPending) {
            if (t.type === 'income') {
              acc.pending += amount;
            } else {
              acc.pending -= amount;
            }
          } else {
            if (t.type === 'income') {
              acc.income += amount;
            } else {
              acc.expenses += amount;
            }
          }
          
          return acc;
        }, {
          income: 0,
          expenses: 0,
          pending: 0
        });

        const balance = totals.income - totals.expenses;
        const available = baseAccountBalance + balance;

        return {
          income: totals.income,
          expenses: totals.expenses,
          balance,
          pending: totals.pending,
          available
        };
      },

      getAvailableBalance: () => {
        const { calculateMonthBalance } = get();
        const now = new Date();
        return calculateMonthBalance(now.getMonth(), now.getFullYear()).available;
      },

      updateRecurringTransactions: (recurringId, updates) => set(state => ({
        transactions: state.transactions.map(t =>
          t.recurringId === recurringId && new Date(t.date) >= new Date()
            ? { ...t, ...updates }
            : t
        )
      })),

      deleteTransactions: (transactionIds: string[]) => {
        set((state) => ({
          transactions: state.transactions.filter(t => !transactionIds.includes(t.id))
        }));
      },

      toggleNeuralBackground: () => {
        const newState = !get().neuralBackground;
        if (newState) {
          document.body.classList.add('neural-bg');
        } else {
          document.body.classList.remove('neural-bg');
        }
        set({ neuralBackground: newState });
      },

      getTransactionsByMonth: (month: number, year: number) => {
        const { transactions } = get();
        return transactions.filter(t => {
          const date = new Date(t.date);
          return isValidDate(date) &&
                 date.getMonth() === month &&
                 date.getFullYear() === year;
        });
      },

      copyTransactionsToMonth: (sourceMonth, sourceYear, targetMonth, targetYear, transactionIds) => {
        const { transactions, addTransaction } = get();
        const sourceTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isValidDate(date) &&
                 date.getMonth() === sourceMonth &&
                 date.getFullYear() === sourceYear &&
                 (transactionIds ? transactionIds.includes(t.id) : true);
        });

        let copied = 0;
        sourceTransactions.forEach(t => {
          const sourceDate = new Date(t.date);
          const targetDate = new Date(targetYear, targetMonth, sourceDate.getDate());
          // Ensure target day exists (e.g. Feb 30 -> last valid day)
          if (targetDate.getMonth() !== targetMonth) {
            targetDate.setDate(0);
          }
          addTransaction({
            amount: t.amount,
            category: t.category,
            description: t.description,
            type: t.type,
            paymentMethod: t.paymentMethod,
            date: targetDate,
            isPending: true,
            isRecurring: false,
            recurringInterval: undefined,
            recurringId: undefined
          });
          copied++;
        });

        return copied;
      },

      carryOverToNextMonth: (month, year) => {
        const targetDate = new Date(year, month + 1, 1);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        return get().copyTransactionsToMonth(month, year, targetMonth, targetYear);
      },

      addMonthFromPrevious: (month, year) => {
        const sourceDate = new Date(year, month - 1, 1);
        const sourceMonth = sourceDate.getMonth();
        const sourceYear = sourceDate.getFullYear();
        return get().copyTransactionsToMonth(sourceMonth, sourceYear, month, year);
      },

      fillMissingMonths: (year: number) => {
        const { transactions } = get();
        const byKey = new Map<string, Transaction[]>();

        transactions.forEach(t => {
          const date = new Date(t.date);
          if (!isValidDate(date)) return;
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          const current = byKey.get(key) || [];
          current.push(t);
          byKey.set(key, current);
        });

        const findSource = (targetMonth: number): Transaction[] | null => {
          for (let m = targetMonth - 1; m >= 0; m--) {
            const key = `${year}-${m}`;
            const s = byKey.get(key);
            if (s && s.length > 0) return s;
          }
          for (let m = targetMonth + 1; m < 12; m++) {
            const key = `${year}-${m}`;
            const s = byKey.get(key);
            if (s && s.length > 0) return s;
          }
          const before = transactions
            .filter(t => {
              const d = new Date(t.date);
              return isValidDate(d) && d < new Date(year, targetMonth, 1);
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (before.length === 0) return null;
          const d = new Date(before[0].date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          return byKey.get(key) || null;
        };

        const newTransactions: Transaction[] = [];
        let created = 0;

        for (let targetMonth = 0; targetMonth < 12; targetMonth++) {
          const targetKey = `${year}-${targetMonth}`;
          if (byKey.has(targetKey) && (byKey.get(targetKey)?.length || 0) > 0) continue;

          const source = findSource(targetMonth);
          if (!source) continue;

          source.forEach(t => {
            const sourceDate = new Date(t.date);
            const targetDate = new Date(year, targetMonth, sourceDate.getDate());
            if (targetDate.getMonth() !== targetMonth) {
              targetDate.setDate(0);
            }
            newTransactions.push({
              ...t,
              id: crypto.randomUUID(),
              date: targetDate,
              isPending: true,
              isRecurring: false,
              recurringInterval: undefined,
              recurringId: undefined
            });
            created++;
          });
        }

        if (newTransactions.length > 0) {
          set(state => ({ transactions: [...state.transactions, ...newTransactions] }));
        }

        return created;
      },

      addExistingToMonth: (transactionIds, month, year) => {
        const { transactions } = get();
        const selected = transactions.filter(t => transactionIds.includes(t.id));

        const targetDate = new Date(year, month, 1);
        const newTransactions = selected.map(t => ({
          ...t,
          id: crypto.randomUUID(),
          date: targetDate,
          isPending: true,
          isRecurring: false,
          recurringInterval: undefined,
          recurringId: undefined
        }));

        if (newTransactions.length > 0) {
          set(state => ({ transactions: [...state.transactions, ...newTransactions] }));
        }

        return newTransactions.length;
      },
    }),
    {
      name: 'finanz-flow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        recurringTransactions: state.recurringTransactions,
        theme: state.theme,
        baseAccountBalance: state.baseAccountBalance,
        neuralBackground: state.neuralBackground
      }),
      version: 1
    }
  )
);