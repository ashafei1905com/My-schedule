import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-panel">
        <p className="text-[11px] font-medium tracking-wide text-fg-subtle uppercase">Smart Schedule</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Open your week</h1>
        <p className="mt-2 text-sm text-fg-muted">Your schedule follows you across devices.</p>
        <div className="mt-6 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-fg-muted">Sign-in is disabled.</p>
          )}
        </div>
        <Link to="/" className="mt-5 block text-center text-sm text-fg-muted hover:text-fg">
          Continue as guest
        </Link>
      </div>
    </main>
  );
}
