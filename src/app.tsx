import { RouterProvider } from "@tanstack/react-router";
import type { AppRouter } from "~/platform/router/router";
import { ThemeProvider } from "~/platform/theme/theme-provider";

export const App = ({ router }: { router: AppRouter }) => (
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);
