import { Elysia } from "elysia";
import type { Cookie } from "elysia/cookies";
import { z } from "zod";
import * as userService from "~/platform/api/services/user-service";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "~/platform/auth/session";
import { DefaultView, Theme } from "~/platform/db/generated";

function getMeHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);
  return {
    success: true,
    user: {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      avatar: authenticatedUser.avatar,
      createdAt: authenticatedUser.createdAt,
      theme: authenticatedUser.theme,
      defaultView: authenticatedUser.defaultView,
      defaultProjectId: authenticatedUser.defaultProjectId,
    },
  };
}

const updateMeSchema = z.object({
  name: z.union([z.string(), z.null()]).optional(),
  theme: z.enum(Theme).optional(),
  defaultView: z.enum(DefaultView).optional(),
  defaultProjectId: z.union([z.string(), z.null()]).optional(),
});

type UpdateMeHandlerProps = {
  user: AuthUser | undefined;
  body: z.infer<typeof updateMeSchema>;
};

async function updateMeHandler({ user, body }: UpdateMeHandlerProps) {
  const authenticatedUser = requireAuth(user);
  const updatedUser = await userService.updateUser(authenticatedUser.id, body);
  return { success: true, user: updatedUser };
}

async function deleteMeHandler({
  user,
  cookie,
}: {
  user: AuthUser | undefined;
  cookie: Record<string, Cookie<unknown>>;
}) {
  const authenticatedUser = requireAuth(user);
  await userService.deleteUser(authenticatedUser.id);
  cookie[SESSION_COOKIE_NAME]?.set(clearSessionCookie());
  return { success: true };
}

async function getAccountsHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);
  const accounts = await userService.listAccounts(authenticatedUser.id);
  return { success: true, accounts };
}

async function exportDataHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);
  const userData = await userService.exportUserData(authenticatedUser.id);
  return {
    success: true,
    exportedAt: new Date().toISOString(),
    user: {
      email: userData?.email,
      name: userData?.name,
      theme: userData?.theme,
      defaultView: userData?.defaultView,
      createdAt: userData?.createdAt,
    },
    accounts: userData?.accounts,
    projects: userData?.projects,
  };
}

export const userRoutes = new Elysia()
  .use(authMiddleware)
  .get("/me", getMeHandler)
  .patch("/me", updateMeHandler, { body: updateMeSchema })
  .delete("/me", deleteMeHandler)
  .get("/accounts", getAccountsHandler)
  .get("/export", exportDataHandler);
