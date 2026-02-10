import { useCallback, useState } from "react";
import { useAuth } from "~/platform/auth/use-auth";
import { DefaultView } from "~/platform/db/generated";

const STORAGE_PREFIX = "project-view-";

function getStoredView(projectId: string): DefaultView | null {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
  if (stored === DefaultView.LIST || stored === DefaultView.KANBAN) {
    return stored as DefaultView;
  }
  return null;
}

export function useProjectView(projectId: string) {
  const { user } = useAuth();
  const fallback = user?.defaultView ?? DefaultView.LIST;

  const [view, setViewState] = useState<DefaultView>(() => getStoredView(projectId) ?? fallback);

  const setView = useCallback(
    (next: DefaultView) => {
      setViewState(next);
      localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, next);
    },
    [projectId],
  );

  return { view, setView } as const;
}
