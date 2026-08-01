import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getQuoteItems } from "@/lib/repo";
import { quoteNumber } from "@/lib/format";
import { QuoteEditor } from "@/components/quotes/quote-editor";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cotizaciones/$id")({
  head: () => ({
    meta: [
      { title: "Editar cotización — Cotiza" },
      { name: "description", content: "Edita las líneas, el cliente y el estado de tu cotización y genera el PDF." },
      { property: "og:title", content: "Editar cotización — Cotiza" },
      { property: "og:description", content: "Edita tu cotización y genera el PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditQuote,
});

function EditQuote() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();

  const data = useLiveQuery(async () => {
    const [quote, items, business] = await Promise.all([
      db.quotes.get(id),
      getQuoteItems(id),
      db.businesses.where("user_id").equals(user.id).first(),
    ]);
    return { quote, items, business };
  }, [id, user.id]);

  if (!data) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  if (!data.quote || !data.business) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No encontramos esta cotización en este dispositivo.
        </p>
        <Button asChild variant="outline">
          <Link to="/cotizaciones">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/cotizaciones">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cotización N° {quoteNumber(data.quote.numero, data.quote.folio_cliente)}
          </h1>
          <p className="text-sm text-muted-foreground">Los cambios se guardan y sincronizan automáticamente.</p>
        </div>
      </div>
      <QuoteEditor
        key={data.quote.id}
        userId={user.id}
        business={data.business}
        initialQuote={data.quote}
        initialItems={data.items}
      />
    </div>
  );
}
