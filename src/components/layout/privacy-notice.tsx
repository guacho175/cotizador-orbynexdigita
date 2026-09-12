import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "orbynex_privacy_notice_ack";

export function PrivacyNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const acknowledged = localStorage.getItem(STORAGE_KEY);
      if (!acknowledged) {
        setIsVisible(true);
      }
    } catch {
      // localStorage puede no estar disponible en modo incógnito estricto
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignorar errores de almacenamiento local
    }
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <aside
      aria-label="Aviso de privacidad y análisis"
      className="fixed bottom-16 left-4 right-4 z-50 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm rounded-xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-semibold text-foreground">Aviso de análisis y mejora de experiencia</p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Utilizamos tecnologías de análisis estadístico y cookies para comprender el uso del
            cotizador y optimizar tu experiencia en la plataforma, conforme a la normativa chilena
            de privacidad (Ley N° 19.628).
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs px-3 font-medium"
              onClick={handleDismiss}
            >
              Entendido
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 rounded-md"
          aria-label="Cerrar aviso de privacidad"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
