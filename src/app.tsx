import { RouterProvider } from "@tanstack/react-router";
import { ToastProvider } from "~/components/ui/toast";
import type { AppRouter } from "~/platform/router/router";
import { ThemeProvider } from "~/platform/theme/theme-provider";

export const App = ({ router }: { router: AppRouter }) => (
  <ThemeProvider>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </ThemeProvider>
);
