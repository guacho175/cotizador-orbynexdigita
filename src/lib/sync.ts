import { supabase } from "@/integrations/supabase/client";
import { db, getMeta, setMeta, type Entity, type OutboxItem } from "./db";
import type { Business, Client, Quote, QuoteItem } from "./types";

/** Fields kept only in IndexedDB and never pushed to the server. */
const LOCAL_ONLY: Record<string, string[]> = {
  businesses: ["logo_data"],
};

/** Fields owned by the database and never accepted from normal upsert payloads. */
const SERVER_MANAGED: Partial<Record<Entity, string[]>> = {
  businesses: ["next_quote_number"],
  quotes: ["numero", "pdf_template_version", "issued_at"],
};

let flushPromise: Promise<{ pushed: number; failed: number }> | null = null;

function stripLocalOnly(entity: Entity, row: Record<string, unknown>) {
  const clean = { ...row };
  for (const field of LOCAL_ONLY[entity] ?? []) delete clean[field];
  for (const field of SERVER_MANAGED[entity] ?? []) delete clean[field];
  if (entity === "quotes" && (row.numero != null || row.issued_at != null)) {
    // Once issued, the resolved key is frozen alongside its version.
    delete clean.pdf_template_key;
  }
  return clean;
}

export async function enqueue(item: Omit<OutboxItem, "seq" | "created_at">) {
  await db.transaction("rw", db.outbox, async () => {
    // Never mutate a queue row that pushItem may already be sending. A new row
    // preserves edits made while a network flush is in flight.
    if (flushPromise) {
      await db.outbox.add({ ...item, created_at: new Date().toISOString() });
      return;
    }

    const matches = await db.outbox
      .where("entity")
      .equals(item.entity)
      .and((candidate) => candidate.row_id === item.row_id)
      .sortBy("seq");

    const oldest = matches[0];
    const canCoalesce =
      matches.length > 0 && matches.every((candidate) => candidate.op === item.op);
    if (!oldest?.seq || !canCoalesce) {
      await db.outbox.add({ ...item, created_at: new Date().toISOString() });
      return;
    }

    // Keep the original queue position and conflict base, but collapse the
    // payload to the latest local state for this exact entity/row pair. An
    // upsert/delete transition stays ordered because dependent rows may sit
    // between both operations.
    await db.outbox.update(oldest.seq, {
      op: item.op,
      payload: item.payload,
      base_updated_at: oldest.base_updated_at,
    });

    const duplicateSequences = matches
      .slice(1)
      .map((candidate) => candidate.seq)
      .filter((seq): seq is number => typeof seq === "number");
    if (duplicateSequences.length) await db.outbox.bulkDelete(duplicateSequences);
  });
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/* ------------------------------------------------------------------ pull */

export async function pullAll(userId: string): Promise<void> {
  if (!isOnline()) return;
  const pending = await db.outbox.count();
  if (pending > 0) {
    // Local edits are authoritative until they are pushed.
    await flushOutbox();
    if ((await db.outbox.count()) > 0) return;
  }

  const [businesses, clients, quotes, items] = await Promise.all([
    supabase.from("businesses").select("*").eq("user_id", userId),
    supabase.from("clients").select("*").eq("user_id", userId),
    supabase.from("quotes").select("*").eq("user_id", userId),
    supabase.from("quote_items").select("*").eq("user_id", userId),
  ]);

  const firstError = businesses.error || clients.error || quotes.error || items.error;
  if (firstError) throw firstError;

  const localBusinesses = await db.businesses.where("user_id").equals(userId).toArray();

  const businessesToPut = await Promise.all(
    (businesses.data ?? []).map(async (row) => {
      const localBiz = localBusinesses.find((b) => b.id === row.id);

      let currentLogoData = localBiz?.logo_data ?? null;

      // Si no tenemos logo local o si el path del logo en el servidor es distinto al que teníamos
      if (row.logo_path && (!currentLogoData || localBiz?.logo_path !== row.logo_path)) {
        try {
          const { data, error } = await supabase.storage.from("logos").download(row.logo_path);
          if (data && !error) {
            currentLogoData = await new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(data);
            });
          }
        } catch (e) {
          console.error("[sync] failed to download logo", e);
        }
      }

      return { ...(row as unknown as Business), logo_data: currentLogoData || null };
    }),
  );

  await db.transaction("rw", [db.businesses, db.clients, db.quotes, db.items], async () => {
    await Promise.all([
      db.businesses.clear(),
      db.clients.clear(),
      db.quotes.clear(),
      db.items.clear(),
    ]);
    await db.businesses.bulkPut(businessesToPut);
    await db.clients.bulkPut((clients.data ?? []) as unknown as Client[]);
    await db.quotes.bulkPut((quotes.data ?? []) as unknown as Quote[]);
    await db.items.bulkPut((items.data ?? []) as unknown as QuoteItem[]);
  });

  await setMeta("last_pull_at", new Date().toISOString());
}

/* ------------------------------------------------------------------ push */

