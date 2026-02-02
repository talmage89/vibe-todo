import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "./use-auth";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Path to redirect to when user is not authenticated.
   * Defaults to "/login"
   */
  redirectTo?: string;
}

/**
 * Wrapper component that protects routes by checking authentication status.
 * Redirects to login page if user is not authenticated.
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({ children, redirectTo = "/login" }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: redirectTo });
    }
  }, [user, loading, redirectTo, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, show nothing while redirecting
  if (!user) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
};
