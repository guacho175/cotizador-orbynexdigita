import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileText,
  WifiOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Cotiza" },
      { name: "description", content: "Accede a tu cuenta para crear y sincronizar tus cotizaciones." },
      { property: "og:title", content: "Iniciar sesión — Cotiza" },
      { property: "og:description", content: "Accede a tu cuenta de Cotiza." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error("Correo o contraseña incorrectos");
    navigate({ to: "/panel", replace: true });
  }

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim().slice(0, 120) },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      setEmailSent(true);
      return;
    }
    navigate({ to: "/panel", replace: true });
  }

  async function resetPassword() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      return toast.error("Escribe tu correo en el formulario para enviarte el enlace");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Te enviamos un enlace para restablecer tu contraseña");
  }

  return (
    <div className="flex min-h-screen lg:h-screen lg:max-h-screen w-full flex-col lg:flex-row bg-background overflow-x-hidden lg:overflow-hidden">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA: SHOWCASE DE MARCA (PANTALLA FIJA)       */}
      {/* ========================================================= */}
      <section className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-deep-space p-8 xl:p-12 text-white border-r border-white/10 select-none">
        {/* Orbes de luz ambiental */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-electric-blue/30 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-[450px] w-[450px] rounded-full bg-magenta-pulse/25 blur-[150px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-electric-cyan/20 blur-[130px]" />

        {/* Patrón de rejilla sutil */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

        {/* Header con Logo Oficial y Acceso Rápido a Inicio */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/assets/logos/logo_orbynex_horizontal_blanco_v2_trim.png"
              alt="Orbynex Digital"
              className="h-9 w-auto"
            />
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v2.0 Cotizador
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            <span>Ir a la portada</span>
          </Link>
        </div>

        {/* Contenido Central: Propuesta de valor & Mini Cotización */}
        <div className="relative z-10 my-auto py-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-electric-cyan backdrop-blur-md">
            <Sparkles className="size-3 text-electric-cyan" />
            <span>Plataforma Comercial de Alta Velocidad</span>
          </div>

          <h1 className="font-display text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight !text-white">
            Propuestas comerciales que <br />
            <span className="text-gradient">aceleran tus ventas.</span>
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed !text-white/80">
            Genera cotizaciones profesionales en PDF, redacta descripciones comerciales con IA y mantén tu operación sincronizada incluso sin conexión a internet.
          </p>

          {/* Mini-Card Mockup de Cotización */}
          <div className="mt-5 max-w-md rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-electric-blue/25 text-electric-cyan font-bold text-xs">
                  PDF
                </div>
                <div>
                  <p className="text-xs font-semibold !text-white">Cotización #COT-2026-089</p>
                  <p className="text-[11px] !text-white/60">Cliente: Soluciones Andinas SpA</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <CheckCircle2 className="size-3 text-emerald-400" /> Aprobada
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/5 p-2">
                <span className="block text-[10px] !text-white/60">Monto Total</span>
                <span className="text-xs font-bold text-electric-cyan">$2.450.000 CLP</span>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <span className="block text-[10px] !text-white/60">Tiempo de Envío</span>
                <span className="text-xs font-bold !text-white">12 minutos</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[10px] !text-white/70">
              <span className="flex items-center gap-1">
                <Sparkles className="size-3 text-magenta-pulse" />
                Redacción asistida por IA
              </span>
              <span className="font-mono text-[10px] text-emerald-400">100% Offline Ready</span>
            </div>
          </div>

          {/* 3 Pilares clave */}
          <div className="mt-5 grid max-w-md grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col">
              <span className="flex items-center gap-1 font-semibold !text-white text-[11px]">
                <WifiOff className="size-3 text-electric-cyan" />
                Offline-First
              </span>
              <span className="mt-0.5 text-[10px] !text-white/60">Sincronización PWA</span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1 font-semibold !text-white text-[11px]">
                <FileText className="size-3 text-magenta-pulse" />
                PDF Pro
              </span>
              <span className="mt-0.5 text-[10px] !text-white/60">Diseño multi-hoja</span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1 font-semibold !text-white text-[11px]">
                <ShieldCheck className="size-3 text-electric-blue" />
                Seguridad
              </span>
              <span className="mt-0.5 text-[10px] !text-white/60">Aislamiento RLS</span>
            </div>
          </div>
        </div>

        {/* Footer del Showcase */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] !text-white/50">
          <span>© 2026 Orbynex Digital</span>
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="size-3 text-emerald-400" />
            Cifrado SSL 256-bit
          </span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA: FORMULARIO ULTRA-COMPACTO SIN SCROLL     */}
      {/* ========================================================= */}
      <section className="relative flex flex-1 flex-col justify-between p-6 sm:p-8 lg:p-10 bg-background overflow-y-auto lg:overflow-hidden">
        {/* Navegación Superior: Botón Grande y Muy Intuitivo para Volver */}
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition-all hover:border-electric-blue/40 hover:bg-muted/70"
            aria-label="Volver a la página principal"
          >
            <ArrowLeft className="size-4 text-electric-blue transition-transform group-hover:-translate-x-1" />
            <span>Volver a la página principal</span>
          </Link>

          {/* Logo en Mobile / Tablet */}
          <Link to="/" className="flex items-center lg:hidden">
            <img
              src="/assets/logos/logo_orbynex_horizontal_claro_v2.png"
              alt="Orbynex"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/assets/logos/logo_orbynex_horizontal_blanco_v2_trim.png"
              alt="Orbynex"
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
        </div>

        {/* Tarjeta del Formulario: Centrada y Ajustada para Caber al 100% en Pantalla */}
        <div className="mx-auto my-auto w-full max-w-md py-4">
          {emailSent ? (
            <Card className="glass border-border/60 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Mail className="size-6" />
                </div>
                <CardTitle className="font-display text-xl">Revisa tu correo</CardTitle>
                <CardDescription className="text-xs mt-1.5 leading-relaxed">
                  Enviamos un enlace de confirmación a{" "}
                  <span className="font-semibold text-foreground">{email}</span>. Ábrelo para activar tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-xl text-xs font-semibold"
                  onClick={() => setEmailSent(false)}
                >
                  Volver a iniciar sesión
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass border-border/70 shadow-xl">
              <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3">
                {/* Pestañas Segmentadas Nativas y Perfectamente Simétricas */}
                <div className="mb-4 grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1 border border-border/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className={`flex items-center justify-center rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                      activeTab === "login"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className={`flex items-center justify-center rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                      activeTab === "signup"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Crear cuenta
                  </button>
                </div>

                {/* Encabezado del Tab Activo */}
                <div className="mb-3 text-left">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {activeTab === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeTab === "login"
                      ? "Ingresa tus credenciales para acceder a tus cotizaciones."
                      : "Empieza a cotizar en menos de un minuto sin costo."}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 pt-0">
                {activeTab === "login" ? (
                  /* ================= FORMULARIO LOGIN ================= */
                  <form className="space-y-3.5" onSubmit={signIn}>
                    {/* Correo Electrónico */}
                    <div className="space-y-1">
                      <Label htmlFor="login-email" className="text-xs font-semibold text-foreground/90">
                        Correo electrónico
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          placeholder="nombre@empresa.cl"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          className="h-10 rounded-xl border-border/80 bg-background/80 pl-9 pr-3 text-sm transition-all focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-xs font-semibold text-foreground/90">
                          Contraseña
                        </Label>
                        <button
                          type="button"
                          onClick={() => void resetPassword()}
                          className="text-[11px] font-medium text-electric-blue hover:underline transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          className="h-10 rounded-xl border-border/80 bg-background/80 pl-9 pr-9 text-sm transition-all focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Botón Iniciar Sesión */}
                    <Button
                      type="submit"
                      className="btn-orbynex-primary mt-2 h-10.5 w-full rounded-xl text-xs sm:text-sm font-semibold border-none"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 size-4" />
                      )}
                      Entrar a mi cuenta
                    </Button>
                  </form>
                ) : (
                  /* ================= FORMULARIO REGISTRO ================= */
                  <form className="space-y-3" onSubmit={signUp}>
                    {/* Nombre completo */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-name" className="text-xs font-semibold text-foreground/90">
                        Nombre completo
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          maxLength={120}
                          placeholder="Ej. Rodrigo Morales"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          required
                          className="h-10 rounded-xl border-border/80 bg-background/80 pl-9 pr-3 text-sm transition-all focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
                        />
                      </div>
                    </div>

                    {/* Correo Electrónico */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-semibold text-foreground/90">
                        Correo electrónico corporativo
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          placeholder="rodrigo@miempresa.cl"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          className="h-10 rounded-xl border-border/80 bg-background/80 pl-9 pr-3 text-sm transition-all focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-password" className="text-xs font-semibold text-foreground/90">
                        Contraseña (mínimo 8 caracteres)
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          className="h-10 rounded-xl border-border/80 bg-background/80 pl-9 pr-9 text-sm transition-all focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Al registrarte, aceptas los términos de servicio y políticas de privacidad de Orbynex.
                    </p>

                    {/* Botón Crear Cuenta */}
                    <Button
                      type="submit"
                      className="btn-orbynex-primary mt-1 h-10.5 w-full rounded-xl text-xs sm:text-sm font-semibold border-none"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 size-4" />
                      )}
                      Crear cuenta ahora
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Nota de seguridad debajo de la tarjeta */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Datos protegidos con Supabase Auth y encriptación RLS</span>
          </div>
        </div>

        {/* Footer inferior */}
        <div className="mx-auto w-full max-w-md pt-2 text-center text-[11px] text-muted-foreground border-t border-border/40">
          ¿Problemas para acceder?{" "}
          <a
            href="mailto:soporte@orbynexdigital.cl"
            className="text-electric-blue hover:underline font-medium"
          >
            Contactar soporte Orbynex
          </a>
        </div>
      </section>
    </div>
  );
}
