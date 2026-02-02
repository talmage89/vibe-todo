import { RouterProvider } from "@tanstack/react-router";
import type { AppRouter } from "~/platform/router/router";

export const App = ({ router }: { router: AppRouter }) => <RouterProvider router={router} />;
