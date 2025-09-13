export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user" | "analyst"
  department?: string
  created_at: string
  properties: Record<string, any>
}

export interface ChatPrompt {
  id: string
  user_id: string
  content: string
  timestamp: string
  category: "question" | "analysis" | "creative" | "technical" | "other"
  tags: string[]
  metadata: {
    model_used?: string
    tokens_used?: number
    response_time?: number
    satisfaction_rating?: number
  }
}

export interface ChatResponse {
  id: string
  prompt_id: string
  content: string
  timestamp: string
  model: string
  tokens_used: number
  response_time: number
  quality_score?: number
}

export interface SavedVisualization {
  id: string
  name: string
  description: string
  query: string
  chart_type: "line" | "bar" | "pie" | "scatter" | "heatmap" | "timeline"
  config: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
  is_public: boolean
}

export interface VisualizationData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    fill?: boolean
  }[]
}
