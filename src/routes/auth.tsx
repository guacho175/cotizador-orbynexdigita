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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-lg" />
          <span className="text-xl font-semibold tracking-tight">Cotiza</span>
        </Link>

        {emailSent ? (
          <Card>
            <CardHeader>
              <CardTitle>Revisa tu correo</CardTitle>
              <CardDescription>
                Enviamos un enlace de confirmación a {email}. Ábrelo para activar tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
                Volver
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Bienvenido de vuelta</CardTitle>
                  <CardDescription>Ingresa para ver tus cotizaciones.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={signIn}>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">Correo</Label>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Entrar
                    </Button>
                    <button
                      type="button"
                      onClick={() => void resetPassword()}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Olvidé mi contraseña
                    </button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Crear cuenta</CardTitle>
                  <CardDescription>Empieza a cotizar en menos de un minuto.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={signUp}>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name">Nombre</Label>
                      <Input
                        id="signup-name"
                        maxLength={120}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Correo</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Crear cuenta
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
