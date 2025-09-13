"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react"
import { format } from "date-fns"

interface FilterState {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  categories: string[]
  users: string[]
  ratingRange: [number, number]
  tokenRange: [number, number]
  responseTimeRange: [number, number]
  models: string[]
  departments: string[]
  hasResponse: boolean | null
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  availableUsers: Array<{ id: string; name: string; department?: string }>
  className?: string
}

export function AdvancedFilters({ onFiltersChange, availableUsers, className }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    categories: [],
    users: [],
    ratingRange: [0, 5],
    tokenRange: [0, 500],
    responseTimeRange: [0, 10],
    models: [],
    departments: [],
    hasResponse: null,
  })

  const categories = ["analysis", "creative", "technical", "question", "other"]
  const models = ["gpt-4", "claude-3", "gpt-3.5-turbo"]
  const departments = ["Data Science", "Marketing", "Engineering", "Sales", "Support"]

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange(updated)
  }

  const resetFilters = () => {
    const resetState: FilterState = {
      dateRange: { from: undefined, to: undefined },
      categories: [],
      users: [],
      ratingRange: [0, 5],
      tokenRange: [0, 500],
      responseTimeRange: [0, 10],
      models: [],
      departments: [],
      hasResponse: null,
    }
    setFilters(resetState)
    onFiltersChange(resetState)
  }

  const toggleArrayFilter = (array: string[], value: string) => {
    return array.includes(value) ? array.filter((item) => item !== value) : [...array, value]
  }

  const activeFiltersCount = [
    filters.categories.length,
    filters.users.length,
    filters.models.length,
    filters.departments.length,
    filters.dateRange.from || filters.dateRange.to ? 1 : 0,
    filters.ratingRange[0] > 0 || filters.ratingRange[1] < 5 ? 1 : 0,
    filters.tokenRange[0] > 0 || filters.tokenRange[1] < 500 ? 1 : 0,
    filters.responseTimeRange[0] > 0 || filters.responseTimeRange[1] < 10 ? 1 : 0,
    filters.hasResponse !== null ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Advanced Filters</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2">
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, from: date },
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? format(filters.dateRange.to, "MMM dd") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, to: date },
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categories</Label>
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={filters.categories.includes(category) ? "default" : "secondary"}
                    className="cursor-pointer capitalize text-xs"
                    onClick={() =>
                      updateFilters({
                        categories: toggleArrayFilter(filters.categories, category),
                      })
                    }
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Users */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Users</Label>
              <Select
                value=""
                onValueChange={(value) =>
                  updateFilters({
                    users: toggleArrayFilter(filters.users, value),
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select users..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.users.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.users.map((userId) => {
                    const user = availableUsers.find((u) => u.id === userId)
                    return (
                      <Badge key={userId} variant="default" className="text-xs">
                        {user?.name}
                        <button
                          onClick={() =>
                            updateFilters({
                              users: filters.users.filter((id) => id !== userId),
                            })
                          }
                          className="ml-1 hover:bg-primary-foreground/20 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Rating Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Rating Range: {filters.ratingRange[0]} - {filters.ratingRange[1]}
              </Label>
              <Slider
                value={filters.ratingRange}
                onValueChange={(value) => updateFilters({ ratingRange: value as [number, number] })}
                max={5}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Token Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Token Range: {filters.tokenRange[0]} - {filters.tokenRange[1]}
              </Label>
              <Slider
                value={filters.tokenRange}
                onValueChange={(value) => updateFilters({ tokenRange: value as [number, number] })}
                max={500}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            {/* Models */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Models</Label>
              <div className="flex flex-wrap gap-1">
                {models.map((model) => (
                  <Badge
                    key={model}
                    variant={filters.models.includes(model) ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() =>
                      updateFilters({
                        models: toggleArrayFilter(filters.models, model),
                      })
                    }
                  >
                    {model}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Departments</Label>
              <div className="flex flex-wrap gap-1">
                {departments.map((dept) => (
                  <Badge
                    key={dept}
                    variant={filters.departments.includes(dept) ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() =>
                      updateFilters({
                        departments: toggleArrayFilter(filters.departments, dept),
                      })
                    }
                  >
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Has Response Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Has Response</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Any</span>
                <Switch
                  checked={filters.hasResponse === true}
                  onCheckedChange={(checked) =>
                    updateFilters({
                      hasResponse: checked ? true : null,
                    })
                  }
                />
                <span className="text-xs text-muted-foreground">Yes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
