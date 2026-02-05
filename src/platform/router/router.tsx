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
import { ProjectSettings } from "~/features/project/project-settings";
import { ProjectView } from "~/features/project/project-view";
import { Settings } from "~/features/settings/settings";
import { isSettingsSection, type SettingsSearch } from "~/features/settings/types";
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

const ProjectRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/project/$projectId",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <ProjectView />
      </AppLayout>
    </ProtectedRoute>
  ),
});

const ProjectSettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/project/$projectId/settings",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <ProjectSettings />
      </AppLayout>
    </ProtectedRoute>
  ),
});

const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/settings",
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    section: isSettingsSection(search.section) ? search.section : undefined,
  }),
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Settings />
      </AppLayout>
    </ProtectedRoute>
  ),
});

export const routeTree = RootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  ProjectRoute,
  ProjectSettingsRoute,
  SettingsRoute,
]);

export const createAppRouter = (url: string) =>
  createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
  });

export type AppRouter = ReturnType<typeof createAppRouter>;
