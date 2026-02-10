import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "~/platform/db/generated";
import { queryKeys } from "~/platform/query/query-keys";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/me");

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  const data = await response.json();
  return data.success && data.user ? data.user : null;
}

export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: fetchUser,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.user, null);
    },
  });

  return {
    user: user ?? null,
    loading,
    error: queryError?.message ?? logoutMutation.error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
  };
};
