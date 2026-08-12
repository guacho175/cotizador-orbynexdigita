import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 16);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/[0.12] bg-deep-space/[0.92] shadow-[0_18px_50px_rgb(0_0_0_/_0.18)] backdrop-blur-xl"
          : "bg-deep-space/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6">
        {/* Left — Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Inicio">
            <img
              src="/assets/logos/logo_orbynex_horizontal_blanco_v2_trim.png"
              alt="Orbynex Digital"
              width={618}
              height={198}
              className="h-10 w-auto sm:h-12"
            />
          </Link>
          <div className="hidden h-7 w-px bg-white/20 md:block" />
          <span className="hidden text-sm font-semibold tracking-wide text-white/60 md:block">
            Cotizador Digital
          </span>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/auth"
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-electric-cyan sm:inline-flex sm:items-center sm:min-h-10 sm:px-3 sm:rounded-full sm:hover:bg-white/[0.08]"
          >
            Iniciar sesión
          </Link>
          <Button
            asChild
            className="btn-orbynex-primary h-10 rounded-full border-none px-6 text-sm font-semibold text-white"
          >
            <Link to="/auth">Comenzar gratis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
