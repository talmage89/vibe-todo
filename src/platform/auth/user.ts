import { db } from "~/platform/db";
import type { AccountProvider, Prisma } from "~/platform/db/generated";

export type UpsertAccountData = Pick<
  Prisma.AccountCreateInput,
  "provider" | "providerId" | "accessToken" | "refreshToken" | "expiresAt"
>;

export type UpsertUserData = Pick<Prisma.UserCreateInput, "email" | "name" | "avatar">;

type Account = Prisma.AccountGetPayload<{ select: typeof upsertAccountSelect }>;

const upsertAccountSelect = {
  id: true,
  userId: true,
} satisfies Prisma.AccountSelect;

export const upsertAccount = async (
  accountData: UpsertAccountData,
  userData: UpsertUserData,
): Promise<Account> => {
  return (
    (await findExistingAccount(accountData.provider, accountData.providerId)) ??
    (await createAccountWithPotentialUser(accountData, userData))
  );
};

const findExistingAccount = async (
  provider: AccountProvider,
  providerId: string,
): Promise<Account | null> => {
  const whereProviderAccountId: Prisma.AccountWhereUniqueInput = {
    provider_providerId: { provider, providerId },
  };

  return await db.account.findUnique({
    where: whereProviderAccountId,
    select: upsertAccountSelect,
  });
};

const createAccountWithPotentialUser = async (
  accountData: UpsertAccountData,
  userData: UpsertUserData,
): Promise<Account> => {
  const user = await upsertUser(userData);

  const createAccountData: Prisma.AccountCreateInput = {
    ...accountData,
    user: { connect: { id: user.id } },
  };

  return await db.account.create({
    data: createAccountData,
    select: upsertAccountSelect,
  });
};

type User = Prisma.UserGetPayload<{ select: typeof upsertUserSelect }>;

const upsertUserSelect = {
  id: true,
  email: true,
  name: true,
} satisfies Prisma.UserSelect;

export const upsertUser = async (userData: UpsertUserData): Promise<User> => {
  const existingUser = await db.user.findUnique({
    where: { email: userData.email },
    select: upsertUserSelect,
  });

  if (existingUser) {
    return existingUser;
  }

  return await db.user.create({
    data: userData,
    select: upsertUserSelect,
  });
};
