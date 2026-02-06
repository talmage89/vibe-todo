import { Elysia } from "elysia";
import type { Cookie } from "elysia/cookies";
import { z } from "zod";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "~/platform/auth/session";
import { db } from "~/platform/db";
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

  const updatedUser = await db.user.update({
    where: { id: authenticatedUser.id },
    data: {
      ...(body.name !== undefined && { name: body.name?.trim() || null }),
      ...(body.theme !== undefined && { theme: body.theme }),
      ...(body.defaultView !== undefined && { defaultView: body.defaultView }),
      ...(body.defaultProjectId !== undefined && { defaultProjectId: body.defaultProjectId }),
    },
  });

  return {
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      theme: updatedUser.theme,
      defaultView: updatedUser.defaultView,
      defaultProjectId: updatedUser.defaultProjectId,
    },
  };
}

async function deleteMeHandler({
  user,
  cookie,
}: {
  user: AuthUser | undefined;
  cookie: Record<string, Cookie<unknown>>;
}) {
  const authenticatedUser = requireAuth(user);

  await db.user.delete({
    where: { id: authenticatedUser.id },
  });

  cookie[SESSION_COOKIE_NAME]?.set(clearSessionCookie());

  return { success: true };
}

async function getAccountsHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);

  const accounts = await db.account.findMany({
    where: { userId: authenticatedUser.id },
    select: {
      id: true,
      provider: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return { success: true, accounts };
}

async function exportDataHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);

  const userData = await db.user.findUnique({
    where: { id: authenticatedUser.id },
    include: {
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        },
      },
      projects: {
        include: {
          sections: true,
          tasks: {
            include: {
              subtasks: true,
              tags: true,
            },
          },
          tags: true,
        },
      },
    },
  });

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
