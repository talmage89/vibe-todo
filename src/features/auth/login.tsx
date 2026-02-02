/**
 * Login page with OAuth provider buttons.
 * Users are redirected here when accessing protected routes while unauthenticated.
 */
import { GitHubLogo, GoogleLogo } from "~/features/auth/oauth-icons";

export const Login = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface p-8">
        <div className="text-center">
          <h1 className="font-semibold text-2xl text-primary">Welcome to Todo</h1>
          <p className="mt-2 text-secondary text-sm">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <a
            href="/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 font-medium text-primary text-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2"
          >
            <GoogleLogo className="h-5 w-5" />
            Continue with Google
          </a>

          <a
            href="/auth/github"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 font-medium text-primary text-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2"
          >
            <GitHubLogo className="h-5 w-5" />
            Continue with GitHub
          </a>
        </div>

        <p className="text-center text-secondary text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
