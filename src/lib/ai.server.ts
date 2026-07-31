export interface AiRewriteResult {
  text: string;
}

const BASE_RULES = `Eres un asistente de redacción para cotizaciones comerciales en español de Chile.
Reglas estrictas:
- Responde ÚNICAMENTE en español. Nunca escribas en inglés.
- No uses la palabra "Draft", "Brief", "paragraph" ni ningún meta-texto en inglés.
- Nunca inventes ni modifiques cifras, precios, cantidades, porcentajes, plazos numéricos, montos, marcas ni garantías que no estén en el texto original.
- Mantén el idioma original (español) y el sentido técnico exacto del texto original.
- No uses comillas, markdown, asteriscos, negritas ni encabezados con #.
- Devuelve ÚNICAMENTE el resultado final, sin explicaciones, sin comentarios, sin describir tu propio formato de respuesta.`;

const MEJORAR_PROMPT = `${BASE_RULES}

Vas a expandir una descripción breve de producto o servicio a un formato profesional de línea de cotización, con esta estructura EXACTA (texto plano, una idea por línea):

Línea 1: título del servicio en MAYÚSCULAS, corto y directo (máx. 8 palabras).
Línea 2: especificaciones técnicas mencionadas en el texto original (materiales, medidas, formato), separadas por " | ". Si el texto original no da esos datos, omite esta línea por completo.
Línea(s) siguiente(s): un párrafo breve (1-2 frases) que explica en qué consiste el servicio, tono profesional.
Línea con "El servicio incluye:" (o "El trabajo incluye:" si no es un servicio).
3 a 5 líneas siguientes, cada una iniciando con "- ", describiendo las etapas o alcance del trabajo de forma genérica y profesional (preparación, ejecución, revisión final, etc.), coherentes con lo descrito pero sin inventar materiales, medidas ni plazos que el texto original no mencione.

No agregues ninguna línea adicional fuera de esta estructura.
Recuerda: tu respuesta debe ser SOLAMENTE el texto formateado, nada más.`;

const MODES: Record<string, string> = {
  mejorar: MEJORAR_PROMPT,
  ortografia:
    "Corrige únicamente ortografía, tildes, mayúsculas y puntuación de la siguiente descripción. No reescribas el estilo ni cambies la estructura de líneas.",
  breve: "Resume la siguiente descripción en una sola línea, conservando la información esencial.",
};

export function buildMessages(mode: string, text: string) {
  const instruction = MODES[mode] ?? MODES.mejorar;
  const system = mode === "mejorar" ? instruction : `${BASE_RULES}\n\n${instruction}\nMáximo 60 palabras.`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Texto:\n"""${text}"""` },
  ];
}

/** Strip markdown artifacts and meta-text that the model sometimes leaks. */
function sanitize(raw: string): string {
  return raw
    .replace(/\*\*[^*]*\*\*/g, "")       // remove **bold** fragments
    .replace(/^#+\s.*/gm, "")             // remove markdown headings
    .replace(/^>\s.*/gm, "")              // remove blockquotes
    .replace(/`{1,3}[^`]*`{1,3}/g, "")    // remove inline code / code blocks
    .replace(/^\*\s/gm, "- ")             // normalise bullet markers
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n")
    .trim();
}

const ENGLISH_NOISE = /\b(draft|brief|paragraph|summary|overview|here is|note:|output:|response:)\b/i;

/** Quick heuristic: returns true when the response looks like usable Spanish text. */
function looksValid(text: string): boolean {
  if (ENGLISH_NOISE.test(text)) return false;
  if (text.includes("**")) return false;
  // Count common English function-words
  const ENGLISH_WORDS = new Set([
    "the", "and", "this", "with", "for", "that", "from", "have", "will",
    "are", "you", "your", "not", "but", "was", "been", "can", "all",
    "about", "into",
  ]);
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return false;
  const englishCount = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return englishCount / words.length < 0.15;
}

export async function callGateway(mode: string, text: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI no configurada");

  async function attempt(temperature: number): Promise<string> {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey!,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: buildMessages(mode, text),
        temperature,
        max_tokens: 500,
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

    console.log("[ai] raw response:", content);
    return content;
  }

  // First attempt with normal temperature
  let raw = await attempt(0.3);
  let result = sanitize(raw).replace(/^["'`]+|["'`]+$/g, "").trim();

  // If the result looks invalid, retry once with lower temperature
  if (!looksValid(result)) {
    console.warn("[ai] first response failed validation, retrying with lower temperature");
    raw = await attempt(0.1);
    result = sanitize(raw).replace(/^["'`]+|["'`]+$/g, "").trim();

    if (!looksValid(result)) {
      console.error("[ai] second response also failed validation:", result);
      throw new Error("El asistente no pudo generar una respuesta válida. Intenta de nuevo.");
    }
  }

  return result;
}
