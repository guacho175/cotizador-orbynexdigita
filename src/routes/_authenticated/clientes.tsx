import { useState, useDeferredValue, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { deleteClient, emptyClient, saveClient } from "@/lib/repo";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";

import { sortClients, filterClients, paginateClients } from "./clientes-utils";
import { ClientSearch } from "@/components/clientes/ClientSearch";
import { ClientsTable } from "@/components/clientes/ClientsTable";
import { ClientMobileCard } from "@/components/clientes/ClientMobileCard";
import { ClientFormDialog } from "@/components/clientes/ClientFormDialog";
import { ClientDeleteDialog } from "@/components/clientes/ClientDeleteDialog";

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

function ClientsPage() {
  const { user } = Route.useRouteContext();
  const rawClients = useLiveQuery(() => db.clients.where("user_id").equals(user.id).toArray(), [user.id]);
  
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);
  const [page, setPage] = useState(0);
  
  const [draft, setDraft] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  async function handleSaveClient(data: Partial<Client>) {
    if (!draft) return;
    try {
      await saveClient({ ...draft, ...data });
      setDraft(null);
      setIsEditing(false);
      toast.success("Cliente guardado correctamente");
    } catch (err) {
      toast.error("Error al guardar el cliente");
    }
  }

  async function handleDeleteConfirm() {
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

  const handleNew = () => {
    setDraft(emptyClient(user.id));
    setIsEditing(false);
  };

  const handleEdit = (client: Client) => {
    setDraft(client);
    setIsEditing(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rawClients?.length === 1 ? "1 cliente registrado" : `${rawClients?.length ?? 0} clientes registrados`}
          </p>
        </div>
        <ClientSearch term={term} setTerm={setTerm} onNew={handleNew} />
      </div>

      {isLoading ? (
        <ClientsTable clients={[]} isLoading={true} onEdit={handleEdit} onDelete={handleDelete} />
      ) : rawClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border/50 rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Aún no tienes clientes registrados</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crea tu primer cliente para comenzar a generar cotizaciones y gestionar tu cartera de forma profesional.
          </p>
          <Button onClick={handleNew} className="mt-6 shadow-sm rounded-lg bg-electric-glow">
            Crear tu primer cliente
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-border/50 rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
          <Search className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-foreground font-medium">No encontramos clientes para "{deferredTerm}"</p>
          <p className="text-sm text-muted-foreground mt-1">Intenta con otros términos de búsqueda.</p>
          <Button variant="outline" onClick={() => setTerm("")} className="mt-4 rounded-lg">
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <ClientsTable clients={paginated} isLoading={false} onEdit={handleEdit} onDelete={handleDelete} />
          
          <div className="grid gap-4 md:hidden">
            {paginated.map(client => (
              <ClientMobileCard 
                key={client.id} 
                client={client} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {page * PAGE_SIZE + 1} a {Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <ClientFormDialog 
        draft={draft} 
        isEditing={isEditing} 
        onClose={() => setDraft(null)} 
        onSave={handleSaveClient} 
      />

      <ClientDeleteDialog 
        client={clientToDelete} 
        onClose={() => setClientToDelete(null)} 
        onConfirm={handleDeleteConfirm} 
      />
    </div>
  );
}

