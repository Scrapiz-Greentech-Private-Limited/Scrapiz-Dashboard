"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { orders } from "@/lib/data"
import { subDays, format } from "date-fns"

const data = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i);
    const day = format(date, "MMM d");
    const totalSales = orders
        .filter(order => format(new Date(order.createdAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd") && order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    return { name: day, sales: totalSales };
});

export default function SalesChart() {
  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 0,
          }}
        >
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(value) => `₹${value}`} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Line
            type="monotone"
            strokeWidth={2}
            dataKey="sales"
            activeDot={{
              r: 8,
              style: { fill: "hsl(var(--primary))" },
            }}
            stroke="hsl(var(--primary))"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
