import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useRouter } from "@tanstack/react-router";
import { Flag, Home, LogOut, Shield, User } from "lucide-react";
import { useIsAdmin } from "../hooks/useQueries";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-card border-b border-border shadow-sm"
        data-ocid="nav"
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <Flag className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">
              <span className="text-primary">Chr</span>
              <span className="text-secondary">pz</span>
            </span>
          </Link>

          {/* Nav + Auth */}
          <div className="flex items-center gap-1">
            {identity && (
              <>
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      currentPath === to
                        ? "text-primary bg-primary/8"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted",
                    )}
                    data-ocid={`nav-${label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clear()}
                  className="ml-1 text-foreground/60 hover:text-foreground"
                  aria-label="Logout"
                  data-ocid="nav-logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
