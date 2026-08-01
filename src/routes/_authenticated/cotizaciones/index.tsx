import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Copy, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { deleteQuote, duplicateQuote } from "@/lib/repo";
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
  const quotes = useLiveQuery(() => db.quotes.toArray(), [], []) ?? [];
  const clients = useLiveQuery(() => db.clients.toArray(), [], []) ?? [];

  const filtered = quotes
    .filter((quote) => {
      if (!term.trim()) return true;
      const cliente = clients.find((c) => c.id === quote.client_id)?.nombre ?? "";
      const haystack = `${quoteNumber(quote.numero, quote.folio_cliente)} ${cliente} ${quote.estado}`.toLowerCase();
      return haystack.includes(term.trim().toLowerCase());
    })
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">{quotes.length} en total</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por número o cliente"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
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
                      N° {quoteNumber(quote.numero, quote.folio_cliente)} · {cliente?.nombre ?? "Sin cliente"}
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
                    aria-label="Eliminar"
                    onClick={async () => {
                      if (!confirm("¿Eliminar esta cotización?")) return;
                      await deleteQuote(quote.id);
                      toast.success("Cotización eliminada");
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
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
