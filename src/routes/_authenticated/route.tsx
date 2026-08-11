import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/layout/app-nav";
import { SyncIndicator } from "@/components/layout/sync-indicator";
import { Button } from "@/components/ui/button";
import { startSync } from "@/lib/sync";
import { clearLocalData } from "@/lib/db";

import { initAuthState, getAuthUser } from "@/lib/auth-state";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    await initAuthState();
    const user = getAuthUser();
    
    if (!user) throw redirect({ to: "/auth" });
    
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    const stop = startSync(user.id);
    return () => stop();
  }, [user.id]);

  async function signOut() {
    await supabase.auth.signOut();
    await clearLocalData();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <Link to="/panel" className="mb-8 flex items-center gap-2 px-2">
            <img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">Cotiza</span>
          </Link>
          <AppNav variant="sidebar" />
          <div className="mt-auto space-y-3">
            <Link to="/perfil" className="block truncate px-3 text-xs text-muted-foreground hover:text-foreground hover:underline">
              {user.email}
            </Link>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
              <LogOut className="size-4" />
              Cerrar sesión
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 md:pb-10">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
            <SyncIndicator />
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link to="/cotizaciones/nueva">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nueva cotización</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => void signOut()}
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </header>
          <main className="px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <AppNav variant="bottom" />
    </div>
  );
}
