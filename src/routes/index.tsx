import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CloudOff, FileText, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

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
    title: "Cotizaciones de Alto Impacto",
    text: "Genera propuestas comerciales en formato PDF interactivo con diseños profesionales que aceleran el cierre de ventas.",
  },
  {
    icon: CloudOff,
    title: "100% Offline-First",
    text: "Continúa trabajando sin internet. Sincronización automática de datos y cotizaciones al recuperar la conexión.",
  },
  {
    icon: Sparkles,
    title: "Redacción Asistida por IA",
    text: "Optimiza la descripción de tus servicios con inteligencia artificial para lograr un tono más persuasivo y profesional.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad y Privacidad",
    text: "Tus datos comerciales están protegidos con encriptación y aislamiento por empresa usando Supabase RLS.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-electric-blue/30 overflow-x-hidden">
      {/* Luces líquidas de fondo */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply dark:mix-blend-screen">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric-blue/20 blur-[120px]" />
        <div className="absolute right-[-5%] top-[20%] h-[60vh] w-[40vw] rounded-full bg-neon-purple/10 blur-[150px]" />
      </div>

      <PublicHeader />

      <main className="relative z-10 pt-24 pb-20">
        <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-blue/30 bg-electric-blue/10 px-4 py-1.5 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-electric-blue animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-electric-blue">
                Cotizador Orbynex v2.0
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Cierra más tratos con <br className="hidden md:block" />
              <span className="text-gradient">Cotizaciones Impecables</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
              La plataforma definitiva para crear, enviar y gestionar propuestas comerciales profesionales en minutos. Diseñado para equipos de ventas que exigen velocidad y excelencia.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-electric-glow h-14 rounded-full px-8 text-lg font-semibold border-none w-full sm:w-auto text-white">
                <Link to="/auth">
                  Comenzar ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-8 text-lg font-semibold bg-white/50 dark:bg-black/20 backdrop-blur-md border-border hover:bg-white dark:hover:bg-black w-full sm:w-auto">
                <Link to="/auth">Ver demostración</Link>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-electric-blue" /> Sin tarjeta de crédito</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-electric-blue" /> Configuración en 1 min</span>
            </div>
          </div>

          {/* Hero Mockup */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="glass relative rounded-2xl p-2 shadow-2xl">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-white/20 to-transparent opacity-50" />
              <img 
                src="/assets/images/hero_mockup.png" 
                alt="Panel de Cotizador Orbynex" 
                className="relative block w-full rounded-xl border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Todo lo que necesitas para vender más</h2>
            <p className="mt-4 text-muted-foreground">Herramientas diseñadas específicamente para agilizar tu proceso comercial.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="glass rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl group border border-white/20">
                <div className="mb-6 inline-flex rounded-xl bg-electric-blue/10 p-3 text-electric-blue transition-colors group-hover:bg-electric-blue group-hover:text-white">
                  <feature.icon className="size-6" strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* PWA Section */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="glass flex flex-col items-center justify-between gap-8 rounded-3xl p-8 md:flex-row md:p-12 border-white/20 shadow-2xl">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-2xl font-bold mb-4">Lleva el cotizador contigo</h3>
              <p className="text-muted-foreground mb-6">Instala nuestra aplicación web progresiva y genera cotizaciones donde sea, incluso sin internet.</p>
              <InstallPrompt />
            </div>
            <div className="relative w-full max-w-xs md:max-w-sm">
              <div className="absolute inset-0 rounded-full bg-electric-blue/20 blur-3xl" />
              <div className="glass relative flex h-48 w-full items-center justify-center rounded-2xl border-white/20">
                 <CloudOff className="h-16 w-16 text-electric-blue/50" />
                 <span className="absolute bottom-6 font-mono text-sm font-semibold text-foreground/70">OFFLINE READY</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <PublicFooter />
    </div>
  );
}
