import { db } from "~/platform/db";
import type { DefaultView, Theme } from "~/platform/db/generated";

const userSelectFields = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  createdAt: true,
  theme: true,
  defaultView: true,
  defaultProjectId: true,
} as const;

export async function updateUser(
  userId: string,
  data: {
    name?: string | null;
    theme?: Theme;
    defaultView?: DefaultView;
    defaultProjectId?: string | null;
  },
) {
  return db.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name?.trim() || null }),
      ...(data.theme !== undefined && { theme: data.theme }),
      ...(data.defaultView !== undefined && { defaultView: data.defaultView }),
      ...(data.defaultProjectId !== undefined && {
        defaultProjectId: data.defaultProjectId,
      }),
    },
    select: userSelectFields,
  });
}

export async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } });
}

export async function listAccounts(userId: string) {
  return db.account.findMany({
    where: { userId },
    select: { id: true, provider: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function exportUserData(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      accounts: {
        select: { provider: true, createdAt: true },
      },
      projects: {
        include: {
          sections: true,
          tasks: {
            include: { subtasks: true, tags: true },
          },
          tags: true,
        },
      },
    },
  });
}
