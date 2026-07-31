import { CloudOff, RefreshCw, Cloud, AlertTriangle } from "lucide-react";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SyncIndicator({ className }: { className?: string }) {
  const { online, pending, conflicts, last, syncNow } = useSyncStatus();

  const label = !online
    ? "Sin conexión"
    : pending > 0
      ? `${pending} cambio${pending === 1 ? "" : "s"} por sincronizar`
      : "Todo sincronizado";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          !online
            ? "bg-warning/15 text-warning-foreground"
            : pending > 0
              ? "bg-accent text-accent-foreground"
              : "bg-success/15 text-success",
        )}
        title={last ? `Última sincronización: ${new Date(last).toLocaleString("es-CL")}` : undefined}
      >
        {!online ? <CloudOff className="size-3.5" /> : <Cloud className="size-3.5" />}
        {label}
      </span>
      {conflicts > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-1 text-xs text-destructive">
          <AlertTriangle className="size-3.5" />
          {conflicts} conflicto{conflicts === 1 ? "" : "s"}
        </span>
      ) : null}
      {online && pending > 0 ? (
        <Button size="sm" variant="ghost" onClick={() => void syncNow()} className="h-7 px-2">
          <RefreshCw className="size-3.5" />
          <span className="sr-only">Sincronizar ahora</span>
        </Button>
      ) : null}
    </div>
  );
}
