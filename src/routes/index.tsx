import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CloudOff, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/layout/install-prompt";

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
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-semibold tracking-tight">Cotiza</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="py-12 md:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Sistema de cotizaciones inteligentes
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Cotizaciones profesionales en minutos, incluso sin internet.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Registra tus productos, deja que el asistente pula la redacción y entrega un PDF impecable
            con tus datos de transferencia y numeración correlativa.
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
    </div>
  );
}
