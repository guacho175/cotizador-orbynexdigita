import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  CloudOff,
  FileText,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Wifi,
} from "lucide-react";
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
      { title: "Cotizador Orbynex — Cotizaciones profesionales en PDF y Offline" },
      {
        name: "description",
        content:
          "Crea cotizaciones profesionales en PDF, gestiona clientes y opera sin conexión con sincronización automática.",
      },
      { property: "og:title", content: "Cotizador Orbynex — Cotizaciones profesionales en PDF y Offline" },
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

function Landing() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-electric-blue/30 overflow-x-hidden">
      {/* Luces líquidas de fondo */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply dark:mix-blend-screen">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric-blue/20 blur-[120px]" />
        <div className="absolute right-[-5%] top-[20%] h-[60vh] w-[40vw] rounded-full bg-neon-purple/10 blur-[150px]" />
      </div>

      <PublicHeader />

      <main className="relative z-10 pt-24 pb-16">
        {/* ================= HERO COMPACTO Y CONTUNDENTE ================= */}
        <section className="mx-auto max-w-6xl px-5 pt-8 pb-10 text-center md:pt-12 md:pb-14">
          <div className="mx-auto max-w-3xl">
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-electric-blue/30 bg-electric-blue/10 px-3.5 py-1.5 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-electric-blue animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-electric-blue">
                Cotizador Orbynex v2.0 Enterprise
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.12] text-foreground">
              Cierra más tratos con <br className="hidden sm:block" />
              <span className="text-gradient">Cotizaciones Impecables</span>
            </h1>

            {/* Subtítulo Compacto */}
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed">
              La plataforma comercial definitiva para cotizar en PDF interactivo, redactar con IA y operar en terreno 100% sin conexión. Máxima velocidad y reputación para tu empresa.
            </p>

            {/* Acciones */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <Button asChild size="lg" className="btn-orbynex-primary h-12 rounded-xl px-7 text-base font-semibold border-none w-full sm:w-auto text-white shadow-md">
                <Link to="/auth">
                  Comenzar ahora gratis <ArrowRight className="ml-2 size-4.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-7 text-base font-semibold bg-background/80 backdrop-blur-md border-border hover:bg-muted w-full sm:w-auto">
                <Link to="/auth">Acceder a mi cuenta</Link>
              </Button>
            </div>

            {/* Sellos de Confianza */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> Sin tarjeta de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> 100% Offline-First</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> Formato y RUT Chileno</span>
            </div>
          </div>

          {/* ================= CAPTURA REAL DEL PANEL CON MARCO SAAS ================= */}
          <div className="relative mx-auto mt-12 max-w-5xl">
            {/* Orla de luz líquida de fondo */}
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-r from-electric-blue/25 via-magenta-pulse/20 to-electric-cyan/25 blur-3xl opacity-75" />

            {/* Ventana Estilo MacOS / SaaS */}
            <div className="relative rounded-2xl border border-slate-200/90 bg-slate-900/95 shadow-[0_25px_60px_-15px_rgba(20,99,255,0.22)] overflow-hidden">
              {/* Barra superior del navegador */}
              <div className="flex h-10 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-[#ff5f56]" />
                  <span className="size-3 rounded-full bg-[#ffbd2e]" />
                  <span className="size-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-[11px] font-mono text-slate-300">
                  <Lock className="size-3 text-emerald-400" />
                  <span>cotizador.orbynexdigital.cl/panel</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En vivo</span>
                </div>
              </div>

              {/* Imagen Real del Panel */}
              <div className="relative overflow-hidden bg-slate-100">
                <img
                  src="/assets/images/panel_real_mockup.png"
                  alt="Panel Real del Cotizador Orbynex"
                  width={1400}
                  height={900}
                  loading="eager"
                  className="block w-full h-auto object-cover"
                />

                {/* Badges Flotantes Fidedignos */}
                <div className="hidden sm:flex absolute top-4 right-4 items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3.5 py-2 text-white shadow-xl backdrop-blur-md">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-semibold text-emerald-400">Cotización Aceptada</p>
                    <p className="text-xs font-bold text-white">$2.450.000 CLP</p>
                  </div>
                </div>

                <div className="hidden sm:flex absolute bottom-4 left-4 items-center gap-2.5 rounded-xl border border-blue-500/30 bg-slate-900/90 px-3.5 py-2 text-white shadow-xl backdrop-blur-md">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-400">
                    <Wifi className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-semibold text-cyan-400">100% Offline-First</p>
                    <p className="text-xs font-bold text-white">Sincronización PWA en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BENTO GRID DE CARACTERÍSTICAS (NO MÁS CUADROS ABURRIDOS) ================= */}
        <section className="relative mx-auto max-w-6xl px-5 py-14">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl text-foreground">
              Todo lo necesario para acelerar tus ventas
            </h2>
            <p className="mt-2.5 text-sm text-muted-foreground max-w-xl mx-auto">
              Herramientas diseñadas con precisión para agilizar la redacción, cotización y cierre comercial.
            </p>
          </div>

          {/* Grid Asimétrico Dinámico */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Card 1: Motor PDF de Varias Páginas (2 Columnas) */}
            <div className="md:col-span-2 glass rounded-3xl p-6 sm:p-8 border border-border/80 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex rounded-xl bg-electric-blue/10 p-3 text-electric-blue">
                  <FileText className="size-6" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-foreground">
                  Propuestas en PDF Interactivo de Varias Páginas
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Genera propuestas comerciales de alto nivel con portada ejecutiva, desglose financiero, condiciones de entrega y firma digital lista para cerrar contratos de inmediato.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-border/60 text-xs">
                <div className="rounded-xl bg-background/70 p-3 border border-border/40">
                  <span className="font-bold text-foreground block">Multi-página</span>
                  <span className="text-[11px] text-muted-foreground">Estructura ejecutiva</span>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40">
                  <span className="font-bold text-foreground block">Exportación PDF</span>
                  <span className="text-[11px] text-muted-foreground">Listo para imprimir</span>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 col-span-2 sm:col-span-1">
                  <span className="font-bold text-foreground block">Personalizable</span>
                  <span className="text-[11px] text-muted-foreground">Con tu logo corporativo</span>
                </div>
              </div>
            </div>

            {/* Card 2: 100% Offline-First (1 Columna) */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex rounded-xl bg-cyan-500/10 p-3 text-cyan-600 dark:text-cyan-400">
                  <CloudOff className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2 text-foreground">
                  100% Offline-First
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Continúa cotizando en terreno sin señal. Todo se almacena localmente en tu equipo y se sincroniza al reconectar.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>PWA instalable en móvil y PC</span>
              </div>
            </div>

            {/* Card 3: Redacción con IA (1 Columna) */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex rounded-xl bg-magenta-pulse/10 p-3 text-magenta-pulse">
                  <Sparkles className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2 text-foreground">
                  Redacción Asistida con IA
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Optimiza descripciones técnicas y textos comerciales con inteligencia artificial para lograr un tono formal, convincente y preciso.
                </p>
              </div>

              <div className="mt-6 rounded-xl bg-background/70 p-3 border border-border/40 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Cierra tratos 3x más rápido</span> con redacciones impecables.
              </div>
            </div>

            {/* Card 4: Seguridad y RLS (2 Columnas) */}
            <div className="md:col-span-2 glass rounded-3xl p-6 sm:p-8 border border-border/80 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-foreground">
                  Seguridad y Aislamiento de Grado Bancario
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Tus datos de cotización, listas de clientes y tarifas comerciales están protegidos con encriptación SSL 256-bit y políticas de aislamiento de datos por empresa usando Supabase RLS.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-4 border-t border-border/60 text-xs font-semibold text-foreground/80">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 border border-border/50">
                  ✓ Cifrado SSL 256-bit
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 border border-border/50">
                  ✓ Supabase Row Level Security
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 border border-border/50">
                  ✓ Sincronización en Tiempo Real
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECCIÓN PWA COMPACTA Y MODERNA ================= */}
        <section className="relative mx-auto max-w-5xl px-5 py-8">
          <div className="glass flex flex-col items-center justify-between gap-6 rounded-3xl p-6 sm:p-8 md:flex-row border-border/80 shadow-xl">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Lleva el cotizador contigo a cualquier lugar
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Instala la aplicación web progresiva y genera cotizaciones en cualquier momento, incluso sin internet.
              </p>
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <InstallPrompt />
                <Button asChild variant="outline" className="h-10 rounded-xl px-5 text-xs font-semibold">
                  <Link to="/auth">Comenzar ahora gratis</Link>
                </Button>
              </div>
            </div>
            <div className="flex size-28 items-center justify-center rounded-2xl bg-electric-blue/10 text-electric-blue border border-electric-blue/20 shrink-0">
              <CloudOff className="size-12 opacity-80" />
            </div>
          </div>
        </section>
      </main>
      
      <PublicFooter />
    </div>
  );
}
