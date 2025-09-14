"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { fetchQueryHistory } from "@/lib/data-service";
import type { QueryHistory } from "@/lib/types";
import {
  Search,
  BarChart3,
  MessageSquare,
  Settings,
  Plus,
  Bookmark,
  LogIn,
  Clock,
  Star,
  Trash2,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const navigationItems = [
    { id: "browse", label: "Browse Data", icon: MessageSquare, href: "/" },
    {
      id: "visualize",
      label: "Visualize",
      icon: BarChart3,
      href: "/visualize",
    },
    { id: "saved", label: "Dashboard", icon: Bookmark, href: "/saved" },
  ];

  // Load query history when user changes
  useEffect(() => {
    async function loadQueryHistory() {
      if (!user) {
        setQueryHistory([]);
        return;
      }

      try {
        const history = await fetchQueryHistory(user.id, 4, undefined, showFavorites);
        setQueryHistory(history);
      } catch (error) {
        console.error('Error loading query history:', error);
      }
    }

    loadQueryHistory();
  }, [user, showFavorites]);

  const handleSettingsClick = () => {
    if (user) {
      router.push("/settings");
    } else {
      router.push("/login");
    }
  };

  const handleQueryClick = (query: QueryHistory) => {
    // Navigate to visualize page with the query pre-filled
    router.push(`/visualize?query=${encodeURIComponent(query.query_text)}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">
            Prompt Lens
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
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
            );
          })}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-sidebar-foreground">
              {showFavorites ? 'Favorite Queries' : 'Recent Queries'}
            </h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setShowFavorites(!showFavorites)}
                title={showFavorites ? 'Show all queries' : 'Show favorites only'}
              >
                <Star className={`w-3 h-3 ${showFavorites ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Add new query"
                onClick={() => router.push('/visualize')}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {queryHistory.length > 0 ? (
              queryHistory.map((query) => (
                <div
                  key={query.id}
                  className="p-2 rounded-md bg-sidebar-accent/50 cursor-pointer hover:bg-sidebar-accent group"
                  onClick={() => handleQueryClick(query)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-sidebar-foreground line-clamp-2">
                        {query.query_text}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {query.chart_type && (
                          <Badge variant="secondary" className="text-xs">
                            {query.chart_type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(query.last_used_at)}
                        </span>
                        {query.usage_count > 1 && (
                          <span className="text-xs text-muted-foreground">
                            ({query.usage_count}x)
                          </span>
                        )}
                      </div>
                    </div>
                    {query.is_favorite && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  {showFavorites ? 'No favorite queries yet' : 'No recent queries'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start asking questions to see them here
                </p>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : user ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Signed in as {user.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground"
              onClick={handleSettingsClick}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground"
            onClick={handleSettingsClick}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
}
