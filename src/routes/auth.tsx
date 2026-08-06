import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailSent, setEmailSent] = useState(false);

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
    if (!parsed.success) return toast.error("Escribe tu correo para enviarte el enlace");
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Te enviamos un enlace para restablecer tu contraseña");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Fondo de luz líquida / inmersivo simulado con CSS */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply dark:mix-blend-screen">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric-blue/30 blur-[100px]" />
        <div className="absolute right-[-5%] bottom-[-10%] h-[60vh] w-[40vw] rounded-full bg-neon-purple/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-8 flex flex-col items-center justify-center gap-3">
          <img src="/assets/logos/logo_orbynex_horizontal_oscuro_v2.png" alt="Orbynex" className="h-8 dark:hidden" />
          <img src="/assets/logos/logo_orbynex_horizontal_blanco_v2.png" alt="Orbynex" className="h-8 hidden dark:block" />
        </Link>

        {emailSent ? (
          <Card className="glass border-none shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Revisa tu correo</CardTitle>
              <CardDescription className="text-base">
                Enviamos un enlace de confirmación a <span className="font-medium text-foreground">{email}</span>. Ábrelo para activar tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full h-12 rounded-xl text-base" onClick={() => setEmailSent(false)}>
                Volver
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1 mb-6 glass">
              <TabsTrigger value="login" className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="glass border-none shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Bienvenido de vuelta</CardTitle>
                  <CardDescription className="text-base">Ingresa para ver tus cotizaciones.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5" onSubmit={signIn}>
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium text-foreground/80">Correo electrónico</Label>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="h-12 rounded-xl border-white/20 bg-white/50 px-4 transition-all focus:bg-white dark:border-white/10 dark:bg-black/20 dark:focus:bg-black/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium text-foreground/80">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="h-12 rounded-xl border-white/20 bg-white/50 px-4 transition-all focus:bg-white dark:border-white/10 dark:bg-black/20 dark:focus:bg-black/40"
                      />
                    </div>
                    <Button type="submit" className="bg-electric-glow w-full h-12 rounded-xl text-base font-semibold border-none mt-2" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
                      Entrar a mi cuenta
                    </Button>
                    <button
                      type="button"
                      onClick={() => void resetPassword()}
                      className="mt-4 w-full text-center text-sm font-medium text-muted-foreground hover:text-electric-blue transition-colors"
                    >
                      Olvidé mi contraseña
                    </button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="glass border-none shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Crea tu cuenta</CardTitle>
                  <CardDescription className="text-base">Empieza a cotizar en menos de un minuto.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5" onSubmit={signUp}>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium text-foreground/80">Nombre completo</Label>
                      <Input
                        id="signup-name"
                        maxLength={120}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="h-12 rounded-xl border-white/20 bg-white/50 px-4 transition-all focus:bg-white dark:border-white/10 dark:bg-black/20 dark:focus:bg-black/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">Correo electrónico</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="h-12 rounded-xl border-white/20 bg-white/50 px-4 transition-all focus:bg-white dark:border-white/10 dark:bg-black/20 dark:focus:bg-black/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="h-12 rounded-xl border-white/20 bg-white/50 px-4 transition-all focus:bg-white dark:border-white/10 dark:bg-black/20 dark:focus:bg-black/40"
                      />
                    </div>
                    <Button type="submit" className="bg-electric-glow w-full h-12 rounded-xl text-base font-semibold border-none mt-2" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
                      Crear cuenta ahora
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
