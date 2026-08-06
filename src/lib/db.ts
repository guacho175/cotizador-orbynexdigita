import Dexie, { type Table } from "dexie";
import type { Business, Client, Quote, QuoteItem } from "./types";

export type Entity = "businesses" | "clients" | "quotes" | "quote_items";

export interface OutboxItem {
  seq?: number;
  entity: Entity;
  op: "upsert" | "delete";
  row_id: string;
  payload: Record<string, unknown>;
  /** updated_at known for the server copy when the local edit started (conflict detection). */
  base_updated_at: string | null;
  created_at: string;
}

export interface ConflictRecord {
  id?: number;
  entity: Entity;
  row_id: string;
  remote: Record<string, unknown>;
  detected_at: string;
  seen: 0 | 1;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

class CotizaDB extends Dexie {
  businesses!: Table<Business, string>;
  clients!: Table<Client, string>;
  quotes!: Table<Quote, string>;
  items!: Table<QuoteItem, string>;
  outbox!: Table<OutboxItem, number>;
  conflicts!: Table<ConflictRecord, number>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super("cotiza-db");
    this.version(2).stores({
      businesses: "id, user_id",
      clients: "id, user_id, nombre",
      quotes: "id, user_id, fecha, numero, estado, client_id, is_archived",
      items: "id, quote_id, user_id, orden",
      outbox: "++seq, entity, row_id",
      conflicts: "++id, entity, row_id, seen",
      meta: "key",
    });
  }
}

export const db = new CotizaDB();

export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const record = await db.meta.get(key);
  return record?.value as T | undefined;
}

/** Wipes every local table. Used on sign-out so the next account starts clean. */
export async function clearLocalData() {
  await db.transaction(
    "rw",
    [db.businesses, db.clients, db.quotes, db.items, db.outbox, db.conflicts, db.meta],
    async () => {
      await Promise.all([
        db.businesses.clear(),
        db.clients.clear(),
        db.quotes.clear(),
        db.items.clear(),
        db.outbox.clear(),
        db.conflicts.clear(),
        db.meta.clear(),
      ]);
    },
  );
}
