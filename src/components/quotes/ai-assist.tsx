import { useState } from "react";
import { Sparkles, SpellCheck, Scissors, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { rewriteDescription } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/hooks/use-sync-status";

const ACTIONS = [
  { mode: "mejorar" as const, label: "Mejorar redacción", icon: Sparkles },
  { mode: "ortografia" as const, label: "Corregir ortografía", icon: SpellCheck },
  { mode: "breve" as const, label: "Hacer más breve", icon: Scissors },
];

export function AiAssist({
  text,
  onResult,
}: {
  text: string;
  onResult: (next: string) => void;
}) {
  const rewrite = useServerFn(rewriteDescription);
  const online = useOnline();
  const [pending, setPending] = useState<string | null>(null);

  async function run(mode: (typeof ACTIONS)[number]["mode"]) {
    if (!online) {
      toast.error("El asistente de redacción necesita conexión a internet.");
      return;
    }
    if (text.trim().length < 3) {
      toast.error("Escribe una descripción antes de usar el asistente.");
      return;
    }
    setPending(mode);
    try {
      const result = await rewrite({ data: { mode, text } });
      onResult(result.text);
      toast.success("Descripción actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo mejorar el texto");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ACTIONS.map((action) => (
        <Button
          key={action.mode}
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={pending !== null}
          onClick={() => void run(action.mode)}
        >
          {pending === action.mode ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <action.icon className="size-3.5" />
          )}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
