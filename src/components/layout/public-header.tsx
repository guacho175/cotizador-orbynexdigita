import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
      <div className="flex items-center gap-2">
        <img src="/icons/icon-192.png" alt="Cotiza Icon" width={32} height={32} className="rounded-lg" />
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight leading-none">Cotiza</span>
          <a
            href="https://orbynexdigital.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
          >
            by Orbynex Digital
          </a>
        </div>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/auth">Entrar</Link>
      </Button>
    </header>
  );
}
