"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X } from "lucide-react"

interface SaveVisualizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    description: string
  }) => Promise<void>
  query: string
  chartType: string
}

export function SaveVisualizationModal({
  isOpen,
  onClose,
  onSave,
  query,
  chartType
}: SaveVisualizationModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return

    try {
      setIsSaving(true)
      await onSave({ name, description })
      setName("")
      setDescription("")
      onClose()
    } catch (error) {
      console.error('Error saving visualization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save Visualization
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter visualization name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Query</Label>
            <div className="p-2 bg-muted rounded text-sm font-mono">
              {query}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Chart Type</Label>
            <div className="p-2 bg-muted rounded text-sm capitalize">
              {chartType}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
