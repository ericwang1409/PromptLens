"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, Maximize2, Share } from "lucide-react"

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    fill?: boolean
  }[]
}

interface ChartContainerProps {
  title: string
  description?: string
  chartType: "line" | "bar" | "pie" | "scatter"
  data: ChartData
  className?: string
}

export function ChartContainer({ title, description, chartType, data, className }: ChartContainerProps) {
  // Transform data for Recharts format
  const transformedData = data.labels.map((label, index) => {
    const point: any = { name: label }
    data.datasets.forEach((dataset, datasetIndex) => {
      point[dataset.label] = dataset.data[index] || 0
    })
    return point
  })

  // Color palette matching our design system
  const colors = [
    "oklch(0.65 0.15 35)", // primary
    "oklch(0.55 0.12 200)", // chart-2
    "oklch(0.45 0.08 150)", // chart-3
    "oklch(0.7 0.1 60)", // chart-4
    "oklch(0.5 0.08 300)", // chart-5
  ]

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 85)" />
              <XAxis dataKey="name" stroke="oklch(0.55 0.01 85)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0.01 85)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.99 0.003 85)",
                  border: "1px solid oklch(0.9 0.01 85)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.borderColor || colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: dataset.borderColor || colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 85)" />
              <XAxis dataKey="name" stroke="oklch(0.55 0.01 85)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0.01 85)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.99 0.003 85)",
                  border: "1px solid oklch(0.9 0.01 85)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieData = data.labels.map((label, index) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0,
          fill: colors[index % colors.length],
        }))

        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.99 0.003 85)",
                  border: "1px solid oklch(0.9 0.01 85)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chart type not supported
          </div>
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {chartType} chart
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  )
}
