import { useState, useDeferredValue, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Search, MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sortClients, filterClients, paginateClients } from "./clientes-utils";

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

type FormErrors = Partial<Record<keyof z.infer<typeof clientSchema>, string>>;

function ClientsPage() {
  const { user } = Route.useRouteContext();
  const rawClients = useLiveQuery(() => db.clients.where("user_id").equals(user.id).toArray(), [user.id]);
  
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);
  const [page, setPage] = useState(0);
  
  const [draft, setDraft] = useState<Client | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    setPage(0);
  }, [deferredTerm]);

  const isLoading = rawClients === undefined;
  
  const sorted = rawClients ? sortClients(rawClients) : [];
  const filtered = filterClients(sorted, deferredTerm);
  
  const PAGE_SIZE = 50;
  const paginated = paginateClients(filtered, page, PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const parsed = clientSchema.safeParse(draft);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      await saveClient({ ...draft, ...parsed.data });
      setDraft(null);
      toast.success("Cliente guardado correctamente");
    } catch (err) {
      toast.error("Error al guardar el cliente");
    }
  }

  async function handleDelete() {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      toast.success("Cliente eliminado correctamente");
    } catch (err) {
      toast.error("Error al eliminar el cliente");
    } finally {
      setClientToDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{rawClients?.length ?? 0} registrados</p>
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
          <Button onClick={() => { setDraft(emptyClient(user.id)); setErrors({}); }}>
            <Plus className="size-4 mr-2" />
            Nuevo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Cargando clientes...
          </CardContent>
        </Card>
      ) : rawClients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay clientes registrados en la cartera.
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron clientes para "{deferredTerm}".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre o razón social</TableHead>
                  <TableHead className="hidden md:table-cell">RUT</TableHead>
                  <TableHead className="hidden md:table-cell">Persona de contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Correo y teléfono</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <button 
                        type="button" 
                        onClick={() => { setDraft(client); setErrors({}); }}
                        className="font-medium text-left hover:underline focus:outline-none"
                      >
                        {client.nombre}
                      </button>
                      <div className="md:hidden mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {client.rut && <span>RUT: {client.rut}</span>}
                        {client.contacto && <span>Contacto: {client.contacto}</span>}
                        {(client.email || client.telefono) && <span>{[client.email, client.telefono].filter(Boolean).join(" · ")}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{client.rut || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.contacto || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-0.5 text-sm">
                        {client.email && <span>{client.email}</span>}
                        {client.telefono && <span>{client.telefono}</span>}
                        {!client.email && !client.telefono && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setDraft(client); setErrors({}); }}>
                            <Edit className="size-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setClientToDelete(client)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {page * PAGE_SIZE + 1} a {Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft && rawClients?.some((c) => c.id === draft.id) ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form onSubmit={submit} className="grid gap-4">
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
                    {errors[field] && (
                      <p className="text-xs text-destructive">{errors[field]}</p>
                    )}
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
                  {errors.notas && (
                    <p className="text-xs text-destructive">{errors.notas}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={clientToDelete !== null} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente al cliente <strong>{clientToDelete?.nombre}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
