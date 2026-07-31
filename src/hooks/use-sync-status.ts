import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { flushOutbox, lastSyncAt } from "@/lib/sync";

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

export function useSyncStatus() {
  const online = useOnline();
  const pending = useLiveQuery(() => db.outbox.count(), [], 0) ?? 0;
  const conflicts = useLiveQuery(() => db.conflicts.where("seen").equals(0).count(), [], 0) ?? 0;
  const [last, setLast] = useState<string | undefined>();

  useEffect(() => {
    void lastSyncAt().then(setLast);
  }, [pending, online]);

  return {
    online,
    pending,
    conflicts,
    last,
    syncNow: async () => {
      await flushOutbox();
      setLast(await lastSyncAt());
    },
    dismissConflicts: async () => {
      await db.conflicts.clear();
    },
  };
}
