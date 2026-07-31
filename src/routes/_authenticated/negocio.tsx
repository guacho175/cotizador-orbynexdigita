import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { getBusiness, saveBusiness, uuid } from "@/lib/repo";
import type { Business } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnline } from "@/hooks/use-sync-status";

export const Route = createFileRoute("/_authenticated/negocio")({
  head: () => ({
    meta: [
      { title: "Mi negocio — Cotiza" },
      { name: "description", content: "Configura los datos de tu empresa, el logo, el IVA y los datos de transferencia." },
      { property: "og:title", content: "Mi negocio — Cotiza" },
      { property: "og:description", content: "Configura los datos que aparecen en tus cotizaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessPage,
});

const businessSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre de tu empresa es obligatorio").max(160),
  rut: z.string().trim().max(20),
  email: z.union([z.string().trim().email("Correo inválido").max(255), z.literal("")]),
  iva_percent: z.number().min(0, "IVA inválido").max(100, "IVA inválido"),
});

const TEXT_FIELDS: [keyof Business, string][] = [
  ["nombre", "Nombre o razón social"],
  ["rut", "RUT"],
  ["giro", "Giro"],
  ["direccion", "Dirección"],
  ["telefono", "Teléfono"],
  ["email", "Correo"],
  ["sitio_web", "Sitio web"],
];

const BANK_FIELDS: [keyof Business, string][] = [
  ["banco_titular", "Titular"],
  ["banco_rut", "RUT del titular"],
  ["banco_nombre", "Banco"],
  ["banco_tipo_cuenta", "Tipo de cuenta"],
  ["banco_numero_cuenta", "N° de cuenta"],
  ["banco_email", "Correo para comprobantes"],
];

function BusinessPage() {
  const { user } = Route.useRouteContext();
  const stored = useLiveQuery(() => getBusiness(user.id), [user.id]);
  const online = useOnline();
  const [draft, setDraft] = useState<Business | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (stored && !draft) setDraft(stored);
  }, [stored, draft]);

  if (stored === undefined) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const current: Business = draft ?? {
    id: uuid(),
    user_id: user.id,
    nombre: "",
    rut: "",
    giro: "",
    direccion: "",
    telefono: "",
    email: "",
    sitio_web: "",
    logo_path: null,
    banco_nombre: "",
    banco_tipo_cuenta: "",
    banco_numero_cuenta: "",
    banco_titular: "",
    banco_rut: "",
    banco_email: "",
    condiciones: "",
    pie_pagina: "",
    iva_percent: 19,
    next_quote_number: 1,
  };

  function patch(patchValue: Partial<Business>) {
    setDraft({ ...current, ...patchValue });
  }

  async function uploadLogo(file: File) {
    if (file.size > 2 * 1024 * 1024) return toast.error("El logo debe pesar menos de 2 MB");
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    patch({ logo_data: dataUrl });

    if (!online) {
      toast.message("Logo guardado en este dispositivo. Se subirá al reconectar.");
      return;
    }

    setUploading(true);
    const path = `${user.id}/logo-${Date.now()}.${file.name.split(".").pop()?.toLowerCase() ?? "png"}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) return toast.error("No se pudo subir el logo");
    patch({ logo_data: dataUrl, logo_path: path });
    toast.success("Logo actualizado");
  }

  async function submit() {
    const parsed = businessSchema.safeParse({
      nombre: current.nombre,
      rut: current.rut,
      email: current.email,
      iva_percent: Number(current.iva_percent),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    await saveBusiness({ ...current, ...parsed.data });
    await db.businesses.put({ ...current, ...parsed.data });
    toast.success("Datos guardados");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi negocio</h1>
        <p className="text-sm text-muted-foreground">Estos datos aparecen en el encabezado del PDF.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {current.logo_data ? (
                <img src={current.logo_data} alt="Logo actual" className="size-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">Sin logo</span>
              )}
            </div>
            <div>
              <Label htmlFor="logo" className="mb-1.5 block">
                Logo
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="max-w-xs"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadLogo(file);
                  }}
                />
                {uploading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Upload className="size-4 text-muted-foreground" />}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEXT_FIELDS.map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={`biz-${field}`}>{label}</Label>
                <Input
                  id={`biz-${field}`}
                  value={String(current[field] ?? "")}
                  onChange={(event) => patch({ [field]: event.target.value } as Partial<Business>)}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="biz-iva">IVA por defecto (%)</Label>
              <Input
                id="biz-iva"
                type="number"
                min={0}
                max={100}
                value={current.iva_percent}
                onChange={(event) => patch({ iva_percent: Number(event.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos de transferencia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {BANK_FIELDS.map(([field, label]) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`bank-${field}`}>{label}</Label>
              <Input
                id={`bank-${field}`}
                value={String(current[field] ?? "")}
                onChange={(event) => patch({ [field]: event.target.value } as Partial<Business>)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Textos del documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="condiciones">Condiciones comerciales</Label>
            <Textarea
              id="condiciones"
              rows={3}
              maxLength={800}
              value={current.condiciones}
              onChange={(event) => patch({ condiciones: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pie">Pie de página</Label>
            <Input
              id="pie"
              maxLength={160}
              value={current.pie_pagina}
              onChange={(event) => patch({ pie_pagina: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void submit()}>Guardar cambios</Button>
    </div>
  );
}
