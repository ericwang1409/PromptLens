import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"

export default function SavedPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground text-balance">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of your data insights and saved visualizations
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Dashboard />
        </div>
      </main>
    </div>
  )
}
