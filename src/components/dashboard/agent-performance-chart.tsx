'use client';

import { memo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface AgentData {
  name: string;
  orders: number;
  rating: number;
}

interface AgentPerformanceChartProps {
  data?: AgentData[];
}

const defaultData: AgentData[] = [
  { name: "Rajesh Kumar", orders: 45, rating: 4.8 },
  { name: "Amit Singh", orders: 38, rating: 4.6 },
  { name: "Priya Sharma", orders: 42, rating: 4.9 },
  { name: "Vijay Patel", orders: 35, rating: 4.5 },
  { name: "Suresh Reddy", orders: 40, rating: 4.7 },
];

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];

function AgentPerformanceChart({ data = defaultData }: AgentPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                  <div className="mb-2 font-semibold">{payload[0].payload.name}</div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Orders Completed
                      </span>
                      <span className="font-bold text-green-600">
                        {payload[0].value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Rating
                      </span>
                      <span className="font-bold text-yellow-600">
                        ⭐ {payload[0].payload.rating}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="orders" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(AgentPerformanceChart);
