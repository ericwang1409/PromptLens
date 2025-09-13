"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdvancedFilters } from "@/components/advanced-filters"
import { mockPrompts, mockResponses, mockUsers } from "@/lib/mock-data"
import { Search, Calendar, UserIcon, MessageSquare, Clock, TrendingUp, Star, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ChatDataBrowser() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [advancedFilters, setAdvancedFilters] = useState<any>(null)

  // Combine prompts with their responses and user data
  const enrichedData = mockPrompts.map((prompt) => {
    const response = mockResponses.find((r) => r.prompt_id === prompt.id)
    const user = mockUsers.find((u) => u.id === prompt.user_id)
    return { prompt, response, user }
  })

  const filteredData = enrichedData
    .filter((item) => {
      // Basic search filter
      const matchesSearch =
        searchQuery === "" ||
        item.prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.response?.content.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        item.user?.name.toLowerCase().includes(searchQuery.toLowerCase())

      // Basic category filter
      const matchesCategory = selectedCategory === "all" || item.prompt.category === selectedCategory

      // Basic user filter
      const matchesUser = selectedUser === "all" || item.user?.id === selectedUser

      // Advanced filters
      let matchesAdvanced = true
      if (advancedFilters) {
        // Date range filter
        if (advancedFilters.dateRange.from || advancedFilters.dateRange.to) {
          const itemDate = new Date(item.prompt.timestamp)
          if (advancedFilters.dateRange.from && itemDate < advancedFilters.dateRange.from) {
            matchesAdvanced = false
          }
          if (advancedFilters.dateRange.to && itemDate > advancedFilters.dateRange.to) {
            matchesAdvanced = false
          }
        }

        // Categories filter
        if (advancedFilters.categories.length > 0 && !advancedFilters.categories.includes(item.prompt.category)) {
          matchesAdvanced = false
        }

        // Users filter
        if (advancedFilters.users.length > 0 && !advancedFilters.users.includes(item.user?.id)) {
          matchesAdvanced = false
        }

        // Rating filter
        const rating = item.prompt.metadata.satisfaction_rating || 0
        if (rating < advancedFilters.ratingRange[0] || rating > advancedFilters.ratingRange[1]) {
          matchesAdvanced = false
        }

        // Token filter
        const tokens = item.response?.tokens_used || 0
        if (tokens < advancedFilters.tokenRange[0] || tokens > advancedFilters.tokenRange[1]) {
          matchesAdvanced = false
        }

        // Models filter
        if (
          advancedFilters.models.length > 0 &&
          item.response &&
          !advancedFilters.models.includes(item.response.model)
        ) {
          matchesAdvanced = false
        }

        // Departments filter
        if (advancedFilters.departments.length > 0 && !advancedFilters.departments.includes(item.user?.department)) {
          matchesAdvanced = false
        }

        // Has response filter
        if (advancedFilters.hasResponse === true && !item.response) {
          matchesAdvanced = false
        }
      }

      return matchesSearch && matchesCategory && matchesUser && matchesAdvanced
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.prompt.timestamp).getTime() - new Date(a.prompt.timestamp).getTime()
        case "oldest":
          return new Date(a.prompt.timestamp).getTime() - new Date(b.prompt.timestamp).getTime()
        case "rating":
          return (b.prompt.metadata.satisfaction_rating || 0) - (a.prompt.metadata.satisfaction_rating || 0)
        case "tokens":
          return (b.response?.tokens_used || 0) - (a.response?.tokens_used || 0)
        default:
          return 0
      }
    })

  const categories = ["all", "analysis", "creative", "technical", "question", "other"]

  const totalPrompts = mockPrompts.length
  const avgRating = mockPrompts.reduce((sum, p) => sum + (p.metadata.satisfaction_rating || 0), 0) / totalPrompts
  const totalTokens = mockResponses.reduce((sum, r) => sum + r.tokens_used, 0)
  const avgResponseTime = mockResponses.reduce((sum, r) => sum + r.response_time, 0) / mockResponses.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold text-foreground">{totalPrompts}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold text-foreground">{avgResponseTime.toFixed(1)}s</p>
              </div>
              <Clock className="w-8 h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts, responses, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {mockUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="tokens">Tokens</SelectItem>
            </SelectContent>
          </Select>

          <AdvancedFilters onFiltersChange={setAdvancedFilters} availableUsers={mockUsers} />

          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Calendar className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "secondary"}
            className="cursor-pointer capitalize hover:bg-primary/20 transition-colors"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {totalPrompts} conversations
          {advancedFilters && <span className="ml-2 text-primary">(filtered)</span>}
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <MessageSquare className="w-3 h-3" />
            {mockPrompts.length} prompts
          </Badge>
          <Badge variant="outline" className="gap-1">
            <UserIcon className="w-3 h-3" />
            {mockUsers.length} users
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {filteredData.map(({ prompt, response, user }) => (
          <Card key={prompt.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">{user?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user?.department} • {user?.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {prompt.category}
                  </Badge>
                  {prompt.metadata.satisfaction_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{prompt.metadata.satisfaction_rating}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(prompt.timestamp).toLocaleDateString()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Create Visualization</DropdownMenuItem>
                      <DropdownMenuItem>Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Prompt</span>
                </div>
                <p className="text-sm text-foreground pl-4 text-pretty leading-relaxed">{prompt.content}</p>
                <div className="flex gap-1 pl-4 flex-wrap">
                  {prompt.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Response */}
              {response && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                    <span className="text-sm font-medium">Response</span>
                    <Badge variant="outline" className="text-xs">
                      {response.model}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-4 text-pretty leading-relaxed">{response.content}</p>
                  <div className="flex gap-4 pl-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {response.tokens_used} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {response.response_time}s
                    </span>
                    {response.quality_score && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {response.quality_score}/5
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No conversations found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </Card>
      )}
    </div>
  )
}
