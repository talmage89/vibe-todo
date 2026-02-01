import { RouterProvider } from "@tanstack/react-router";
import { router } from "~/platform/router";

export const App = () => {
  return <RouterProvider router={router} />;
};
