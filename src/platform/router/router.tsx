import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppLayout } from "~/components/layout/app-layout";
import { Login } from "~/features/auth/components/login";
import { InboxView } from "~/features/inbox/components/inbox-view";
import { ProjectSettings } from "~/features/projects/components/project-settings";
import { ProjectView } from "~/features/projects/components/project-view";
import { SearchView } from "~/features/search/components/search-view";
import { Settings } from "~/features/settings/components/settings";
import { isSettingsSection, type SettingsSearch } from "~/features/settings/types";
import { Tmp } from "~/features/tmp/index";
import { TodayView } from "~/features/today/components/today-view";
import { UpcomingView } from "~/features/upcoming/components/upcoming-view";
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
        <InboxView />
      </AppLayout>
    </ProtectedRoute>
  ),
});

const TodayRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/today",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <TodayView />
      </AppLayout>
    </ProtectedRoute>
  ),
});

const UpcomingRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/upcoming",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <UpcomingView />
      </AppLayout>
    </ProtectedRoute>
  ),
});

const SearchRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/search",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <SearchView />
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

const TmpRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/_tmp",
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Tmp />
      </AppLayout>
    </ProtectedRoute>
  ),
});

export const routeTree = RootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  TodayRoute,
  UpcomingRoute,
  SearchRoute,
  ProjectRoute,
  ProjectSettingsRoute,
  SettingsRoute,
  TmpRoute,
]);

export const createAppRouter = (url: string) =>
  createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
  });

export type AppRouter = ReturnType<typeof createAppRouter>;
