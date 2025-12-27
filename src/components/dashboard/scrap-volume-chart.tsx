"use client"

import { memo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { orders, scrapCategories } from "@/lib/data"

const data = scrapCategories.map(category => {
    const totalWeight = orders
        .filter(order => order.scrapCategory === category.name && order.status === 'completed' && order.finalWeight)
        .reduce((sum, order) => sum + (order.finalWeight || 0), 0);
    return { name: category.name, total: totalWeight };
});

function ScrapVolumeChart() {
  return (
    <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <XAxis
                dataKey="name"
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
                tickFormatter={(value) => `${value} kg`}
            />
            <Tooltip 
                cursor={{fill: 'hsl(var(--muted))'}}
                contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
    </div>
  )
}

export default memo(ScrapVolumeChart);
