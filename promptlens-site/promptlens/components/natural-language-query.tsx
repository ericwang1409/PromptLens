"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer } from "@/components/charts/chart-container";
import { SaveVisualizationModal } from "@/components/save-visualization-modal";
import { useAuth } from "@/lib/auth-context";
import { saveVisualization, saveQueryToHistory } from "@/lib/data-service";
import {
  Send,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

interface QuerySuggestion {
  text: string;
  category: string;
  icon: React.ReactNode;
}

interface QueryResult {
  query: string;
  interpretation: string;
  chartType: "line" | "bar" | "pie" | "scatter";
  data: any;
  insights: string[];
}

export function NaturalLanguageQuery() {
  const { session, user } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [segments, setSegments] = useState<any>(null);
  const [details, setDetails] = useState<Array<{ id: string; user_id: string; created_at: string; prompt: string | null; response: string | null }>>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Handle pre-filled query from URL parameters (for regenerate functionality)
  useEffect(() => {
    const urlQuery = searchParams.get('query');
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Auto-submit when query is set from URL
  useEffect(() => {
    const urlQuery = searchParams.get('query');
    if (urlQuery && query === urlQuery && !isLoading && !result) {
      handleSubmit(urlQuery);
    }
  }, [query, searchParams, isLoading, result]);

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
  ];

  const handleSubmit = async (queryText: string) => {
    try {
      setIsLoading(true);
      setQuery(queryText);

      if (!session?.access_token) {
        throw new Error("Authentication required");
      }

      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: queryText }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to generate visualization");

      const next: QueryResult = {
        query: queryText,
        interpretation: data.description || "Generated visualization",
        chartType: data.chartType,
        data: data.data,
        insights: [],
      };

      setResult(next);
      setSegments((data as any)?.segments || null);

      // Save query to history
      if (user) {
        try {
          await saveQueryToHistory(
            user.id,
            queryText,
            "visualization",
            data.chartType,
            [], // tags - could be enhanced to extract from query
            {
              source: "natural_language_interface",
              chartType: data.chartType,
              description: data.description
            }
          );
        } catch (error) {
          console.error("Failed to save query to history:", error);
          // Don't show error to user, just log it
        }
      }
    } catch (e: any) {
      setResult({
        query: queryText,
        interpretation: e?.message || "Failed to generate visualization",
        chartType: "line",
        data: { labels: [], datasets: [] },
        insights: [],
      });

      // Save failed query to history as well
      if (user) {
        try {
          await saveQueryToHistory(
            user.id,
            queryText,
            "visualization",
            "line", // default chart type for failed queries
            [], // tags
            {
              source: "natural_language_interface",
              status: "failed",
              error: e?.message || "Unknown error"
            }
          );
        } catch (error) {
          console.error("Failed to save failed query to history:", error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    handleSubmit(suggestion.text);
  };

  const handleSaveVisualization = async (saveData: {
    name: string;
    description: string;
  }) => {
    if (!user || !result) return;

    const saved = await saveVisualization(
      user.id,
      saveData.name,
      result.query,
      result.chartType,
      result.data,
      saveData.description,
      {}
    );

    if (saved) {
      // Could add a toast notification here
      console.log('Visualization saved successfully');
    }
  };

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
            Ask questions about your chat data in natural language and get
            instant visualizations
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
                  e.preventDefault();
                  if (query.trim()) {
                    handleSubmit(query);
                  }
                }
              }}
            />
            <Button
              onClick={() => handleSubmit(query)}
              disabled={!query.trim() || isLoading}
              className="px-6"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Try these examples:
            </p>
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
                <h3 className="font-medium text-foreground">
                  Analyzing your query...
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Processing data and generating visualization
                </p>
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
            onSegmentClick={async (segment) => {
              try {
                setIsDetailsLoading(true);
                setDetails([]);
                // Client-side filter using IDs from precomputed segments in state
                const segs = segments;
                let ids: string[] = [];
                if (result.chartType === 'pie') {
                  ids = segs?.pie?.[segment.label] || [];
                } else if (result.chartType === 'line') {
                  const day = (segment.timestamp || '').slice(0, 10);
                  ids = (segs?.line?.[day]?.[segment.label] || []) as string[];
                } else if (result.chartType === 'bar') {
                  ids = (segs?.bar?.[segment.group]?.[segment.label] || []) as string[];
                }

                if (!ids || ids.length === 0) {
                  setDetails([]);
                  return;
                }

                const res = await fetch(`/api/visualize/records`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                  },
                  body: JSON.stringify({ ids })
                });
                const detailsData = await res.json();
                if (!res.ok) throw new Error(detailsData?.error || 'Failed to fetch records');
                setDetails(detailsData.items || []);
              } catch (e) {
                setDetails([]);
              } finally {
                setIsDetailsLoading(false);
              }
            }}
          />

          {/* Details Drawer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Matching Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDetailsLoading ? (
                <div className="text-sm text-muted-foreground">Loading details...</div>
              ) : details.length === 0 ? (
                <div className="text-sm text-muted-foreground">Click a chart segment to view prompts.</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {details.map((d) => (
                    <div key={d.id} className="p-3 rounded-md border bg-background/50">
                      <div className="text-[11px] text-muted-foreground mb-1">{new Date(d.created_at).toLocaleString()} • {d.user_id}</div>
                      {d.prompt && (<div className="text-sm text-foreground whitespace-pre-wrap"><strong>Prompt:</strong> {d.prompt}</div>)}
                      {d.response && (<div className="text-sm text-foreground/80 whitespace-pre-wrap mt-1"><strong>Response:</strong> {d.response}</div>)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-chart-4" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveModal(true)}
              disabled={!user}
            >
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

      {/* Save Visualization Modal */}
      {result && (
        <SaveVisualizationModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveVisualization}
          query={result.query}
          chartType={result.chartType}
        />
      )}
    </div>
  );
}
