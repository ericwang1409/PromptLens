"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, BarChart3, MessageSquare, Users, Settings, Plus, Bookmark } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const navigationItems = [
    { id: "browse", label: "Browse Data", icon: MessageSquare, href: "/" },
    { id: "visualize", label: "Visualize", icon: BarChart3, href: "/visualize" },
    { id: "saved", label: "Dashboard", icon: Bookmark, href: "/saved" },
    { id: "users", label: "Users", icon: Users, href: "/users" },
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">DataViz</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-9 bg-sidebar-accent border-sidebar-border" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-sidebar-foreground">Recent Queries</h3>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="p-2 rounded-md bg-sidebar-accent/50 cursor-pointer hover:bg-sidebar-accent">
              <p className="text-xs text-sidebar-foreground line-clamp-2">Show daily prompt volume trends</p>
              <div className="flex gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  line chart
                </Badge>
              </div>
            </div>

            <div className="p-2 rounded-md bg-sidebar-accent/50 cursor-pointer hover:bg-sidebar-accent">
              <p className="text-xs text-sidebar-foreground line-clamp-2">Compare user engagement by department</p>
              <div className="flex gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  bar chart
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </aside>
  )
}
