import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-x-0 border-t-0 border-b border-white/20 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <img src="/assets/logos/logo_orbynex_horizontal_oscuro_v2.png" alt="Orbynex Cotizador" className="h-7 dark:hidden" />
            <img src="/assets/logos/logo_orbynex_horizontal_blanco_v2.png" alt="Orbynex Cotizador" className="h-7 hidden dark:block" />
          </Link>
          <div className="hidden h-6 w-[1px] bg-border md:block" />
          <span className="hidden text-sm font-semibold text-muted-foreground md:block">Cotizador Digital</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Iniciar sesión
          </Link>
          <Button asChild className="bg-electric-glow rounded-full px-6 font-semibold border-none text-white h-10">
            <Link to="/auth">Comenzar gratis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
