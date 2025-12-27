'use client';

import { memo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface CategoryData {
  category: string;
  orders: number;
  revenue: number;
}

interface CategoryPerformanceChartProps {
  data?: CategoryData[];
}

const defaultData: CategoryData[] = [
  { category: "Metal", orders: 45, revenue: 28500 },
  { category: "Plastic", orders: 38, revenue: 15200 },
  { category: "Paper", orders: 52, revenue: 18200 },
  { category: "E-Waste", orders: 28, revenue: 22400 },
  { category: "Glass", orders: 22, revenue: 8800 },
  { category: "Cardboard", orders: 35, revenue: 12250 },
  { category: "Mixed", orders: 18, revenue: 7200 },
];

function CategoryPerformanceChart({ data = defaultData }: CategoryPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis 
          dataKey="category" 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                  <div className="mb-2 font-semibold">{payload[0].payload.category}</div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Orders
                      </span>
                      <span className="font-bold text-green-600">
                        {payload[0].value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Revenue
                      </span>
                      <span className="font-bold text-blue-600">
                        ₹{payload[1].value?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(CategoryPerformanceChart);
