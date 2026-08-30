import { computeTotals } from "./format.ts";
import type { Business, Client, Estado, Quote, QuoteItem } from "./types.ts";

export const QUOTE_STATUS_OPTIONS: ReadonlyArray<{ value: Estado; label: string }> = [
  { value: "borrador", label: "Borrador" },
  { value: "enviada", label: "Realizada" },
  { value: "aceptada", label: "Aceptada por el cliente" },
  { value: "rechazada", label: "Pospuesta por el cliente" },
];

export const ISSUED_QUOTE_STATUS_OPTIONS = QUOTE_STATUS_OPTIONS.filter(
  (option) => option.value !== "borrador",
);

const STATUS_LABELS = new Map(QUOTE_STATUS_OPTIONS.map((option) => [option.value, option.label]));

export function quoteStatusLabel(status: Estado): string {
  return STATUS_LABELS.get(status) ?? status;
}

export function isIssuedQuote(quote: Pick<Quote, "issued_at" | "numero">): boolean {
  return quote.issued_at != null || quote.numero != null;
}

export function normalizeQuoteStatus(
  quote: Pick<Quote, "estado" | "issued_at" | "numero">,
): Estado {
  if (!isIssuedQuote(quote)) return "borrador";
  return quote.estado === "borrador" ? "enviada" : quote.estado;
}

export function canSetIssuedQuoteStatus(
  quote: Pick<Quote, "issued_at" | "numero">,
  status: Estado,
): boolean {
  return isIssuedQuote(quote) && status !== "borrador";
}

export function businessTaxLabel(business: Pick<Business, "tax_label">): string {
  return business.tax_label?.trim() || "Recargo";
}

export interface QuoteIssuanceContext {
  quote: Quote;
  items: QuoteItem[];
  client: Client | null;
  business: Business;
}

export interface QuoteIssuanceIssue {
  field: "business" | "client" | "fecha" | "validez" | "items" | "total";
  message: string;
}

export function validateQuoteForIssuance({
  quote,
  items,
  client,
  business,
}: QuoteIssuanceContext): QuoteIssuanceIssue[] {
  const issues: QuoteIssuanceIssue[] = [];

  if (!business.nombre.trim()) {
    issues.push({ field: "business", message: "Completa el nombre del negocio antes de emitir." });
  }
  if (!quote.client_id || !client || !client.nombre.trim()) {
    issues.push({ field: "client", message: "Selecciona un cliente válido." });
  }
  if (!quote.fecha) {
    issues.push({ field: "fecha", message: "Selecciona la fecha de la cotización." });
  }
  if (!Number.isFinite(quote.validez_dias) || quote.validez_dias <= 0) {
    issues.push({ field: "validez", message: "La validez debe ser mayor a cero días." });
  }

  const hasIncompleteItem =
    items.length === 0 ||
    items.some(
      (item) =>
        !item.descripcion.trim() ||
        !Number.isFinite(item.cantidad) ||
        item.cantidad <= 0 ||
        !Number.isFinite(item.precio_unitario) ||
        item.precio_unitario <= 0,
    );
  if (hasIncompleteItem) {
    issues.push({
      field: "items",
      message: "Completa la descripción, cantidad y precio de todos los productos o servicios.",
    });
  }

  if (computeTotals(items, quote.iva_percent).subtotal <= 0) {
    issues.push({ field: "total", message: "El valor neto debe ser mayor a cero." });
  }

  return issues;
}
