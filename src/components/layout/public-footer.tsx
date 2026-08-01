import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 py-8 md:flex-row md:py-12">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="Cotiza Icon" width={24} height={24} className="rounded-md grayscale opacity-80" />
            <span className="text-base font-semibold tracking-tight text-foreground/80">Cotiza</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            La herramienta offline-first para cotizaciones profesionales.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 md:items-end">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Cotiza. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Desarrollado con ❤️ por{" "}
            <a
              href="https://orbynexdigital.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Orbynex Digital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
