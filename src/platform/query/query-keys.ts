export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  tasks: {
    all: (projectId: string) => ["projects", projectId, "tasks"] as const,
    list: (projectId: string, filters: Record<string, unknown>) =>
      ["projects", projectId, "tasks", "list", filters] as const,
    detail: (projectId: string, taskId: string) =>
      ["projects", projectId, "tasks", taskId] as const,
  },
  crossProjectTasks: {
    inbox: ["tasks", "inbox"] as const,
    today: ["tasks", "today"] as const,
    overdue: ["tasks", "overdue"] as const,
    upcoming: ["tasks", "upcoming"] as const,
  },
  tags: {
    all: (projectId: string) => ["projects", projectId, "tags"] as const,
  },
  search: {
    results: (query: string, filters?: Record<string, unknown>) =>
      ["search", query, filters] as const,
  },
  auth: {
    user: ["auth", "user"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
  },
};
