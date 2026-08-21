import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { emptyQuote, uuid } from "@/lib/repo";
import { QuoteEditor } from "@/components/quotes/quote-editor";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/cotizaciones/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva cotización — Cotiza" },
      {
        name: "description",
        content: "Crea una cotización nueva con líneas de detalle, IVA y PDF listo para enviar.",
      },
      { property: "og:title", content: "Nueva cotización — Cotiza" },
      { property: "og:description", content: "Crea una cotización nueva en segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewQuote,
});

function NewQuote() {
  const { user } = Route.useRouteContext();
  const business = useLiveQuery(
    async () => (await db.businesses.where("user_id").equals(user.id).first()) ?? null,
    [user.id],
  );
  const quoteId = useMemo(() => uuid(), []);

  if (business === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  const resolved = business ?? {
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
    next_quote_number: 200,
    color_factura: "#0b2545",
    pdf_template_key: "standard-v1",
  };

  const initialQuote = { ...emptyQuote(user.id, resolved.iva_percent), id: quoteId };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva cotización</h1>
        <p className="text-sm text-muted-foreground">
          El número correlativo se asigna al descargar o compartir el PDF definitivo.
        </p>
      </div>
      <QuoteEditor
        userId={user.id}
        business={resolved}
        initialQuote={initialQuote}
        initialItems={[]}
      />
    </div>
  );
}
