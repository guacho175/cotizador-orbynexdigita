import { supabase } from "@/integrations/supabase/client";
import { db, getMeta, setMeta, type Entity, type OutboxItem } from "./db";
import type { Business, Client, Quote, QuoteItem } from "./types";

/** Fields kept only in IndexedDB and never pushed to the server. */
const LOCAL_ONLY: Record<string, string[]> = {
  businesses: ["logo_data"],
};

function stripLocalOnly(entity: Entity, row: Record<string, unknown>) {
  const clean = { ...row };
  for (const field of LOCAL_ONLY[entity] ?? []) delete clean[field];
  return clean;
}

export async function enqueue(item: Omit<OutboxItem, "seq" | "created_at">) {
  await db.outbox.add({ ...item, created_at: new Date().toISOString() });
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

  const localLogo = (await db.businesses.where("user_id").equals(userId).first())?.logo_data;

  await db.transaction("rw", [db.businesses, db.clients, db.quotes, db.items], async () => {
    await Promise.all([db.businesses.clear(), db.clients.clear(), db.quotes.clear(), db.items.clear()]);
    await db.businesses.bulkPut(
      (businesses.data ?? []).map((row) => ({ ...(row as unknown as Business), logo_data: localLogo ?? null })),
    );
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
      await db.businesses.put({ ...(saved as unknown as Business), logo_data: local?.logo_data ?? null });
    } else if (item.entity === "clients") {
      await db.clients.put(saved as unknown as Client);
    } else if (item.entity === "quotes") {
      await db.quotes.put(saved as unknown as Quote);
    } else {
      await db.items.put(saved as unknown as QuoteItem);
    }
  }

  // Correlative numbering is assigned by the database, never offline.
  if (item.entity === "quotes" && (item.payload as { numero?: number | null }).numero == null) {
    const { data: numero, error: rpcError } = await supabase.rpc("assign_quote_number", {
      _quote_id: item.row_id,
    });
    if (!rpcError && typeof numero === "number") {
      await db.quotes.update(item.row_id, { numero });
    }
  }
}

let flushing = false;

export async function flushOutbox(): Promise<{ pushed: number; failed: number }> {
  if (flushing || !isOnline()) return { pushed: 0, failed: 0 };
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { pushed: 0, failed: 0 };

  flushing = true;
  let pushed = 0;
  let failed = 0;
  try {
    // Sequential, ordered by insertion so dependent writes stay consistent.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = await db.outbox.orderBy("seq").first();
      if (!next) break;
      try {
        await pushItem(next);
        await db.outbox.delete(next.seq!);
        pushed += 1;
      } catch (error) {
        console.error("[sync] push failed", next.entity, error);
        
        // Identify if it is an active rejection from the server (PostgrestError)
        // vs a network error (like TypeError: Failed to fetch).
        // If it's a server error, the request reached the DB but was rejected (e.g. constraints).
        const isPostgrestError = typeof error === 'object' && error !== null && 'code' in error;
        
        if (isPostgrestError) {
          console.warn(`[sync] Unrecoverable server error for ${next.entity}:${next.row_id}. Removing from queue to prevent head-of-line blocking.`);
          await db.outbox.delete(next.seq!);
          failed += 1;
          continue; // Move to the next item instead of blocking the entire queue
        }

        failed += 1;
        break; // Network error or unknown retriable error, break the loop
      }
    }
    if (pushed > 0) await setMeta("last_push_at", new Date().toISOString());
  } finally {
    flushing = false;
  }
  return { pushed, failed };
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
