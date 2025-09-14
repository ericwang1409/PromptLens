"use client"

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

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

interface ChartPreviewProps {
  chartType: "line" | "pie"
  data: ChartData
  height?: number
}

export function ChartPreview({ chartType, data, height = 100 }: ChartPreviewProps) {
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
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={transformedData}>
              {data.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.borderColor || colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieData = data.labels.map((label, index) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0,
          fill: colors[index % colors.length],
        }))

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={height * 0.3}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground text-xs`}>
            No preview
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      {renderChart()}
    </div>
  )
}