async function pushItem(item: OutboxItem): Promise<void> {
  const table = item.entity;

  if (item.op === "delete") {
    const { error } = await supabase.from(table).delete().eq("id", item.row_id);
    if (error) throw error;
    return;
  }

  // Conflict detection: has the server copy changed since our local base?
  const { data: remote } = await supabase
    .from(table)
    .select("*")
    .eq("id", item.row_id)
    .maybeSingle();

  if (
    remote &&
    item.base_updated_at &&
    (remote as { updated_at?: string }).updated_at &&
    new Date((remote as { updated_at: string }).updated_at).getTime() >
      new Date(item.base_updated_at).getTime()
  ) {
    // Local edit wins (last writer), but the remote version is preserved
    // locally so nothing is lost and the user can be informed.
    await db.conflicts.add({
      entity: item.entity,
      row_id: item.row_id,
      remote: remote as Record<string, unknown>,
      detected_at: new Date().toISOString(),
      seen: 0,
    });
  }

  const payload = stripLocalOnly(item.entity, item.payload);
  delete payload.updated_at;
  delete payload.created_at;

  const { data, error } = await supabase
    .from(table)
    .upsert(payload as never, { onConflict: "id" })
    .select()
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const saved = data as Record<string, unknown>;
    if (item.entity === "businesses") {
      const local = await db.businesses.get(item.row_id);
      await db.businesses.put({
        ...(saved as unknown as Business),
        logo_data: local?.logo_data ?? null,
      });
    } else if (item.entity === "clients") {
      await db.clients.put(saved as unknown as Client);
    } else if (item.entity === "quotes") {
      await db.quotes.put(saved as unknown as Quote);
    } else {
      await db.items.put(saved as unknown as QuoteItem);
    }
  }
}

async function runFlushOutbox(): Promise<{ pushed: number; failed: number }> {
  if (!isOnline()) return { pushed: 0, failed: 0 };
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { pushed: 0, failed: 0 };

  let pushed = 0;
  let failed = 0;
  // Sequential, ordered by insertion so dependent writes stay consistent.
  while (true) {
    const next = await db.outbox.orderBy("seq").first();
    if (!next) break;
    try {
      await pushItem(next);
      await db.outbox.delete(next.seq!);
      pushed += 1;
    } catch (error) {
      console.error("[sync] push failed", next.entity, error);
      // Keep rejected changes in the outbox. Silently deleting them loses user
      // data and can let issuance continue with an older server copy.
      failed += 1;
      break;
    }
  }
  if (pushed > 0) await setMeta("last_push_at", new Date().toISOString());
  return { pushed, failed };
}

export function flushOutbox(): Promise<{ pushed: number; failed: number }> {
  if (flushPromise) return flushPromise;
  flushPromise = runFlushOutbox().finally(() => {
    flushPromise = null;
  });
  return flushPromise;
}

/**
 * Flushes the complete local draft before asking the transactional RPC to
 * assign its permanent number and freeze its resolved template.
 */
export async function finalizeQuote(quoteId: string): Promise<Quote> {
  if (!isOnline()) {
    const localQuote = await db.quotes.get(quoteId);
    if (localQuote?.numero != null) return localQuote;
    throw new Error("Necesitas conexión para emitir y numerar la cotización.");
  }

  const result = await flushOutbox();
  if (result.failed > 0 || (await db.outbox.count()) > 0) {
    throw new Error("No se pudo sincronizar el borrador antes de emitir la cotización.");
  }

  const { data: assignedNumber, error: rpcError } = await supabase.rpc("assign_quote_number", {
    _quote_id: quoteId,
  });
  if (rpcError) {
    throw new Error(`No se pudo emitir la cotización: ${rpcError.message}`);
  }
  if (typeof assignedNumber !== "number") {
    throw new Error("La base de datos no devolvió un número de cotización válido.");
  }

  const { data: remoteQuote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  if (quoteError) {
    throw new Error(
      `La cotización fue numerada, pero no se pudo actualizar localmente: ${quoteError.message}`,
    );
  }
  if (!remoteQuote) throw new Error("No se pudo recuperar la cotización emitida.");

  const issued = remoteQuote as unknown as Quote;
  await db.quotes.put(issued);
  return issued;
}

/* -------------------------------------------------------------- lifecycle */

let started = false;

export function startSync(userId: string) {
  const run = () => {
    void flushOutbox();
  };

  void (async () => {
    try {
      await pullAll(userId);
    } catch (error) {
      console.error("[sync] pull failed", error);
    }
  })();

  if (started || typeof window === "undefined") return () => {};
  started = true;

  window.addEventListener("online", run);
  const onVisible = () => {
    if (document.visibilityState === "visible") run();
  };
  document.addEventListener("visibilitychange", onVisible);
  const timer = window.setInterval(run, 30_000);

  return () => {
    window.removeEventListener("online", run);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(timer);
    started = false;
  };
}

export async function lastSyncAt(): Promise<string | undefined> {
  return (await getMeta<string>("last_push_at")) ?? (await getMeta<string>("last_pull_at"));
}
