import React from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface SparklineCardProps {
  title: string;
  value: string;
  data: number[];
  color: string;
  icon: React.ReactNode;
}

export const SparklineCard = ({ title, value, data, color, icon }: SparklineCardProps) => {
  const chartData = data.map((value, index) => ({ value }));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 