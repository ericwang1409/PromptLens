import type { User, ChatPrompt, ChatResponse, SavedVisualization } from "./types"

// Mock users data
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@company.com",
    role: "analyst",
    department: "Data Science",
    created_at: "2024-01-15T10:00:00Z",
    properties: { experience_level: "senior", team: "ML Research" },
  },
  {
    id: "2",
    name: "Bob Chen",
    email: "bob@company.com",
    role: "user",
    department: "Marketing",
    created_at: "2024-02-01T14:30:00Z",
    properties: { experience_level: "intermediate", team: "Growth" },
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@company.com",
    role: "admin",
    department: "Engineering",
    created_at: "2024-01-10T09:15:00Z",
    properties: { experience_level: "expert", team: "Platform" },
  },
]

// Mock chat prompts
export const mockPrompts: ChatPrompt[] = [
  {
    id: "1",
    user_id: "1",
    content: "Analyze the customer churn patterns in our Q3 data",
    timestamp: "2024-09-10T15:30:00Z",
    category: "analysis",
    tags: ["churn", "analytics", "Q3"],
    metadata: {
      model_used: "gpt-4",
      tokens_used: 45,
      response_time: 2.3,
      satisfaction_rating: 4.5,
    },
  },
  {
    id: "2",
    user_id: "2",
    content: "Generate creative marketing copy for our new product launch",
    timestamp: "2024-09-11T09:15:00Z",
    category: "creative",
    tags: ["marketing", "copywriting", "product-launch"],
    metadata: {
      model_used: "claude-3",
      tokens_used: 32,
      response_time: 1.8,
      satisfaction_rating: 4.8,
    },
  },
  {
    id: "3",
    user_id: "3",
    content: "How do I optimize database queries for better performance?",
    timestamp: "2024-09-12T11:45:00Z",
    category: "technical",
    tags: ["database", "optimization", "performance"],
    metadata: {
      model_used: "gpt-4",
      tokens_used: 28,
      response_time: 1.5,
      satisfaction_rating: 4.2,
    },
  },
]

// Mock chat responses
export const mockResponses: ChatResponse[] = [
  {
    id: "1",
    prompt_id: "1",
    content:
      "Based on the Q3 data analysis, I found three key churn patterns: 1) Users who haven't engaged in 30+ days show 65% churn probability, 2) Feature usage below 3 actions/week correlates with 45% churn, 3) Support ticket volume >2/month indicates 38% churn risk.",
    timestamp: "2024-09-10T15:32:18Z",
    model: "gpt-4",
    tokens_used: 156,
    response_time: 2.3,
    quality_score: 4.5,
  },
  {
    id: "2",
    prompt_id: "2",
    content:
      "Here's compelling copy for your product launch: \"Transform Your Workflow in Minutes, Not Months\" - Introducing [Product Name], the intuitive solution that adapts to your team's unique needs. Experience seamless integration, powerful automation, and results that speak for themselves.",
    timestamp: "2024-09-11T09:16:48Z",
    model: "claude-3",
    tokens_used: 187,
    response_time: 1.8,
    quality_score: 4.8,
  },
  {
    id: "3",
    prompt_id: "3",
    content:
      "To optimize database queries: 1) Add proper indexes on frequently queried columns, 2) Use EXPLAIN to analyze query execution plans, 3) Avoid SELECT *, 4) Consider query caching, 5) Optimize JOIN operations by ensuring proper foreign key relationships.",
    timestamp: "2024-09-12T11:47:30Z",
    model: "gpt-4",
    tokens_used: 142,
    response_time: 1.5,
    quality_score: 4.2,
  },
]

// Mock saved visualizations
export const mockSavedVisualizations: SavedVisualization[] = [
  {
    id: "1",
    name: "Daily Prompt Volume",
    description: "Track daily prompt submissions across all users",
    query: "Show me daily prompt volume for the last 30 days",
    chart_type: "line",
    chart_data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Prompts",
        data: [45, 52, 38, 61, 47, 55, 43],
        borderColor: "oklch(0.65 0.15 120)",
        fill: false
      }]
    },
    config: {
      timeRange: "30d",
      groupBy: "day",
      metric: "count",
    },
    created_by: "1",
    created_at: "2024-09-01T10:00:00Z",
    updated_at: "2024-09-10T15:30:00Z",
  },
  {
    id: "2",
    name: "User Engagement by Department",
    description: "Compare prompt activity across different departments",
    query: "Compare prompt usage by department",
    chart_type: "pie",
    chart_data: {
      labels: ["Engineering", "Marketing", "Sales", "Support"],
      datasets: [{
        label: "Prompts by Department",
        data: [120, 85, 65, 45],
        backgroundColor: [
          "oklch(0.65 0.15 120)",
          "oklch(0.55 0.12 200)",
          "oklch(0.45 0.08 150)",
          "oklch(0.7 0.1 60)"
        ]
      }]
    },
    config: {
      groupBy: "department",
      metric: "avg_prompts_per_user",
    },
    created_by: "3",
    created_at: "2024-08-15T14:20:00Z",
    updated_at: "2024-09-05T09:15:00Z",
  },
]
