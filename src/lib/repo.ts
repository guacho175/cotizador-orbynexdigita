import { db } from "./db";
import { enqueue, finalizeQuote, flushOutbox } from "./sync";
import type { Business, Client, Quote, QuoteItem } from "./types";
import { computeTotals, lineTotal, today } from "./format";

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const nowIso = () => new Date().toISOString();

function kick() {
  void flushOutbox();
}

/* --------------------------------------------------------------- business */

export async function getBusiness(userId: string): Promise<Business | undefined> {
  return db.businesses.where("user_id").equals(userId).first();
}

export async function saveBusiness(business: Business): Promise<Business> {
  const base = await db.businesses.get(business.id);
  const row: Business = {
    ...business,
    next_quote_number: base?.next_quote_number ?? 200,
    pdf_template_key: business.pdf_template_key || base?.pdf_template_key || "standard-v1",
    updated_at: nowIso(),
  };
  await db.businesses.put(row);
  await enqueue({
    entity: "businesses",
    op: "upsert",
    row_id: row.id,
    payload: { ...row },
    base_updated_at: base?.updated_at ?? null,
  });
  kick();
  return row;
}

/* ---------------------------------------------------------------- clients */

export function emptyClient(userId: string): Client {
  return {
    id: uuid(),
    user_id: userId,
    nombre: "",
    rut: "",
    contacto: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
    pdf_template_key: null,
  };
}

export async function saveClient(client: Client): Promise<Client> {
  const base = await db.clients.get(client.id);
  const row: Client = { ...client, updated_at: nowIso(), created_at: base?.created_at ?? nowIso() };
  await db.clients.put(row);
  await enqueue({
    entity: "clients",
    op: "upsert",
    row_id: row.id,
    payload: { ...row },
    base_updated_at: base?.updated_at ?? null,
  });
  kick();
  return row;
}

export async function deleteClient(id: string): Promise<void> {
  await db.clients.delete(id);
  await enqueue({
    entity: "clients",
    op: "delete",
    row_id: id,
    payload: { id },
    base_updated_at: null,
  });
  kick();
}

/* ----------------------------------------------------------------- quotes */

export function emptyQuote(userId: string, ivaPercent: number): Quote {
  return {
    id: uuid(),
    user_id: userId,
    client_id: null,
    numero: null,
    pdf_template_key: null,
    pdf_template_version: null,
    issued_at: null,
    is_archived: false,
    fecha: today(),
    validez_dias: 15,
    estado: "borrador",
    atencion: "",
    subtotal: 0,
    iva: 0,
    total: 0,
    iva_percent: ivaPercent,
    snapshot_negocio: null,
    snapshot_cliente: null,
  };
}

export function emptyItem(quoteId: string, userId: string, orden: number): QuoteItem {
  return {
    id: uuid(),
    quote_id: quoteId,
    user_id: userId,
    orden,
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
    total: 0,
  };
}

export async function getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
  const items = await db.items.where("quote_id").equals(quoteId).toArray();
  return items.sort((a, b) => a.orden - b.orden);
}

