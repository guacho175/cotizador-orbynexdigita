import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGateway } from "./ai.server";

const RewriteInput = z.object({
  mode: z.enum(["mejorar", "ortografia", "breve"]),
  text: z.string().trim().min(3, "Escribe al menos 3 caracteres").max(1200, "Texto demasiado largo"),
});

export const rewriteDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => RewriteInput.parse(input))
  .handler(async ({ data }) => {
    const text = await callGateway(data.mode, data.text);
    return { text };
  });
