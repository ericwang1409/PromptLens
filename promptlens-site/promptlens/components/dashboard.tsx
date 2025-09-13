"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer } from "@/components/charts/chart-container"
import { mockSavedVisualizations, mockPrompts, mockResponses, mockUsers } from "@/lib/mock-data"
import { Plus, TrendingUp, Users, MessageSquare, Clock, Star, BarChart3, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Dashboard() {
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null)

  // Calculate key metrics
  const totalPrompts = mockPrompts.length
  const totalUsers = mockUsers.length
  const avgRating = mockPrompts.reduce((sum, p) => sum + (p.metadata.satisfaction_rating || 0), 0) / totalPrompts
  const totalTokens = mockResponses.reduce((sum, r) => sum + r.tokens_used, 0)
  const avgResponseTime = mockResponses.reduce((sum, r) => sum + r.response_time, 0) / mockResponses.length

  // Mock chart data for dashboard
  const dashboardCharts = [
    {
      id: "daily-volume",
      title: "Daily Prompt Volume",
      description: "Prompt submissions over the last 7 days",
      chartType: "line" as const,
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Prompts",
            data: [12, 19, 15, 25, 22, 18, 28],
            borderColor: "oklch(0.65 0.15 35)",
            backgroundColor: "oklch(0.65 0.15 35 / 0.1)",
            fill: true,
          },
        ],
      },
    },
    {
      id: "category-distribution",
      title: "Prompt Categories",
      description: "Distribution of prompt types",
      chartType: "pie" as const,
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
    },
    {
      id: "department-usage",
      title: "Department Usage",
      description: "Average prompts per user by department",
      chartType: "bar" as const,
      data: {
        labels: ["Engineering", "Data Science", "Marketing", "Sales"],
        datasets: [
          {
            label: "Avg Prompts/User",
            data: [12.1, 8.5, 6.2, 4.8],
            backgroundColor: [
              "oklch(0.65 0.15 35)",
              "oklch(0.55 0.12 200)",
              "oklch(0.45 0.08 150)",
              "oklch(0.7 0.1 60)",
            ],
          },
        ],
      },
    },
  ]

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
                <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
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
                <p className="text-xs text-muted-foreground mt-1">+3 new this week</p>
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
                <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">+0.2 from last week</p>
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
                <p className="text-2xl font-bold text-foreground">{avgResponseTime.toFixed(1)}s</p>
                <p className="text-xs text-muted-foreground mt-1">-0.3s improvement</p>
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
                          by {mockUsers.find((u) => u.id === viz.created_by)?.name || "Unknown"}
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
            {[
              {
                action: "Created visualization",
                item: "Daily Prompt Volume",
                user: "Alice Johnson",
                time: "2 hours ago",
                type: "create",
              },
              {
                action: "Updated dashboard",
                item: "User Engagement by Department",
                user: "Carol Davis",
                time: "4 hours ago",
                type: "update",
              },
              {
                action: "Shared visualization",
                item: "Response Time Trends",
                user: "Bob Chen",
                time: "1 day ago",
                type: "share",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "create" ? "bg-primary" : activity.type === "update" ? "bg-chart-2" : "bg-chart-3"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                    <span className="font-medium">"{activity.item}"</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
