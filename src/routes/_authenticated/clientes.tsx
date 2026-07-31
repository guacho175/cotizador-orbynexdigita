import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { db } from "@/lib/db";
import { deleteClient, emptyClient, saveClient } from "@/lib/repo";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Cotiza" },
      { name: "description", content: "Administra tu cartera de clientes: RUT, contacto, dirección y notas." },
      { property: "og:title", content: "Clientes — Cotiza" },
      { property: "og:description", content: "Administra tu cartera de clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientsPage,
});

const clientSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(160),
  rut: z.string().trim().max(20),
  contacto: z.string().trim().max(120),
  email: z.union([z.string().trim().email("Correo inválido").max(255), z.literal("")]),
  telefono: z.string().trim().max(40),
  direccion: z.string().trim().max(240),
  notas: z.string().trim().max(600),
});

function ClientsPage() {
  const { user } = Route.useRouteContext();
  const clients = useLiveQuery(() => db.clients.orderBy("nombre").toArray(), [], []) ?? [];
  const [term, setTerm] = useState("");
  const [draft, setDraft] = useState<Client | null>(null);

  const filtered = clients.filter((client) =>
    `${client.nombre} ${client.rut} ${client.email}`.toLowerCase().includes(term.trim().toLowerCase()),
  );

  async function submit() {
    if (!draft) return;
    const parsed = clientSchema.safeParse(draft);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    await saveClient({ ...draft, ...parsed.data });
    setDraft(null);
    toast.success("Cliente guardado");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} registrados</p>
        </div>
        <div className="flex w-full max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar cliente"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>
          <Button onClick={() => setDraft(emptyClient(user.id))}>
            <Plus className="size-4" />
            Nuevo
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay clientes registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setDraft(client)}
                >
                  <p className="truncate text-sm font-medium">{client.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[client.rut, client.email, client.telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Eliminar cliente"
                  onClick={async () => {
                    if (!confirm(`¿Eliminar a ${client.nombre}?`)) return;
                    await deleteClient(client.id);
                    toast.success("Cliente eliminado");
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft && clients.some((c) => c.id === draft.id) ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["nombre", "Nombre o razón social"],
                  ["rut", "RUT"],
                  ["contacto", "Persona de contacto"],
                  ["email", "Correo"],
                  ["telefono", "Teléfono"],
                  ["direccion", "Dirección"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`client-${field}`}>{label}</Label>
                  <Input
                    id={`client-${field}`}
                    value={draft[field]}
                    onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="client-notas">Notas</Label>
                <Textarea
                  id="client-notas"
                  rows={3}
                  value={draft.notas}
                  onChange={(event) => setDraft({ ...draft, notas: event.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void submit()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
