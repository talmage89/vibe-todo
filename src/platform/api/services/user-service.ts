import { db } from "~/platform/db";
import type { DefaultView, Theme } from "~/platform/db/generated";

type UpdateUserData = {
  name?: string | null;
  theme?: Theme;
  defaultView?: DefaultView;
  defaultProjectId?: string | null;
};

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

export async function updateUser(userId: string, data: UpdateUserData) {
  return db.user.update({
    where: { id: userId },
    data: {
      name: data.name !== undefined ? data.name?.trim() || null : undefined,
      theme: data.theme,
      defaultView: data.defaultView,
      defaultProjectId: data.defaultProjectId,
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
