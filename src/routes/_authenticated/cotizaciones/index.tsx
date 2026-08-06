import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Archive, ArchiveRestore, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { archiveQuote, duplicateQuote, restoreQuote } from "@/lib/repo";
import { formatDate, money, quoteNumber } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cotizaciones/")({
  head: () => ({
    meta: [
      { title: "Cotizaciones — Cotiza" },
      { name: "description", content: "Listado de todas tus cotizaciones con estado, cliente y total." },
      { property: "og:title", content: "Cotizaciones — Cotiza" },
      { property: "og:description", content: "Listado de todas tus cotizaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotesList,
});

function QuotesList() {
  const { user } = Route.useRouteContext();
  const [term, setTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const quotes = useLiveQuery(() => db.quotes.toArray(), [], []) ?? [];
  const clients = useLiveQuery(() => db.clients.toArray(), [], []) ?? [];

  const filtered = quotes
    .filter((quote) => !!quote.is_archived === showArchived)
    .filter((quote) => {
      if (!term.trim()) return true;
      const cliente = clients.find((c) => c.id === quote.client_id)?.nombre ?? "";
      const haystack = `${quoteNumber(quote.numero)} ${cliente} ${quote.estado}`.toLowerCase();
      return haystack.includes(term.trim().toLowerCase());
    })
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">{quotes.filter(q => !!q.is_archived === showArchived).length} en total</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative w-full max-w-xs flex-1 sm:w-auto">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-full pl-9"
              placeholder="Buscar"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>
          <Button
            variant={showArchived ? "secondary" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
            className="shrink-0"
          >
            {showArchived ? "Activas" : "Archivadas"}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay cotizaciones que coincidan.{" "}
            <Link to="/cotizaciones/nueva" className="text-primary underline">
              Crear una nueva
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((quote) => {
            const cliente = clients.find((c) => c.id === quote.client_id);
            return (
              <Card key={quote.id}>
                <CardContent className="flex flex-wrap items-center gap-3 py-4">
                  <Link
                    to="/cotizaciones/$id"
                    params={{ id: quote.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium">
                      N° {quoteNumber(quote.numero)} · {cliente?.nombre ?? "Sin cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(quote.fecha)} · {money(quote.total)}
                    </p>
                  </Link>
                  <Badge variant="secondary" className="capitalize">
                    {quote.estado}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Duplicar"
                    onClick={async () => {
                      const id = await duplicateQuote(quote.id, user.id);
                      if (id) toast.success("Cotización duplicada");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={showArchived ? "Restaurar" : "Archivar"}
                    onClick={async () => {
                      if (showArchived) {
                        await restoreQuote(quote.id);
                        toast.success("Cotización restaurada");
                      } else {
                        if (!confirm("¿Archivar esta cotización?")) return;
                        await archiveQuote(quote.id);
                        toast.success("Cotización archivada");
                      }
                    }}
                  >
                    {showArchived ? (
                      <ArchiveRestore className="size-4" />
                    ) : (
                      <Archive className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
