"use client"

import { memo } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { orders } from "@/lib/data"
import { subDays, format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const data = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const day = format(date, "MMM d");
    const count = orders.filter(order => format(new Date(order.createdAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")).length;
    return { name: day, orders: count };
});


function OrdersChart() {
  return (
    <div className="h-[300px]">
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
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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
            dataKey="orders"
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

export default memo(OrdersChart);
