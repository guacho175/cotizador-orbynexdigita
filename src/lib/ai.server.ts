export interface AiRewriteResult {
  text: string;
}

const SYSTEM_PROMPT = `Eres un asistente de redacción para cotizaciones comerciales en español de Chile.
Reglas estrictas:
- Devuelve ÚNICAMENTE el texto corregido, sin comillas, sin explicaciones, sin markdown.
- Nunca inventes ni modifiques cifras, precios, cantidades, porcentajes, plazos numéricos ni montos.
- Mantén el idioma original (español) y el sentido técnico exacto.
- Máximo 60 palabras. Tono profesional, claro y directo.`;

const MODES: Record<string, string> = {
  mejorar:
    "Mejora la redacción de la siguiente descripción de producto o servicio para que suene profesional y clara.",
  ortografia:
    "Corrige únicamente ortografía, tildes, mayúsculas y puntuación de la siguiente descripción. No reescribas el estilo.",
  breve: "Resume la siguiente descripción en una sola línea, conservando la información esencial.",
};

export function buildMessages(mode: string, text: string) {
  const instruction = MODES[mode] ?? MODES.mejorar;
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: `${instruction}\n\nTexto:\n"""${text}"""` },
  ];
}

export async function callGateway(mode: string, text: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI no configurada");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: buildMessages(mode, text),
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (response.status === 429) throw new Error("Límite de solicitudes alcanzado. Intenta en unos minutos.");
  if (response.status === 402) throw new Error("Sin créditos de IA disponibles en el espacio de trabajo.");
  if (!response.ok) {
    console.error("[ai] gateway error", response.status, await response.text());
    throw new Error("El asistente de redacción no está disponible ahora.");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("El asistente no devolvió texto.");
  return content.replace(/^["'`]+|["'`]+$/g, "").trim();
}
