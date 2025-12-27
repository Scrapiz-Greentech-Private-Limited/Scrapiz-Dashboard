"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { orders, scrapCategories } from "@/lib/data"

const data = scrapCategories.map(category => {
    const totalRevenue = orders
        .filter(order => order.scrapCategory === category.name && order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    return { name: category.name, revenue: totalRevenue };
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Category
            </span>
            <span className="font-bold text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Revenue
            </span>
            <span className="font-bold">
              ₹{payload[0].value.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}


export default function RevenueByCategoryChart() {
  return (
    <div className="h-[350px]">
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
                tickFormatter={(value) => `₹${value/1000}k`}
            />
            <Tooltip 
                cursor={{fill: 'hsl(var(--muted))'}}
                content={<CustomTooltip />}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
    </div>
  )
}
