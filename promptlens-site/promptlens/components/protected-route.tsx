"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push("/login");
    }
  }, [user, loading, requireAuth, router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we check your authentication status.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (requireAuth && !user) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Redirecting to login page...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
