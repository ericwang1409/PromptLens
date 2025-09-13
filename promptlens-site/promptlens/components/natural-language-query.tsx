"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ChartContainer } from "@/components/charts/chart-container"
import { Send, Sparkles, BarChart3, LineChart, PieChart, TrendingUp, Lightbulb } from "lucide-react"

interface QuerySuggestion {
  text: string
  category: string
  icon: React.ReactNode
}

interface QueryResult {
  query: string
  interpretation: string
  chartType: "line" | "bar" | "pie" | "scatter"
  data: any
  insights: string[]
}

export function NaturalLanguageQuery() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)

  const suggestions: QuerySuggestion[] = [
    {
      text: "Show me daily prompt volume for the last 30 days",
      category: "Trends",
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      text: "Compare user engagement by department",
      category: "Analysis",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      text: "What are the most common prompt categories?",
      category: "Distribution",
      icon: <PieChart className="w-4 h-4" />,
    },
    {
      text: "Show response time trends over time",
      category: "Performance",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      text: "Which users have the highest satisfaction ratings?",
      category: "Quality",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      text: "How does token usage vary by prompt category?",
      category: "Usage",
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ]

  const handleSubmit = async (queryText: string) => {
    setIsLoading(true)
    setQuery(queryText)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock response based on query content
    let mockResult: QueryResult

    if (queryText.toLowerCase().includes("daily") && queryText.toLowerCase().includes("volume")) {
      mockResult = {
        query: queryText,
        interpretation: "Analyzing daily prompt submission patterns over the last 30 days",
        chartType: "line",
        data: {
          labels: ["Sep 1", "Sep 5", "Sep 10", "Sep 15", "Sep 20", "Sep 25", "Sep 30"],
          datasets: [
            {
              label: "Daily Prompts",
              data: [12, 19, 15, 25, 22, 18, 28],
              borderColor: "oklch(0.65 0.15 35)",
              backgroundColor: "oklch(0.65 0.15 35 / 0.1)",
              fill: true,
            },
          ],
        },
        insights: [
          "Peak activity occurs mid-month with 25 prompts on Sep 15",
          "30% increase in activity over the past week",
          "Weekend activity is typically 40% lower than weekdays",
        ],
      }
    } else if (queryText.toLowerCase().includes("department")) {
      mockResult = {
        query: queryText,
        interpretation: "Comparing prompt usage across different departments",
        chartType: "bar",
        data: {
          labels: ["Data Science", "Marketing", "Engineering", "Sales", "Support"],
          datasets: [
            {
              label: "Prompts per User",
              data: [8.5, 6.2, 12.1, 4.8, 7.3],
              backgroundColor: [
                "oklch(0.65 0.15 35)",
                "oklch(0.55 0.12 200)",
                "oklch(0.45 0.08 150)",
                "oklch(0.7 0.1 60)",
                "oklch(0.5 0.08 300)",
              ],
            },
          ],
        },
        insights: [
          "Engineering team has highest usage at 12.1 prompts per user",
          "Sales team shows lowest engagement at 4.8 prompts per user",
          "Data Science team shows consistent daily usage patterns",
        ],
      }
    } else if (queryText.toLowerCase().includes("categories") || queryText.toLowerCase().includes("common")) {
      mockResult = {
        query: queryText,
        interpretation: "Breaking down prompt distribution by category",
        chartType: "pie",
        data: {
          labels: ["Analysis", "Technical", "Creative", "Question", "Other"],
          datasets: [
            {
              data: [35, 28, 18, 12, 7],
              backgroundColor: [
                "oklch(0.65 0.15 35)",
                "oklch(0.55 0.12 200)",
                "oklch(0.45 0.08 150)",
                "oklch(0.7 0.1 60)",
                "oklch(0.5 0.08 300)",
              ],
            },
          ],
        },
        insights: [
          "Analysis prompts dominate at 35% of all submissions",
          "Technical queries are second most common at 28%",
          "Creative prompts show 15% growth month-over-month",
        ],
      }
    } else {
      mockResult = {
        query: queryText,
        interpretation: "Analyzing general data patterns and trends",
        chartType: "line",
        data: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          datasets: [
            {
              label: "Activity Score",
              data: [65, 78, 82, 91],
              borderColor: "oklch(0.65 0.15 35)",
              backgroundColor: "oklch(0.65 0.15 35 / 0.1)",
              fill: true,
            },
          ],
        },
        insights: [
          "Steady upward trend in user engagement",
          "40% improvement in response quality this month",
          "Average session duration increased by 25%",
        ],
      }
    }

    setResult(mockResult)
    setIsLoading(false)
  }

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    handleSubmit(suggestion.text)
  }

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Ask Your Data
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about your chat data in natural language and get instant visualizations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="e.g., Show me daily prompt volume trends, Compare user engagement by department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (query.trim()) {
                    handleSubmit(query)
                  }
                }
              }}
            />
            <Button onClick={() => handleSubmit(query)} disabled={!query.trim() || isLoading} className="px-6">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Try these examples:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto p-3 text-left bg-background/50 hover:bg-primary/10 hover:border-primary/30"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion.icon}
                  <div>
                    <p className="text-sm font-medium">{suggestion.text}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {suggestion.category}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <div>
                <h3 className="font-medium text-foreground">Analyzing your query...</h3>
                <p className="text-sm text-muted-foreground mt-1">Processing data and generating visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Result */}
      {result && !isLoading && (
        <div className="space-y-4">
          <ChartContainer
            title="Query Result"
            description={result.interpretation}
            chartType={result.chartType}
            data={result.data}
          />

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-chart-4" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Save Visualization
            </Button>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              Share Results
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
