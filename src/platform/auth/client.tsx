import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider that checks authentication status on mount.
 * Fetches current user from /api/me endpoint.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check authentication");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return <AuthContext.Provider value={{ user, loading, error }}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access auth context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * Component that protects routes requiring authentication.
 * Redirects to Google OAuth if user is not authenticated.
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to Google OAuth
      window.location.href = "/auth/google";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-base text-color-secondary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
