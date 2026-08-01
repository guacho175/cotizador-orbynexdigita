import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Briefcase, Users, FileText, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function OnboardingAlert() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const isDismissed = localStorage.getItem("onboarding_dismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <Card className="relative border-primary/20 bg-primary/5 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
      >
        <X className="size-4" />
        <span className="sr-only">Cerrar onboarding</span>
      </Button>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">¡Bienvenido a Cotiza! 👋</CardTitle>
        <CardDescription className="text-base">
          Sigue estos tres sencillos pasos para empezar a enviar cotizaciones profesionales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div className="flex flex-col gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-5" />
            </div>
            <h3 className="font-semibold">1. Mi Negocio</h3>
            <p className="text-sm text-muted-foreground">
              Configura los datos de tu empresa y sube tu logo para personalizar tus documentos.
            </p>
            <Link to="/negocio" className="mt-auto text-sm font-medium text-primary hover:underline">
              Ir a Mi Negocio &rarr;
            </Link>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <h3 className="font-semibold">2. Clientes</h3>
            <p className="text-sm text-muted-foreground">
              Agrega tu primer cliente con su información de contacto y facturación.
            </p>
            <Link to="/clientes" className="mt-auto text-sm font-medium text-primary hover:underline">
              Ir a Clientes &rarr;
            </Link>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <h3 className="font-semibold">3. Cotizaciones</h3>
            <p className="text-sm text-muted-foreground">
              Crea y envía tu primera cotización con un diseño profesional y limpio.
            </p>
            <Link to="/cotizaciones/nueva" className="mt-auto text-sm font-medium text-primary hover:underline">
              Crear Cotización &rarr;
            </Link>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleDismiss}>Entendido, ¡manos a la obra!</Button>
        </div>
      </CardContent>
    </Card>
  );
}
