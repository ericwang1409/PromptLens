import { Sidebar } from "@/components/sidebar"
import { ChatDataBrowser } from "@/components/chat-data-browser"

export default function HomePage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground text-balance">LLM Data Insights</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore and visualize your chat data with natural language queries
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0">
          <ChatDataBrowser />
        </div>
      </main>
    </div>
  )
}
