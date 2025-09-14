"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ChartContainer } from "@/components/charts/chart-container"
import { mockSavedVisualizations } from "@/lib/mock-data"
import { fetchDashboardData } from "@/lib/data-service"
import { Plus, TrendingUp, Users, MessageSquare, Clock, Star, BarChart3, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { ChatPrompt, ChatResponse, User } from "@/lib/types"

export function Dashboard() {
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<{
    prompts: ChatPrompt[]
    responses: ChatResponse[]
    users: User[]
    metrics: {
      totalPrompts: number
      totalUsers: number
      avgRating: number
      avgResponseTime: number
      totalTokens: number
      cacheHitRate: number
      totalCachedQueries: number
    }
    chartData: {
      dailyVolume: number[]
      dayNames: string[]
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const data = await fetchDashboardData()
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Use real data if available, otherwise show loading state
  const totalPrompts = dashboardData?.metrics.totalPrompts || 0
  const totalUsers = dashboardData?.metrics.totalUsers || 0
  const avgRating = dashboardData?.metrics.avgRating || 0
  const avgResponseTime = dashboardData?.metrics.avgResponseTime || 0

  // Use real cache hit data from the data service
  const cacheHitRate = dashboardData?.metrics.cacheHitRate || 0
  const cacheMissRate = 100 - cacheHitRate
  const totalCachedQueries = dashboardData?.metrics.totalCachedQueries || 0

  // Calculate ratings distribution from real data
  const ratingsDistribution = [0, 0, 0, 0, 0] // [1-star, 2-star, 3-star, 4-star, 5-star]
  dashboardData?.prompts.forEach(prompt => {
    const rating = prompt.metadata.satisfaction_rating
    if (rating && rating >= 1 && rating <= 5) {
      ratingsDistribution[rating - 1]++
    }
  })

  // Chart data using real data
  const dashboardCharts = [
    {
      id: "daily-volume",
      title: "Daily Prompt Volume",
      description: "Prompt submissions over the last 7 days",
      chartType: "line" as const,
      data: {
        labels: dashboardData?.chartData.dayNames || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Prompts",
            data: dashboardData?.chartData.dailyVolume || [0, 0, 0, 0, 0, 0, 0],
            borderColor: "oklch(0.65 0.15 35)",
            backgroundColor: "oklch(0.65 0.15 35 / 0.1)",
            fill: true,
          },
        ],
      },
    },
    {
      id: "cache-hit-rate",
      title: "Cache Hit Percentage",
      description: `${cacheHitRate.toFixed(1)}% cache hit rate from ${totalPrompts} queries`,
      chartType: "pie" as const,
      data: {
        labels: ["Cache Hits", "Cache Misses"],
        datasets: [
          {
            label: "Cache Performance",
            data: [cacheHitRate, cacheMissRate],
            backgroundColor: [
              "oklch(0.65 0.15 120)", // Green for hits
              "oklch(0.65 0.15 0)",   // Red for misses
            ],
          },
        ],
      },
    },
    {
      id: "ratings-distribution",
      title: "Rating Distribution",
      description: "User satisfaction ratings breakdown",
      chartType: "bar" as const,
      data: {
        labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
        datasets: [
          {
            label: "Number of Ratings",
            data: ratingsDistribution,
            backgroundColor: [
              "oklch(0.65 0.15 0)",   // Red for 1 star
              "oklch(0.65 0.15 30)",  // Orange for 2 stars
              "oklch(0.65 0.15 60)",  // Yellow for 3 stars
              "oklch(0.65 0.15 120)", // Light green for 4 stars
              "oklch(0.65 0.15 140)", // Green for 5 stars
            ],
          },
        ],
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gradient-to-br from-muted/5 to-muted/10">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold text-foreground">{totalPrompts}</p>
                <p className="text-xs text-muted-foreground mt-1">Real-time data</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">Users with queries</p>
              </div>
              <Users className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : "No data"}</p>
                <p className="text-xs text-muted-foreground mt-1">Real-time data</p>
              </div>
              <Star className="w-8 h-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {avgResponseTime > 0 ? `${avgResponseTime.toFixed(2)}s` : "No data"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Real-time data</p>
              </div>
              <Clock className="w-8 h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardCharts.map((chart) => (
          <ChartContainer
            key={chart.id}
            title={chart.title}
            description={chart.description}
            chartType={chart.chartType}
            data={chart.data}
          />
        ))}
      </div>

      {/* Saved Visualizations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Saved Visualizations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Your saved charts and analysis views</p>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSavedVisualizations.map((viz) => (
              <Card key={viz.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium line-clamp-1">{viz.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{viz.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Chart Preview */}
                    <div className="h-24 bg-gradient-to-br from-primary/5 to-chart-2/5 rounded-md flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-muted-foreground" />
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="capitalize">
                          {viz.chart_type}
                        </Badge>
                        <span className="text-muted-foreground">{new Date(viz.updated_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {viz.is_public ? (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Private
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          by {dashboardData?.users.find((u) => u.id === viz.created_by)?.name || "GOON"}
                        </span>
                      </div>
                    </div>

                    {/* Query Preview */}
                    <div className="bg-muted/30 rounded-md p-2">
                      <p className="text-xs text-muted-foreground line-clamp-2 font-mono">"{viz.query}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Visualization Card */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <h3 className="font-medium text-foreground mb-1">Create New Visualization</h3>
                <p className="text-sm text-muted-foreground">Ask a question to generate a new chart</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-chart-3" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData && dashboardData.prompts.length > 0 ? (
              dashboardData.prompts.slice(0, 5).map((prompt, index) => {
                const user = dashboardData.users.find(u => u.id === prompt.user_id)
                const timeAgo = new Date(prompt.timestamp).toLocaleDateString()

                return (
                  <div key={prompt.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{user?.name || "GOON"}</span> submitted a prompt:{" "}
                        <span className="font-medium">"{prompt.content.slice(0, 50)}..."</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent activity available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
