import { useQuery } from "@tanstack/react-query";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AccountProvider } from "~/platform/db/generated";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";

interface Account {
  id: string;
  provider: AccountProvider;
  createdAt: string;
}

interface AccountsResponse {
  accounts: Account[];
}

const PROVIDER_CONFIG: Record<AccountProvider, { name: string; icon: string }> = {
  [AccountProvider.GOOGLE]: { name: "Google", icon: "G" },
  [AccountProvider.GITHUB]: { name: "GitHub", icon: "GH" },
};

function AccountItem({ account }: { account: Account }) {
  const config = PROVIDER_CONFIG[account.provider];

  return (
    <div className="flex items-center justify-between rounded border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-background font-medium text-primary text-sm">
          {config.icon}
        </div>
        <div>
          <p className="font-medium text-primary text-sm">{config.name}</p>
          <p className="text-secondary text-xs">
            Connected {new Date(account.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ConnectedAccountsSection() {
  const { data: accounts = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => api<AccountsResponse>("/api/accounts"),
    select: (data) => data.accounts,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connected Accounts</CardTitle>
        <CardDescription>Manage your linked authentication providers.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-secondary text-sm">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="text-secondary text-sm">No connected accounts.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountItem key={account.id} account={account} />
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <p className="font-medium text-primary text-sm">Connect another account</p>
          <div className="flex gap-2">
            <a
              href="/auth/google"
              className={buttonVariants({ variant: "outline", className: "flex-1" })}
            >
              Google
            </a>
            <a
              href="/auth/github"
              className={buttonVariants({ variant: "outline", className: "flex-1" })}
            >
              GitHub
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
