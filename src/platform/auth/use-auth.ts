import { useCallback, useEffect, useState } from "react";
import type { User } from "~/platform/db/generated";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/me");

      if (response.status === 401) {
        setState({ user: null, loading: false, error: null });
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.user) {
        setState({ user: data.user, loading: false, error: null });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user";
      setState({ user: null, loading: false, error: errorMessage });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }
      setState({ user: null, loading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    refetch: fetchUser,
    logout,
  };
};
