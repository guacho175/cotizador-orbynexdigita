import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { FileText, CheckCircle2, Clock, Users } from "lucide-react";
import { db } from "@/lib/db";
import { money, formatDate, quoteNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstallPrompt } from "@/components/layout/install-prompt";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Panel — Cotiza" },
      { name: "description", content: "Resumen de tus cotizaciones, montos aceptados y actividad reciente." },
      { property: "og:title", content: "Panel — Cotiza" },
      { property: "og:description", content: "Resumen de tus cotizaciones y actividad reciente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

function Panel() {
  const quotes = useLiveQuery(() => db.quotes.toArray(), [], []) ?? [];
  const clients = useLiveQuery(() => db.clients.count(), [], 0) ?? 0;

  const aceptadas = quotes.filter((quote) => quote.estado === "aceptada");
  const pendientes = quotes.filter((quote) => quote.estado === "enviada");
  const recientes = [...quotes]
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 6);

  const cards = [
    { label: "Cotizaciones", value: String(quotes.length), icon: FileText },
    { label: "Aceptadas", value: money(aceptadas.reduce((acc, q) => acc + q.total, 0)), icon: CheckCircle2 },
    { label: "Pendientes", value: String(pendientes.length), icon: Clock },
    { label: "Clientes", value: String(clients), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
        <p className="text-sm text-muted-foreground">Tu actividad comercial de un vistazo.</p>
      </div>

      <InstallPrompt />

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recientes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no tienes cotizaciones.{" "}
              <Link to="/cotizaciones/nueva" className="text-primary underline">
                Crea la primera
              </Link>
              .
            </p>
          ) : (
            recientes.map((quote) => (
              <Link
                key={quote.id}
                to="/cotizaciones/$id"
                params={{ id: quote.id }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    N° {quoteNumber(quote.numero, quote.folio_cliente)} · {formatDate(quote.fecha)}
                  </p>
                  <p className="text-xs text-muted-foreground">{money(quote.total)}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {quote.estado}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
