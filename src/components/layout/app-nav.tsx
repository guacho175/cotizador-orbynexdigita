import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, LayoutDashboard, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/negocio", label: "Negocio", icon: Building2 },
] as const;

export function AppNav({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (variant === "bottom") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <link.icon className="size-5" aria-hidden />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="hidden md:block">
      <ul className="space-y-1">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.to);
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <link.icon className="size-4" aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
