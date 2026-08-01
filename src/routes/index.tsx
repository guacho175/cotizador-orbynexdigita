import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CloudOff, FileText, Sparkles, ShieldCheck, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/panel" });
  },
  head: () => ({
    meta: [
      { title: "Cotiza — Cotizaciones profesionales sin conexión" },
      {
        name: "description",
        content:
          "Crea cotizaciones profesionales en PDF, gestiona clientes y trabaja sin conexión con sincronización automática.",
      },
      { property: "og:title", content: "Cotiza — Cotizaciones profesionales sin conexión" },
      {
        property: "og:description",
        content:
          "Cotizaciones en PDF de varias páginas, asistente de redacción con IA y modo offline instalable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileText,
    title: "PDF dinámico",
    text: "Documentos vectoriales de varias páginas, con numeración correlativa y totales calculados en el dispositivo.",
  },
  {
    icon: CloudOff,
    title: "Funciona sin conexión",
    text: "Instálala como app: crea y edita cotizaciones offline y todo se sincroniza al recuperar la señal.",
  },
  {
    icon: Sparkles,
    title: "Asistente de redacción",
    text: "Mejora la redacción y corrige la ortografía de cada producto. La IA nunca toca los montos.",
  },
  {
    icon: ShieldCheck,
    title: "Datos privados",
    text: "Cada cuenta ve solo su información, protegida con reglas de seguridad a nivel de base de datos.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="py-12 md:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Sistema de cotizaciones inteligentes
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Cotizaciones profesionales en minutos, 100% offline.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Registra tus productos, crea cotizaciones impecables sin necesidad de conexión y deja que todo se sincronice automáticamente cuando vuelves a tener señal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Crear cuenta gratis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Ya tengo cuenta</Link>
            </Button>
          </div>
          <div className="mt-8 max-w-md">
            <InstallPrompt />
          </div>

          <div className="mt-8">
            <Alert className="border-primary/50 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-semibold">Uso Offline</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Todas las funcionalidades base operan 100% sin conexión. El asistente de Inteligencia Artificial es la única característica que requiere una conexión a internet activa para generar textos.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-border bg-card p-5">
              <feature.icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
            </article>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
