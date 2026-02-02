import { Login } from "~/features/auth/login";
import { Tmp } from "~/features/tmp";
import { ProtectedRoute } from "~/platform/auth/protected-route";
import { useRouter } from "~/platform/router/use-router";

export const App = () => {
  const { route } = useRouter();

  // Route to login page
  if (route === "/login") {
    return <Login />;
  }

  // All other routes are protected and require authentication
  return (
    <ProtectedRoute>
      <Tmp />
    </ProtectedRoute>
  );
};
