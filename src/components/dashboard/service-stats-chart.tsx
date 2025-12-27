'use client';

import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ServiceData {
  name: string;
  value: number;
  color: string;
}

interface ServiceStatsChartProps {
  data?: ServiceData[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e"];

const defaultData: ServiceData[] = [
  { name: "Demolition Service", value: 45, color: "#22c55e" },
  { name: "Paper Shredding", value: 38, color: "#3b82f6" },
  { name: "Junk Removal", value: 52, color: "#f59e0b" },
  { name: "E-Waste Disposal", value: 28, color: "#8b5cf6" },
  { name: "Bulk Pickup", value: 22, color: "#ec4899" },
];

function ServiceStatsChart({ data = defaultData }: ServiceStatsChartProps) {
  // Assign colors if not provided
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                  <div className="mb-1 font-semibold">{payload[0].name}</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Bookings: </span>
                    <span className="font-bold">{payload[0].value}</span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default memo(ServiceStatsChart);
