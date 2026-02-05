import { Elysia } from "elysia";
import { authMiddleware, requireAuth } from "~/platform/auth/middleware";

export const userRoutes = new Elysia().use(authMiddleware).get("/me", ({ user }) => {
  const authenticatedUser = requireAuth(user);
  return {
    success: true,
    user: {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      avatar: authenticatedUser.avatar,
      createdAt: authenticatedUser.createdAt,
    },
  };
});
