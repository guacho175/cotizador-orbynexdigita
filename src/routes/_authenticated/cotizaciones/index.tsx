import { useDeferredValue, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Archive, ArchiveRestore, ChevronLeft, ChevronRight, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { archiveQuote, duplicateQuote, restoreQuote } from "@/lib/repo";
import { formatDate, money, quoteNumber } from "@/lib/format";
import type { Client, Quote } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildClientMap,
  filterQuotes,
  paginateQuotes,
  QUOTES_PAGE_SIZE,
  snapshotClientName,
  sortQuotesByNumber,
} from "@/components/quotes/quote-list-utils";

export const Route = createFileRoute("/_authenticated/cotizaciones/")({
  head: () => ({
    meta: [
      { title: "Cotizaciones — Cotiza" },
      {
        name: "description",
        content: "Listado de todas tus cotizaciones con estado, cliente y total.",
      },
      { property: "og:title", content: "Cotizaciones — Cotiza" },
      { property: "og:description", content: "Listado de todas tus cotizaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotesList,
});

function quoteClientLabel(
  quote: Quote,
  client: Client | undefined,
): { primary: string; secondary: string | null } {
  if (client)
    return { primary: client.nombre || "Cliente sin nombre", secondary: client.rut || null };
  if (quote.client_id == null) return { primary: "Sin cliente", secondary: null };
  return {
    primary: "Cliente no disponible",
    secondary: snapshotClientName(quote) || `ID ${quote.client_id.slice(0, 8)}`,
  };
}

function QuoteRow({
  quote,
  client,
  showArchived,
  onDuplicate,
  onArchiveToggle,
}: {
  quote: Quote;
  client: Client | undefined;
  showArchived: boolean;
  onDuplicate: (quote: Quote) => Promise<void>;
  onArchiveToggle: (quote: Quote) => Promise<void>;
}) {
  const clientLabel = quoteClientLabel(quote, client);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-4">
        <Link
          to="/cotizaciones/$id"
          params={{ id: quote.id }}
          className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="truncate text-sm font-medium">
            {quote.numero == null ? "Pendiente de numeración" : `N° ${quoteNumber(quote.numero)}`} ·{" "}
            {clientLabel.primary}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(quote.fecha)} · {money(quote.total)}
            {clientLabel.secondary ? ` · ${clientLabel.secondary}` : ""}
          </p>
        </Link>
        <Badge variant="secondary" className="capitalize">
          {quote.estado}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Duplicar cotización"
          onClick={() => void onDuplicate(quote)}
        >
          <Copy className="size-4" aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={showArchived ? "Restaurar cotización" : "Archivar cotización"}
          onClick={() => void onArchiveToggle(quote)}
        >
          {showArchived ? (
            <ArchiveRestore className="size-4" aria-hidden />
          ) : (
            <Archive className="size-4 text-muted-foreground" aria-hidden />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function QuoteListSection({
  title,
  quotes,
  clientsById,
  showArchived,
  onDuplicate,
  onArchiveToggle,
}: {
  title: string;
  quotes: Quote[];
  clientsById: ReadonlyMap<string, Client>;
  showArchived: boolean;
  onDuplicate: (quote: Quote) => Promise<void>;
  onArchiveToggle: (quote: Quote) => Promise<void>;
}) {
  if (quotes.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={title}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      {quotes.map((quote) => (
        <QuoteRow
          key={quote.id}
          quote={quote}
          client={quote.client_id ? clientsById.get(quote.client_id) : undefined}
          showArchived={showArchived}
          onDuplicate={onDuplicate}
          onArchiveToggle={onArchiveToggle}
        />
      ))}
    </section>
  );
}

function QuotesList() {
  const { user } = Route.useRouteContext();
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const data = useLiveQuery(async () => {
    const [quotes, clients] = await Promise.all([
      db.quotes.where("user_id").equals(user.id).toArray(),
      db.clients.where("user_id").equals(user.id).toArray(),
    ]);
    return { quotes, clients };
  }, [user.id]);

  const clientsById = useMemo(() => buildClientMap(data?.clients ?? []), [data?.clients]);
  const modeQuotes = useMemo(
    () => data?.quotes.filter((quote) => Boolean(quote.is_archived) === showArchived) ?? [],
    [data?.quotes, showArchived],
  );
  const filteredQuotes = useMemo(
    () => sortQuotesByNumber(filterQuotes(modeQuotes, deferredTerm, clientsById)),
    [clientsById, deferredTerm, modeQuotes],
  );
  const totalPages = Math.ceil(filteredQuotes.length / QUOTES_PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleQuotes = paginateQuotes(filteredQuotes, safePage);
  const visiblePending = visibleQuotes.filter((quote) => quote.numero == null);
  const visibleNumbered = visibleQuotes.filter((quote) => quote.numero != null);

  function handleTermChange(nextTerm: string) {
    setTerm(nextTerm);
    setPage(0);
  }

  function toggleArchived() {
    setShowArchived((current) => !current);
    setPage(0);
  }

  async function handleDuplicate(quote: Quote) {
    try {
      const id = await duplicateQuote(quote.id, user.id);
      if (id) {
        setPage(0);
        toast.success("Cotización duplicada");
      }
    } catch {
      toast.error("No se pudo duplicar la cotización");
    }
  }

  async function handleArchiveToggle(quote: Quote) {
    try {
      if (showArchived) {
        await restoreQuote(quote.id);
        setPage(0);
        toast.success("Cotización restaurada");
        return;
      }

      if (!confirm("¿Archivar esta cotización?")) return;
      await archiveQuote(quote.id);
      setPage(0);
      toast.success("Cotización archivada");
    } catch {
      toast.error(
        showArchived ? "No se pudo restaurar la cotización" : "No se pudo archivar la cotización",
      );
    }
  }

  const firstVisible = filteredQuotes.length === 0 ? 0 : safePage * QUOTES_PAGE_SIZE + 1;
  const lastVisible = Math.min((safePage + 1) * QUOTES_PAGE_SIZE, filteredQuotes.length);

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            {modeQuotes.length} {showArchived ? "archivadas" : "activas"}
            {deferredTerm.trim() ? ` · ${filteredQuotes.length} coincidencias` : ""}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative w-full max-w-xs flex-1 sm:w-auto">
            <label htmlFor="quote-search" className="sr-only">
              Buscar cotizaciones
            </label>
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="quote-search"
              type="search"
              className="w-full pl-9"
              placeholder="Número, cliente, RUT o estado"
              value={term}
              onChange={(event) => handleTermChange(event.target.value)}
            />
          </div>
          <Button
            variant={showArchived ? "secondary" : "outline"}
            onClick={toggleArchived}
            className="shrink-0"
          >
            {showArchived ? "Ver activas" : "Ver archivadas"}
          </Button>
        </div>
      </div>

      {data === undefined ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Cargando cotizaciones…
          </CardContent>
        </Card>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay cotizaciones que coincidan.{" "}
            {!showArchived ? (
              <Link to="/cotizaciones/nueva" className="text-primary underline">
                Crear una nueva
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <QuoteListSection
            title="Pendientes de numeración"
            quotes={visiblePending}
            clientsById={clientsById}
            showArchived={showArchived}
            onDuplicate={handleDuplicate}
            onArchiveToggle={handleArchiveToggle}
          />
          <QuoteListSection
            title="Cotizaciones numeradas"
            quotes={visibleNumbered}
            clientsById={clientsById}
            showArchived={showArchived}
            onDuplicate={handleDuplicate}
            onArchiveToggle={handleArchiveToggle}
          />

          <nav
            className="flex items-center justify-between pt-2"
            aria-label="Paginación de cotizaciones"
          >
            <p className="text-sm text-muted-foreground">
              Mostrando {firstVisible} a {lastVisible} de {filteredQuotes.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 rounded-lg"
                aria-label="Página anterior"
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <span className="min-w-16 text-center text-sm tabular-nums">
                {safePage + 1} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 rounded-lg"
                aria-label="Página siguiente"
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
