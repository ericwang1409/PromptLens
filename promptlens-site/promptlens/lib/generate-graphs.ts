import { VisualizationData } from './types'

/**
 * Generate data for pie charts
 * @param labels - Array of category labels
 * @param values - Array of corresponding values
 * @param colors - Optional array of colors for each slice
 * @returns VisualizationData formatted for pie charts
 */
export function generatePieChart(
  labels: string[],
  values: number[],
  colors?: string[]
): VisualizationData {
  if (labels.length !== values.length) {
    throw new Error('Labels and values arrays must have the same length')
  }

  const defaultColors = [
    'oklch(0.65 0.15 35)',   // primary
    'oklch(0.55 0.12 200)',  // chart-2
    'oklch(0.45 0.08 150)',  // chart-3
    'oklch(0.7 0.1 60)',     // chart-4
    'oklch(0.5 0.08 300)',   // chart-5
    'oklch(0.6 0.12 180)',   // additional colors
    'oklch(0.5 0.1 100)',
    'oklch(0.7 0.08 250)',
  ]

  return {
    labels,
    datasets: [{
      label: 'Data',
      data: values,
      backgroundColor: colors || defaultColors.slice(0, labels.length),
    }]
  }
}

/**
 * Generate data for line charts
 * @param labels - Array of x-axis labels (time points, categories, etc.)
 * @param datasets - Array of line datasets with their data points
 * @returns VisualizationData formatted for line charts
 */
export function generateLineChart(
  labels: string[],
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    fill?: boolean
  }>
): VisualizationData {
  // Validate that all datasets have the same length as labels
  for (const dataset of datasets) {
    if (dataset.data.length !== labels.length) {
      throw new Error(`Dataset "${dataset.label}" data length must match labels length`)
    }
  }

  const defaultColors = [
    'oklch(0.65 0.15 35)',   // primary
    'oklch(0.55 0.12 200)',  // chart-2
    'oklch(0.45 0.08 150)',  // chart-3
    'oklch(0.7 0.1 60)',     // chart-4
    'oklch(0.5 0.08 300)',   // chart-5
  ]

  return {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.borderColor || defaultColors[index % defaultColors.length],
      fill: dataset.fill ?? false,
    }))
  }
}

/**
 * Generate data for bar charts
 * @param labels - Array of x-axis labels (categories)
 * @param datasets - Array of bar datasets with their data points
 * @returns VisualizationData formatted for bar charts
 */
export function generateBarChart(
  labels: string[],
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
  }>
): VisualizationData {
  // Validate that all datasets have the same length as labels
  for (const dataset of datasets) {
    if (dataset.data.length !== labels.length) {
      throw new Error(`Dataset "${dataset.label}" data length must match labels length`)
    }
  }

  const defaultColors = [
    'oklch(0.65 0.15 35)',   // primary
    'oklch(0.55 0.12 200)',  // chart-2
    'oklch(0.45 0.08 150)',  // chart-3
    'oklch(0.7 0.1 60)',     // chart-4
    'oklch(0.5 0.08 300)',   // chart-5
  ]

  return {
    labels,
    datasets: datasets.map((dataset, index) => {
      const defaultColor = defaultColors[index % defaultColors.length]
      let backgroundColor: string[]
      
      if (Array.isArray(dataset.backgroundColor)) {
        backgroundColor = dataset.backgroundColor
      } else if (dataset.backgroundColor) {
        backgroundColor = [dataset.backgroundColor]
      } else {
        backgroundColor = [defaultColor]
      }

      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor,
      }
    })
  }
}

// Example usage functions for quick testing and reference

/**
 * Example: Generate sample pie chart data
 */
export function generateSamplePieChart(): VisualizationData {
  return generatePieChart(
    ['Desktop', 'Mobile', 'Tablet', 'Other'],
    [45, 35, 15, 5]
  )
}

/**
 * Example: Generate sample line chart data
 */
export function generateSampleLineChart(): VisualizationData {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return generateLineChart(months, [
    {
      label: 'Users',
      data: [100, 150, 200, 180, 220, 250],
      borderColor: 'oklch(0.65 0.15 35)',
    },
    {
      label: 'Sessions',
      data: [80, 120, 160, 140, 180, 200],
      borderColor: 'oklch(0.55 0.12 200)',
    }
  ])
}

/**
 * Example: Generate sample bar chart data
 */
export function generateSampleBarChart(): VisualizationData {
  const categories = ['Q1', 'Q2', 'Q3', 'Q4']
  return generateBarChart(categories, [
    {
      label: 'Revenue',
      data: [12000, 15000, 18000, 22000],
      backgroundColor: 'oklch(0.65 0.15 35)',
    },
    {
      label: 'Profit',
      data: [3000, 4500, 5400, 6600],
      backgroundColor: 'oklch(0.55 0.12 200)',
    }
  ])
}
