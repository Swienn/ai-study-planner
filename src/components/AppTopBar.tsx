import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Logo from "@/components/Logo";

export default async function AppTopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm flex-shrink-0 z-10">
      <Logo href="/calendar" size="sm" />

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user.email}
          </span>
        )}
        <Link
          href="/account"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
        >
          Account
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
