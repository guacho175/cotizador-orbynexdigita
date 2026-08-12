import { Link } from "@tanstack/react-router";

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
    <footer className="relative z-10 bg-deep-space text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
        {/* Main grid */}
        <div className="grid gap-10 border-t border-white/[0.12] pt-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          {/* Column 1 — Brand */}
          <div>
            <img
              src="/assets/logos/logo_orbynex_horizontal_blanco_v2.png"
              alt="Orbynex Digital"
              width={184}
              height={53}
              className="h-auto w-44"
            />
            <p className="mt-2 text-sm font-semibold tracking-wide text-electric-cyan/90">
              Cotizador Digital
            </p>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/[0.68]">
              Crea cotizaciones profesionales de forma rápida y sencilla. Diseñado para equipos de
              ventas que exigen velocidad y excelencia.
            </p>
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
