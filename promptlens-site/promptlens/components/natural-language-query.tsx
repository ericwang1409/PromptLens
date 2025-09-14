"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer } from "@/components/charts/chart-container";
import { useAuth } from "@/lib/auth-context";
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
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

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
    } catch (e: any) {
      setResult({
        query: queryText,
        interpretation: e?.message || "Failed to generate visualization",
        chartType: "line",
        data: { labels: [], datasets: [] },
        insights: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    handleSubmit(suggestion.text);
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
  );
}
