import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  flushOutbox,
  lastSyncAt,
  isPulling as checkIsPulling,
  subscribeSyncState,
  pullAll,
} from "@/lib/sync";

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function useSyncStatus(userId?: string) {
  const online = useOnline();
  const pending = useLiveQuery(() => db.outbox.count(), [], 0) ?? 0;
  const conflicts = useLiveQuery(() => db.conflicts.where("seen").equals(0).count(), [], 0) ?? 0;
  const lastPullMeta = useLiveQuery(() => db.meta.get("last_pull_at"), []);
  const lastPullUserMeta = useLiveQuery(() => db.meta.get("last_pull_user_id"), []);
  const [pulling, setPulling] = useState(checkIsPulling());
  const [last, setLast] = useState<string | undefined>();

  useEffect(() => {
    return subscribeSyncState(() => {
      setPulling(checkIsPulling());
    });
  }, []);

  useEffect(() => {
    void lastSyncAt().then(setLast);
  }, [pending, online, lastPullMeta]);

  const hasSyncedOnce = userId
    ? lastPullUserMeta?.value === userId && Boolean(lastPullMeta?.value)
    : Boolean(lastPullMeta?.value);

  const isInitialSyncing = !hasSyncedOnce && (pulling || online);

  return {
    online,
    pending,
    conflicts,
    last,
    isPulling: pulling,
    hasSyncedOnce,
    isInitialSyncing,
    syncNow: async () => {
      await flushOutbox();
      if (userId) {
        await pullAll(userId);
      }
      setLast(await lastSyncAt());
    },
    acknowledgeConflicts: async () => {
      await db.conflicts.where("seen").equals(0).modify({ seen: 1 });
    },
  };
}
