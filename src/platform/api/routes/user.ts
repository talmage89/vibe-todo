import { Elysia } from "elysia";
import { z } from "zod";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";

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
    },
  };
}

const updateMeSchema = z.object({
  name: z.union([z.string(), z.null()]).optional(),
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
    },
  };
}

async function deleteMeHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);

  await db.user.delete({
    where: { id: authenticatedUser.id },
  });

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
