import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-md relative z-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row md:py-12">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <div className="flex items-center gap-2">
            <img src="/assets/logos/logo_orbynex_horizontal_oscuro_v2.png" alt="Orbynex" className="h-6 opacity-70 grayscale hover:grayscale-0 transition-all dark:hidden" />
            <img src="/assets/logos/logo_orbynex_horizontal_blanco_v2.png" alt="Orbynex" className="h-6 opacity-70 grayscale hover:grayscale-0 transition-all hidden dark:block" />
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
            Impulsa tus ventas con el sistema de cotizaciones más avanzado y profesional.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 md:items-end">
          <p className="text-sm text-muted-foreground font-medium">
            &copy; {currentYear} Orbynex Digital.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-electric-blue transition-colors">Privacidad</Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-electric-blue transition-colors">Términos</Link>
            <a href="mailto:contacto@orbynexdigital.cl" className="text-sm text-muted-foreground hover:text-electric-blue transition-colors">Soporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
