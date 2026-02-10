import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ToastProvider } from "~/components/ui/toast";
import { queryClient } from "~/platform/query/query-client";
import type { AppRouter } from "~/platform/router/router";
import { ThemeProvider } from "~/platform/theme/theme-provider";

export const App = ({ router }: { router: AppRouter }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
