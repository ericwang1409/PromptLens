"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Sidebar } from "@/components/sidebar";
import { Copy, Eye, EyeOff, Plus, Trash2, Key, Settings } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user, signOut } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_api_keys")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    // Generate a secure API key
    const prefix = "pl_";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = prefix;
    for (let i = 0; i < 32; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const createApiKey = async () => {
    if (!user || !newKeyName.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    setCreating(true);
    try {
      const apiKey = generateApiKey();

      const { error } = await supabase.from("user_api_keys").insert({
        user_id: user.id,
        name: newKeyName.trim(),
        api_key: apiKey,
        is_active: true,
      });

      if (error) throw error;

      toast.success("API key created successfully!");
      setNewKeyName("");
      loadApiKeys();
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_api_keys")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("API key deleted successfully!");
      loadApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy API key");
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const maskApiKey = (apiKey: string) => {
    return `${apiKey.slice(0, 8)}${"*".repeat(20)}${apiKey.slice(-4)}`;
  };

  if (!user) {
    return null; // This should not happen since we're using ProtectedRoute
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account and API keys
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user.email || ""} disabled />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={user.user_metadata?.name || "Not set"}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Generate and manage API keys for accessing the PromptLens
                    API. Use these keys to authenticate with our service. You'll
                    provide your OpenAI, Anthropic, or XAI keys directly in API
                    requests.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create new API key */}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Enter API key name (e.g., 'Production App')"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createApiKey()}
                />
                <Button
                  onClick={createApiKey}
                  disabled={creating || !newKeyName.trim()}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>

              {/* API Keys List */}
              {loading ? (
                <div className="text-center py-4">Loading API keys...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys created yet</p>
                  <p className="text-sm">
                    Create your first API key to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{key.name}</h4>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {showApiKey[key.id]
                              ? key.api_key
                              : maskApiKey(key.api_key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(key.id)}
                          >
                            {showApiKey[key.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(key.api_key)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(key.created_at)}
                          {key.last_used_at && (
                            <span className="ml-4">
                              Last used: {formatDate(key.last_used_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey(key.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
