import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { CalendarDays } from 'lucide-react';
import { useStore } from '../store';
import { formatMonth } from '../utils/dateUtils';
import { getCategoryColor } from './CategoryAnalysis';

export const MonthlyComparison = () => {
  const { transactions, selectedYear, setSelectedMonth } = useStore();

  const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  const [barSize, setBarSize] = useState(24);
  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      const plot = Math.max(0, width - 128);
      const size = Math.max(10, Math.min(24, Math.floor(plot * 0.8 / 12)));
      setBarSize(size);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const barGap = -barSize;

  const { categories, chartData, yDomain, yTicks } = useMemo(() => {
    const categorySet = new Set<string>();
    const data = Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return !t.isPending &&
               date.getMonth() === month &&
               date.getFullYear() === selectedYear;
      });
      const categoryTotals = monthTransactions
        .reduce((acc, t) => {
          const amount = t.type === 'income' ? t.amount : -t.amount;
          acc[t.category] = (acc[t.category] || 0) + amount;
          categorySet.add(t.category);
          return acc;
        }, {} as Record<string, number>);

      const row: Record<string, number | string> = {
        name: `${monthNames[month]} ${selectedYear}`,
        month
      };

      for (const [category, value] of Object.entries(categoryTotals)) {
        row[category] = value;
        row[`pos_${category}`] = value > 0 ? value : 0;
        row[`neg_${category}`] = value < 0 ? value : 0;
      }

      return row;
    });

    const sortedCategories = Array.from(categorySet).sort();
    const dataMax = Math.max(...data.map(d => {
      return sortedCategories.reduce((sum, c) => sum + Math.max(Number(d[c]) || 0, 0), 0);
    }), 0);
    const dataMin = Math.min(...data.map(d => {
      return sortedCategories.reduce((sum, c) => sum + Math.min(Number(d[c]) || 0, 0), 0);
    }), 0);

    const yMin = Math.floor(dataMin * 1.05 / 100) * 100;
    const yMax = Math.ceil(dataMax * 1.05 / 100) * 100;
    const roundTo100 = (n: number) => Math.round(n / 100) * 100;
    const yDomain: [number, number] = [yMin, yMax];
    const yTicks = [yMin, roundTo100(yMin / 2), 0, roundTo100(yMax / 2), yMax];

    return { categories: sortedCategories, chartData: data, yDomain, yTicks };
  }, [transactions, selectedYear, monthNames]);

  // Angepasstes Tooltip-Design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sortedPayload = [...payload]
        .filter((e: any) => Math.abs(e.value || 0) > 0.001)
        .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
      const totalIncome = sortedPayload.reduce((sum: number, e: any) => sum + (e.value > 0 ? e.value : 0), 0);
      const totalExpenses = sortedPayload.reduce((sum: number, e: any) => sum + (e.value < 0 ? Math.abs(e.value) : 0), 0);
      return (
        <div className="backdrop-blur-md bg-gray-900/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg border border-gray-700/50">
          <p className="text-gray-200 font-medium mb-2">{label}</p>
          {sortedPayload.map((entry: any, index: number) => (
            <p
              key={`item-${index}`}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value > 0 ? '+' : ''}{entry.value.toFixed(2)}€
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
            <p className="text-sm font-medium text-emerald-400">
              Gesamteinnahmen: {totalIncome.toFixed(2)}€
            </p>
            <p className="text-sm font-medium text-rose-400">
              Gesamtausgaben: {totalExpenses.toFixed(2)}€
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    categories.forEach(c => {
      colors[c] = getCategoryColor(c);
    });
    return colors;
  }, [categories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-display">Monatsvergleich</h2>
      </div>
      
      <div className="h-[620px] rounded-2xl bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-200/10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={barGap} barCategoryGap="20%" margin={{ top: 10, right: 10, bottom: 90, left: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#4b5563" 
              strokeOpacity={0.5} 
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter, system-ui, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: '#6b7280' }}
              tickFormatter={(v) => `${v}€`}
              width={70}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} strokeDasharray="3 3" />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Legend
              content={({ payload }) => {
                const seen = new Set<string>();
                const unique = payload?.filter((entry: any) => {
                  if (seen.has(entry.value)) return false;
                  seen.add(entry.value);
                  return true;
                });
                return (
                  <div className="flex flex-wrap justify-center gap-2 pt-5">
                    {unique?.map((entry: any) => {
                      const color = entry.color as string;
                      return (
                        <span
                          key={entry.value}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: color + '33', color }}
                        >
                          {entry.value}
                        </span>
                      );
                    })}
                  </div>
                );
              }}
            />
            {categories.map((category) => (
              <React.Fragment key={category}>
                <Bar
                  dataKey={`pos_${category}`}
                  name={category}
                  stackId="pos"
                  barSize={barSize}
                  fill={categoryColors[category]}
                  onClick={(data: any) => {
                    if (data && typeof data.month === 'number') {
                      setSelectedMonth(data.month);
                    }
                  }}
                  cursor="pointer"
                />
                <Bar
                  dataKey={`neg_${category}`}
                  name={category}
                  stackId="neg"
                  barSize={barSize}
                  fill={categoryColors[category]}
                  onClick={(data: any) => {
                    if (data && typeof data.month === 'number') {
                      setSelectedMonth(data.month);
                    }
                  }}
                  cursor="pointer"
                />
              </React.Fragment>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
