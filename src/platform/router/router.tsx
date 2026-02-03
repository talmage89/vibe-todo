import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppLayout } from "~/components/layout/app-layout";
import { Login } from "~/features/auth/login";
import { Tmp } from "~/features/tmp";
import { ProtectedRoute } from "~/platform/auth/protected-route";

const RootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const LoginRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/login",
  component: Login,
});

const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Tmp />
      </AppLayout>
    </ProtectedRoute>
  ),
});

export const routeTree = RootRoute.addChildren([IndexRoute, LoginRoute]);

export const createAppRouter = (url: string) =>
  createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
  });

export type AppRouter = ReturnType<typeof createAppRouter>;
