import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, ChevronDown, Clock, FileText, Users } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, money, quoteNumber } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { OnboardingAlert } from "@/components/layout/onboarding-alert";
import {
  buildClientMap,
  groupQuotesByClient,
  type QuoteClientGroup,
} from "@/components/quotes/quote-list-utils";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Panel — Cotiza" },
      {
        name: "description",
        content: "Resumen de tus cotizaciones, montos aceptados y actividad por cliente.",
      },
      { property: "og:title", content: "Panel — Cotiza" },
      {
        property: "og:description",
        content: "Resumen de tus cotizaciones y actividad por cliente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

function QuoteLink({ quote }: { quote: Quote }) {
  return (
    <Link
      to="/cotizaciones/$id"
      params={{ id: quote.id }}
      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {quote.numero == null ? "Pendiente de numeración" : `N° ${quoteNumber(quote.numero)}`} ·{" "}
          {formatDate(quote.fecha)}
        </p>
        <p className="text-xs text-muted-foreground">{money(quote.total)}</p>
      </div>
      <Badge variant="secondary" className="shrink-0 capitalize">
        {quote.estado}
      </Badge>
    </Link>
  );
}

function QuoteSection({ label, quotes }: { label: string; quotes: Quote[] }) {
  if (quotes.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={label}>
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} ({quotes.length})
      </h3>
      {quotes.map((quote) => (
        <QuoteLink key={quote.id} quote={quote} />
      ))}
    </section>
  );
}

function ClientQuotesAccordion({
  group,
  index,
  isOpen,
  onToggle,
}: {
  group: QuoteClientGroup;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const triggerId = `client-quotes-trigger-${index}`;
  const regionId = `client-quotes-region-${index}`;

  return (
    <Card>
      <h2>
        <button
          id={triggerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={regionId}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{group.title}</span>
            {group.secondaryLabel ? (
              <span className="block truncate text-xs text-muted-foreground">
                {group.secondaryLabel}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-medium tabular-nums">{money(group.total)}</span>
            <span className="block text-xs text-muted-foreground">
              {group.quotes.length === 1 ? "1 cotización" : `${group.quotes.length} cotizaciones`}
            </span>
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </h2>
      <div
        id={regionId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
        className="border-t border-border"
      >
        <CardContent className="space-y-5 py-4">
          <QuoteSection label="Pendientes de numeración" quotes={group.pendingQuotes} />
          <QuoteSection label="Cotizaciones numeradas" quotes={group.numberedQuotes} />
        </CardContent>
      </div>
    </Card>
  );
}

function Panel() {
  const { user } = Route.useRouteContext();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const data = useLiveQuery(async () => {
    const [quotes, clients] = await Promise.all([
      db.quotes.where("user_id").equals(user.id).toArray(),
      db.clients.where("user_id").equals(user.id).toArray(),
    ]);
    return { quotes, clients };
  }, [user.id]);

  const activeQuotes = useMemo(
    () => data?.quotes.filter((quote) => !quote.is_archived) ?? [],
    [data?.quotes],
  );
  const groups = useMemo(
    () => groupQuotesByClient(activeQuotes, buildClientMap(data?.clients ?? [])),
    [activeQuotes, data?.clients],
  );
  const acceptedQuotes = activeQuotes.filter((quote) => quote.estado === "aceptada");
  const sentQuotes = activeQuotes.filter((quote) => quote.estado === "enviada");

  const cards = [
    { label: "Cotizaciones", value: String(activeQuotes.length), icon: FileText },
    {
      label: "Aceptadas",
      value: money(acceptedQuotes.reduce((sum, quote) => sum + quote.total, 0)),
      icon: CheckCircle2,
    },
    { label: "Pendientes", value: String(sentQuotes.length), icon: Clock },
    { label: "Clientes", value: String(data?.clients.length ?? 0), icon: Users },
  ];

  function toggleGroup(key: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
        <p className="text-sm text-muted-foreground">
          Tu actividad comercial activa, agrupada por cliente.
        </p>
      </div>

      <InstallPrompt />
      <OnboardingAlert />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <span className="rounded-lg bg-accent p-2 text-accent-foreground">
                <card.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-semibold tabular-nums">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3" aria-labelledby="quotes-by-client-title">
        <div>
          <h2 id="quotes-by-client-title" className="text-base font-semibold">
            Cotizaciones por cliente
          </h2>
          <p className="text-sm text-muted-foreground">
            Las archivadas no se incluyen en este resumen.
          </p>
        </div>

        {data === undefined ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Cargando cotizaciones…
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Todavía no tienes cotizaciones activas.{" "}
              <Link to="/cotizaciones/nueva" className="text-primary underline">
                Crea la primera
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          groups.map((group, index) => (
            <ClientQuotesAccordion
              key={group.key}
              group={group}
              index={index}
              isOpen={openGroups.has(group.key)}
              onToggle={() => toggleGroup(group.key)}
            />
          ))
        )}
      </section>
    </div>
  );
}
