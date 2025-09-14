"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer } from "@/components/charts/chart-container"
import { X, RefreshCw, Download, Share } from "lucide-react"
import type { SavedVisualization } from "@/lib/types"

interface ViewVisualizationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegenerate: (query: string) => void
  visualization: SavedVisualization | null
}

export function ViewVisualizationModal({
  isOpen,
  onClose,
  onRegenerate,
  visualization
}: ViewVisualizationModalProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    if (!visualization) return

    try {
      setIsRegenerating(true)
      onRegenerate(visualization.query)
      onClose()
    } catch (error) {
      console.error('Error regenerating visualization:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!isOpen || !visualization) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{visualization.name}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {visualization.chart_type}
                </Badge>
              </div>
              {visualization.description && (
                <p className="text-sm text-muted-foreground">{visualization.description}</p>
              )}
              <div className="mt-2 p-2 bg-muted/30 rounded text-xs font-mono">
                "{visualization.query}"
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Chart Display */}
          <div className="w-full">
            <ChartContainer
              title={visualization.name}
              description={`Generated from: "${visualization.query}"`}
              chartType={visualization.chart_type}
              data={visualization.chart_data || { labels: [], datasets: [] }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate Chart'}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <Share className="w-4 h-4" />
              Share
            </Button>
            <div className="flex-1" />
            <div className="text-xs text-muted-foreground flex items-center">
              Created: {new Date(visualization.created_at).toLocaleDateString()}
              {visualization.updated_at !== visualization.created_at && (
                <span className="ml-2">
                  • Updated: {new Date(visualization.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
