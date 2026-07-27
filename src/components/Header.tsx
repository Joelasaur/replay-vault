import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header
      data-testid="site-header"
      className="border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-40"
    >
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          data-testid="brand-link"
          className="font-display text-lg font-semibold tracking-tight"
        >
          <span style={{ color: "var(--color-primary)" }}>Replay</span>Vault
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/replays" data-testid="nav-replays" className="hover:text-primary">
            Browse
          </Link>
          <Link to="/replays/new" data-testid="nav-submit" className="hover:text-primary">
            Submit
          </Link>
          {loading ? (
            <span className="text-muted-foreground text-xs">…</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span data-testid="user-email" className="text-muted-foreground text-xs">
                {user.email}
              </span>
              <button
                data-testid="sign-out"
                onClick={signOut}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface-2"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              data-testid="nav-signin"
              className="rounded-md px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
