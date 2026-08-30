import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  businessTaxLabel,
  canSetIssuedQuoteStatus,
  normalizeQuoteStatus,
  quoteStatusLabel,
  validateQuoteForIssuance,
} from "./quote-lifecycle.ts";
import type { Business, Client, Quote, QuoteItem } from "./types.ts";

const business = {
  nombre: "Orbynex",
  tax_label: "Honorarios",
  iva_percent: 15.25,
} as Business;
const client = { id: "client-1", nombre: "Cliente" } as Client;
const quote = {
  client_id: client.id,
  fecha: "2026-08-30",
  validez_dias: 15,
  iva_percent: 15.25,
  estado: "borrador",
  numero: null,
  issued_at: null,
} as Quote;
const item = {
  descripcion: "Servicio profesional",
  cantidad: 1,
  precio_unitario: 100_000,
} as QuoteItem;

describe("quote lifecycle", () => {
  it("maps the legacy values to the approved customer-facing labels", () => {
    assert.equal(quoteStatusLabel("enviada"), "Realizada");
    assert.equal(quoteStatusLabel("rechazada"), "Pospuesta por el cliente");
  });

  it("keeps unissued quotes as drafts and normalizes issued legacy drafts", () => {
    assert.equal(normalizeQuoteStatus(quote), "borrador");
    assert.equal(
      normalizeQuoteStatus({ ...quote, numero: 200, issued_at: "2026-08-30" }),
      "enviada",
    );
  });

  it("only allows customer follow-up states after issuance", () => {
    assert.equal(canSetIssuedQuoteStatus(quote, "aceptada"), false);
    assert.equal(
      canSetIssuedQuoteStatus({ numero: 200, issued_at: "2026-08-30" }, "aceptada"),
      true,
    );
    assert.equal(
      canSetIssuedQuoteStatus({ numero: 200, issued_at: "2026-08-30" }, "borrador"),
      false,
    );
  });

  it("requires complete commercial data before issuance", () => {
    assert.deepEqual(validateQuoteForIssuance({ quote, items: [item], client, business }), []);
    const issues = validateQuoteForIssuance({
      quote: { ...quote, client_id: null },
      items: [{ ...item, precio_unitario: 0 }],
      client: null,
      business,
    });
    assert.deepEqual(
      issues.map((issue) => issue.field),
      ["client", "items", "total"],
    );
  });

  it("uses a configurable tax label without hardcoded categories", () => {
    assert.equal(businessTaxLabel(business), "Honorarios");
    assert.equal(businessTaxLabel({ tax_label: " " }), "Recargo");
  });
});
