import { Home, Layers, LogOut, ReceiptText, ScrollText } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { getStoredTheme, setTheme, type Theme } from "@/utils/theme";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/categories", label: "Categories", icon: Layers },
  { to: "/reports", label: "Reports", icon: ScrollText },
];

export function AppShell(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [theme, setCurrentTheme] = useState<Theme>(() => getStoredTheme());

  function toggleTheme(): void {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setCurrentTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border/70 bg-card/50 p-5 backdrop-blur md:flex md:flex-col md:gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Finance OS</p>
          <h1 className="mt-2 text-xl font-semibold">pFtracker</h1>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors",
                  isActive ? "bg-primary/20 text-foreground" : "hover:bg-accent/30 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-border/70 bg-background/40 p-3">
          <p className="truncate text-sm text-foreground">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="mt-3 w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="sticky top-0 z-10 hidden items-center justify-end border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur md:flex">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <p className="text-sm font-semibold">pFtracker</p>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-border/70 bg-background/55 px-3 py-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                  isActive ? "bg-primary/20 text-foreground" : "bg-transparent text-muted-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
