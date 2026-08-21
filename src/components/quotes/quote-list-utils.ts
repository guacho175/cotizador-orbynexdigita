import type { Client, Quote } from "@/lib/types";

export const QUOTES_PAGE_SIZE = 50;

const clientCollator = new Intl.Collator("es-CL", {
  numeric: true,
  sensitivity: "base",
});

export interface QuoteClientGroup {
  key: string;
  clientId: string | null;
  client: Client | null;
  title: string;
  secondaryLabel: string | null;
  quotes: Quote[];
  pendingQuotes: Quote[];
  numberedQuotes: Quote[];
  total: number;
  kind: "client" | "missing-client" | "without-client";
}

function compareDescending(left?: string, right?: string): number {
  return (right ?? "").localeCompare(left ?? "");
}

function compareStableTieBreakers(left: Quote, right: Quote): number {
  return (
    compareDescending(left.fecha, right.fecha) ||
    compareDescending(left.created_at, right.created_at) ||
    left.id.localeCompare(right.id)
  );
}

/**
 * Pending quotes are intentionally first and remain separate from the numbered
 * sequence. The final tie-breaker makes the result independent of Dexie or
 * Supabase response order.
 */
export function compareQuotesByNumber(left: Quote, right: Quote): number {
  const leftIsPending = left.numero == null;
  const rightIsPending = right.numero == null;

  if (leftIsPending !== rightIsPending) return leftIsPending ? -1 : 1;

  if (leftIsPending && rightIsPending) {
    return (
      compareDescending(left.updated_at, right.updated_at) || compareStableTieBreakers(left, right)
    );
  }

  return (right.numero ?? 0) - (left.numero ?? 0) || compareStableTieBreakers(left, right);
}

export function sortQuotesByNumber(quotes: readonly Quote[]): Quote[] {
  return [...quotes].sort(compareQuotesByNumber);
}

export function buildClientMap(clients: readonly Client[]): Map<string, Client> {
  return new Map(clients.map((client) => [client.id, client]));
}

function normalizeSearch(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL");
}

function readSnapshotValue(snapshot: Record<string, unknown> | null, key: string): string {
  const value = snapshot?.[key];
  return typeof value === "string" ? value : "";
}

export function snapshotClientName(quote: Quote): string {
  return readSnapshotValue(quote.snapshot_cliente, "nombre");
}

export function filterQuotes(
  quotes: readonly Quote[],
  term: string,
  clientsById: ReadonlyMap<string, Client>,
): Quote[] {
  const needle = normalizeSearch(term.trim());
  if (!needle) return [...quotes];

  return quotes.filter((quote) => {
    const client = quote.client_id ? clientsById.get(quote.client_id) : undefined;
    const rawNumber = quote.numero == null ? "" : String(quote.numero);
    const paddedNumber = quote.numero == null ? "" : rawNumber.padStart(5, "0");
    const searchable = [
      rawNumber,
      paddedNumber,
      client?.nombre,
      client?.rut,
      quote.estado,
      snapshotClientName(quote),
      readSnapshotValue(quote.snapshot_cliente, "rut"),
      quote.numero == null ? "pendiente numeracion" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return normalizeSearch(searchable).includes(needle);
  });
}

function groupIdentity(quote: Quote): string {
  return quote.client_id == null ? "without-client" : `client:${quote.client_id}`;
}

function clientGroupMetadata(
  key: string,
  clientId: string | null,
  client: Client | undefined,
  quotes: readonly Quote[],
): Pick<QuoteClientGroup, "title" | "secondaryLabel" | "kind"> {
  if (clientId == null) {
    const snapshotName = quotes.map(snapshotClientName).find(Boolean);
    return {
      title: "Sin cliente",
      secondaryLabel: snapshotName ? `Referencia histórica: ${snapshotName}` : null,
      kind: "without-client",
    };
  }

  if (!client) {
    const snapshotName = quotes.map(snapshotClientName).find(Boolean);
    return {
      title: "Cliente no disponible",
      secondaryLabel: snapshotName || `ID ${clientId.slice(0, 8)}`,
      kind: "missing-client",
    };
  }

  return {
    title: client.nombre || "Cliente sin nombre",
    secondaryLabel: client.rut || `ID ${key.slice(-8)}`,
    kind: "client",
  };
}

export function groupQuotesByClient(
  quotes: readonly Quote[],
  clientsById: ReadonlyMap<string, Client>,
): QuoteClientGroup[] {
  const grouped = new Map<string, Quote[]>();

  for (const quote of quotes) {
    const key = groupIdentity(quote);
    const current = grouped.get(key);
    if (current) current.push(quote);
    else grouped.set(key, [quote]);
  }

  const groups = [...grouped.entries()].map(([key, groupQuotes]) => {
    const clientId = groupQuotes[0]?.client_id ?? null;
    const client = clientId ? clientsById.get(clientId) : undefined;
    const sortedQuotes = sortQuotesByNumber(groupQuotes);
    const firstNumbered = sortedQuotes.findIndex((quote) => quote.numero != null);
    const pendingQuotes =
      firstNumbered === -1 ? sortedQuotes : sortedQuotes.slice(0, firstNumbered);
    const numberedQuotes = firstNumbered === -1 ? [] : sortedQuotes.slice(firstNumbered);
    const metadata = clientGroupMetadata(key, clientId, client, groupQuotes);

    return {
      key,
      clientId,
      client: client ?? null,
      ...metadata,
      quotes: sortedQuotes,
      pendingQuotes,
      numberedQuotes,
      total: groupQuotes.reduce((sum, quote) => sum + quote.total, 0),
    } satisfies QuoteClientGroup;
  });

  return groups.sort((left, right) => {
    if (left.kind === "without-client" || right.kind === "without-client") {
      if (left.kind === right.kind) return left.key.localeCompare(right.key);
      return left.kind === "without-client" ? 1 : -1;
    }

    return clientCollator.compare(left.title, right.title) || left.key.localeCompare(right.key);
  });
}

export function paginateQuotes(
  quotes: readonly Quote[],
  page: number,
  pageSize = QUOTES_PAGE_SIZE,
): Quote[] {
  const safePage = Math.max(0, page);
  return quotes.slice(safePage * pageSize, (safePage + 1) * pageSize);
}
