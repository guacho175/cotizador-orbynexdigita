import { Link } from "@tanstack/react-router";
import { DigitalRain } from "@/components/ui/digital-rain";

const PRODUCT_LINKS = [
  { label: "Características", href: "/#features" },
  { label: "Iniciar sesión", to: "/auth" },
  { label: "Crear cuenta", to: "/auth" },
] as const;

const COMPANY_LINKS = [
  { label: "Sitio web", href: "https://orbynexdigital.cl", external: true },
  { label: "Soporte", href: "mailto:contacto@orbynexdigital.cl" },
] as const;

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 overflow-hidden bg-deep-space text-white">
      {/* Efecto de lluvia de luz tecnológica */}
      <DigitalRain
        density={0.045}
        speed={1.0}
        dropLength={32}
        maxOpacity={0.4}
        showSplashes={true}
        colors={["#00D4FF", "#1463FF", "#D946EF", "#60A5FA", "#A855F7"]}
      />

      {/* Orlas de luz ambiental */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-electric-blue/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-magenta-pulse/10 blur-[130px]" />

      {/* Divisor superior con láser de gradiente */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-electric-cyan/80 via-magenta-pulse/60 to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-electric-cyan/5 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
        {/* Main grid */}
        <div className="grid gap-10 border-t border-white/[0.08] pt-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          {/* Column 1 — Brand */}
          <div>
            <Link to="/" className="inline-block" aria-label="Inicio">
              <img
                src="/assets/logos/logo_orbynex_horizontal_blanco_v2_trim.png"
                alt="Orbynex Digital"
                width={618}
                height={198}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-2 text-sm font-semibold tracking-wide text-electric-cyan/90">
              Cotizador Digital
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/[0.68]">
              Crea cotizaciones profesionales de alto nivel, opera 100% offline y acelera el cierre de negocios para tu empresa.
            </p>

            {/* Badge de estado en tiempo real */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Sistemas 100% operativos &middot; Chile</span>
            </div>
          </div>

          {/* Column 2 — Product */}
          <nav aria-label="Enlaces del producto">
            <h2 className="font-display text-base font-semibold text-white">
              Producto
            </h2>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((item) =>
                "to" in item ? (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-white/[0.68] transition hover:text-electric-cyan"
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-white/[0.68] transition hover:text-electric-cyan"
                    >
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>

          {/* Column 3 — Company */}
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Orbynex Digital
            </h2>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={"external" in item ? "_blank" : undefined}
                    rel={"external" in item ? "noreferrer" : undefined}
                    className="text-sm text-white/[0.68] transition hover:text-electric-cyan"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.1] pt-6 text-xs text-white/[0.54] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Orbynex Digital. Todos los derechos reservados.</p>
          <p>Producto desarrollado por Orbynex Digital</p>
        </div>
      </div>
    </footer>
  );
}
