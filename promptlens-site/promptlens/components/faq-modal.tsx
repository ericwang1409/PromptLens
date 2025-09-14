"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, HelpCircle, Sparkles, Download, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  faqContent: string;
  stats?: {
    totalQueries: number;
    frequentQueries: number;
    totalFrequentQueries: number;
    avgRating: number | null;
    dateRange: {
      earliest: string;
      latest: string;
    };
    generatedAt: string;
  };
}

export function FAQModal({
  isOpen,
  onClose,
  faqContent,
  stats,
}: FAQModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(faqContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy FAQ:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([faqContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personal-faq-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-background">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Your Personal FAQ</CardTitle>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Auto Generated
                </Badge>
              </div>
              <CardDescription>
                Frequently asked questions based on your conversation patterns
                {stats && (
                  <span className="block mt-1 text-xs">
                    {stats.frequentQueries} frequently asked questions from{" "}
                    {stats.totalQueries} total conversations
                    {stats.avgRating && ` • Avg rating: ${stats.avgRating}/5`}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-6 text-foreground border-b pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-6 mb-3 text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-medium mt-4 mb-2 text-foreground">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm text-muted-foreground space-y-1 mb-3 pl-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm text-muted-foreground space-y-1 mb-3 pl-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="list-disc">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {faqContent}
            </ReactMarkdown>
          </div>
        </CardContent>

        {stats && (
          <div className="flex-shrink-0 border-t p-4 bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  {stats.frequentQueries} FAQs from {stats.totalQueries} total
                  conversations ({stats.totalFrequentQueries} frequent
                  questions)
                </span>
                {stats.dateRange.earliest && stats.dateRange.latest && (
                  <span>
                    From {formatDate(stats.dateRange.earliest)} to{" "}
                    {formatDate(stats.dateRange.latest)}
                  </span>
                )}
              </div>
              <span>Generated on {formatDate(stats.generatedAt)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
