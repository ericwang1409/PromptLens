"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatInterfaceProps {
  provider: string
}

export function ChatInterface({ provider }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hello! I'm your AI assistant powered by ${provider}. How can I help you today?`,
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Update welcome message when provider changes
  useEffect(() => {
    setMessages([
      {
        id: "1",
        content: `Hello! I'm your AI assistant powered by ${provider}. How can I help you today?`,
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }, [provider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call the API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId: 'default-user',
          temperature: 0.7,
          maxTokens: 1000,
          model: 'claude-3-haiku-20240307',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling API:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-card text-card-foreground"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {message.role === "user" ? <User className="w-5 h-5 mt-0.5" /> : <Bot className="w-5 h-5 mt-0.5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-card text-card-foreground">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 mt-0.5" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