/** Persists a quote and its lines locally, then queues them for the server. */
export async function saveQuote(quote: Quote, items: QuoteItem[]): Promise<Quote> {
  const totals = computeTotals(items, quote.iva_percent);
  const baseQuote = await db.quotes.get(quote.id);
  const row: Quote = {
    ...quote,
    ...totals,
    numero: baseQuote?.numero ?? quote.numero,
    pdf_template_key:
      baseQuote?.numero != null || baseQuote?.issued_at
        ? baseQuote.pdf_template_key
        : quote.pdf_template_key,
    pdf_template_version: baseQuote?.pdf_template_version ?? quote.pdf_template_version,
    issued_at: baseQuote?.issued_at ?? quote.issued_at,
    snapshot_negocio: baseQuote?.issued_at ? baseQuote.snapshot_negocio : quote.snapshot_negocio,
    snapshot_cliente: baseQuote?.issued_at ? baseQuote.snapshot_cliente : quote.snapshot_cliente,
    updated_at: nowIso(),
    created_at: baseQuote?.created_at ?? nowIso(),
  };

  const normalized = items.map((item, index) => ({
    ...item,
    orden: index,
    quote_id: quote.id,
    user_id: quote.user_id,
    total: lineTotal(item.cantidad, item.precio_unitario),
    updated_at: nowIso(),
  }));

  const previous = await getQuoteItems(quote.id);
  const removed = previous.filter((prev) => !normalized.some((item) => item.id === prev.id));

  await db.transaction("rw", [db.quotes, db.items], async () => {
    await db.quotes.put(row);
    if (removed.length) await db.items.bulkDelete(removed.map((item) => item.id));
    await db.items.bulkPut(normalized);
  });

  await enqueue({
    entity: "quotes",
    op: "upsert",
    row_id: row.id,
    payload: { ...row },
    base_updated_at: baseQuote?.updated_at ?? null,
  });
  for (const item of normalized) {
    const base = previous.find((prev) => prev.id === item.id);
    await enqueue({
      entity: "quote_items",
      op: "upsert",
      row_id: item.id,
      payload: { ...item },
      base_updated_at: base?.updated_at ?? null,
    });
  }
  for (const item of removed) {
    await enqueue({
      entity: "quote_items",
      op: "delete",
      row_id: item.id,
      payload: { id: item.id },
      base_updated_at: null,
    });
  }

  kick();
  return row;
}

/**
 * Assigns the permanent folio and freezes the resolved PDF template.
 * This is deliberately separate from saveQuote so autosave never consumes a folio.
 */
export async function issueQuote(id: string): Promise<Quote> {
  return finalizeQuote(id);
}

export async function deleteQuote(id: string): Promise<void> {
  const items = await getQuoteItems(id);
  await db.transaction("rw", [db.quotes, db.items], async () => {
    await db.quotes.delete(id);
    await db.items.bulkDelete(items.map((item) => item.id));
  });
  await enqueue({
    entity: "quotes",
    op: "delete",
    row_id: id,
    payload: { id },
    base_updated_at: null,
  });
  kick();
}

export async function archiveQuote(id: string): Promise<void> {
  const baseQuote = await db.quotes.get(id);
  if (!baseQuote) return;
  const row: Quote = { ...baseQuote, is_archived: true, updated_at: nowIso() };
  await db.quotes.put(row);
  await enqueue({
    entity: "quotes",
    op: "upsert",
    row_id: row.id,
    payload: { ...row },
    base_updated_at: baseQuote.updated_at ?? null,
  });
  kick();
}

export async function restoreQuote(id: string): Promise<void> {
  const baseQuote = await db.quotes.get(id);
  if (!baseQuote) return;
  const row: Quote = { ...baseQuote, is_archived: false, updated_at: nowIso() };
  await db.quotes.put(row);
  await enqueue({
    entity: "quotes",
    op: "upsert",
    row_id: row.id,
    payload: { ...row },
    base_updated_at: baseQuote.updated_at ?? null,
  });
  kick();
}

export async function duplicateQuote(id: string, userId: string): Promise<string | null> {
  const source = await db.quotes.get(id);
  if (!source) return null;
  const items = await getQuoteItems(id);
  const copy: Quote = {
    ...source,
    id: uuid(),
    numero: null,
    pdf_template_key: null,
    pdf_template_version: null,
    issued_at: null,
    estado: "borrador",
    fecha: today(),
    created_at: undefined,
    updated_at: undefined,
  };
  const copiedItems = items.map((item, index) => ({
    ...item,
    id: uuid(),
    quote_id: copy.id,
    orden: index,
    created_at: undefined,
    updated_at: undefined,
  }));
  await saveQuote(copy, copiedItems);
  void userId;
  return copy.id;
}
