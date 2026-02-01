import { createRootRoute, createRouter } from "@tanstack/react-router";
import { Tmp } from "~/features/tmp";
import { AuthProvider, ProtectedRoute } from "~/platform/auth";

// Root route with AuthProvider
const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <ProtectedRoute>
        <Tmp />
      </ProtectedRoute>
    </AuthProvider>
  ),
});

// Create router with single root route
// All content is protected by default
export const router = createRouter({
  routeTree: rootRoute,
});

// Type declaration for router
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
