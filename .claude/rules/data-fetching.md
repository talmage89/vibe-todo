# Data fetching

All client-side data fetching and mutations use **TanStack Query** (`@tanstack/react-query`). Do NOT use raw `fetch` + `useState`/`useEffect` patterns in hooks or components.

## Core modules

- `~/platform/query/api` — typed `api<T>(url, init?)` wrapper around `fetch`. Handles JSON headers and error parsing. Use this instead of raw `fetch`.
- `~/platform/query/query-keys` — centralized query key factory (`queryKeys`). All query keys MUST be defined here.
- `~/platform/query/query-client` — singleton `QueryClient`, provided via `<QueryClientProvider>` in `app.tsx`.

## Patterns

### Queries

Use `useQuery` for all GET requests:

```ts
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.things.all,
  queryFn: () => api<ThingsResponse>("/api/things"),
  select: (data) => data.things,
});
```

- Define a response interface (e.g. `ThingsResponse`) for the raw API shape.
- Use `select` to unwrap the response envelope.
- Alias `isLoading` → `loading` and `error` → local name at destructure to preserve hook return signatures.
- Use `enabled` to conditionally skip queries (e.g. `enabled: !!taskId`).

### Mutations

Use `useMutation` for all POST/PATCH/DELETE requests:

```ts
const mutation = useMutation({
  mutationFn: (input: Input) => api<Response>(url, { method: "POST", body: JSON.stringify(input) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.things.all });
  },
});
```

- Invalidate related queries in `onSuccess` so lists stay fresh.
- For optimistic updates (e.g. drag-to-reorder), use `onMutate` to set cache, `onError` to rollback, and `onSettled` to invalidate.
- For detail views, use `queryClient.setQueryData` in `onSuccess` to update the cache immediately when the server returns the updated entity.
- Expose async wrapper functions (e.g. `createThing`, `updateThing`) that call `mutation.mutateAsync` so callers can `await` the result.

### Query keys

All keys live in `~/platform/query/query-keys`. Keys are hierarchical and nest under the parent resource:

```ts
queryKeys.projects.all              // ["projects"]
queryKeys.projects.detail(id)       // ["projects", id]
queryKeys.tasks.all(projectId)      // ["projects", projectId, "tasks"]
queryKeys.tasks.detail(pid, tid)    // ["projects", projectId, "tasks", taskId]
```

When adding a new resource, add its keys to the `queryKeys` object following this nesting convention.

## Don'ts

- Do NOT use `useState` + `useEffect` + `fetch` for data loading. Use `useQuery`.
- Do NOT use `useCallback`-wrapped fetch functions for mutations. Use `useMutation`.
- Do NOT manage `loading`/`error` state manually. TanStack Query handles this.
- Do NOT call `refetch` imperatively after mutations. Invalidate queries instead.
- Do NOT set `Content-Type` headers manually. The `api()` helper sets them.
