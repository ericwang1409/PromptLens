"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { ProviderSelector } from "@/components/provider-selector"

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState("anthropic")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">ClueLEE</h1>
            <ProviderSelector selectedProvider={selectedProvider} onProviderChange={setSelectedProvider} />
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface provider={selectedProvider} />
        </div>
      </div>
    </div>
  )
}
