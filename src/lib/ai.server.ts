export interface AiRewriteResult {
  text: string;
}

const BASE_RULES = `Eres un asistente experto en redactar cotizaciones comerciales y propuestas de valor para empresas de publicidad, impresión y servicios en Chile.
Reglas estrictas:
- Responde ÚNICAMENTE en español de Chile.
- Mantén un tono sumamente profesional, corporativo y vendedor.
- NUNCA uses markdown (ni asteriscos **, ni numerales #, ni backticks). Todo debe ser texto plano.
- Nunca agregues explicaciones fuera de la estructura requerida.`;

const MEJORAR_PROMPT = `${BASE_RULES}

Tu objetivo es tomar una descripción básica o vaga proporcionada por el usuario y transformarla en un desglose de servicio premium y detallado, que aporte valor y se vea "bacán" (muy atractivo y profesional) para el cliente final.

Estructura tu respuesta EXACTAMENTE de la siguiente forma (una idea por línea):

Línea 1: Título del servicio. Debe estar todo en MAYÚSCULAS, ser atractivo y profesional.
Línea 2: Especificaciones técnicas (material, medidas, formato). Separa los datos con " | ". Si no hay datos, omite la línea.
Línea 3: Párrafo vendedor y descriptivo (1 o 2 oraciones). Explica el valor del servicio de manera integral.
Línea 4: Escribe exactamente "El servicio incluye:"
Líneas 5 en adelante: Entre 4 a 6 viñetas detallando el alcance del trabajo paso a paso. Cada viñeta DEBE iniciar con un guion medio y un espacio ("- "). Detalla etapas lógicas aunque el usuario no las haya mencionado explícitamente, pero siempre coherentes con el servicio principal.

=== EJEMPLO DE ENTRADA ===
Reposición de tela PVC de 15 oz, en medidas de 720 × 140 cm, incluye diseño e instalación.

=== EJEMPLO DE SALIDA ESPERADA ===
REPOSICIÓN E INSTALACIÓN DE GRÁFICA EN TELA PVC
Tela PVC de 15 oz | Formato final: 7,20 x 1,40 m
Servicio integral para la renovación de la gráfica publicitaria, considerando la preparación del archivo, producción e instalación final sobre la estructura existente.
El servicio incluye:
- Adaptación y preparación del diseño gráfico para impresión.
- Producción e impresión de la nueva tela PVC de 15 oz.
- Retiro del material gráfico existente.
- Instalación, tensado y ajuste final sobre la estructura.
- Revisión de terminaciones y presentación visual.
================================

Recuerda: 
- NO uses asteriscos ni negritas en NINGUNA parte. Todo debe ser texto plano.
- Devuelve SOLAMENTE el texto estructurado como en el ejemplo. No agregues saludos, ni frases como "Aquí tienes", ni despedidas.`;

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

/** Strip markdown markers but KEEP the content they wrap. */
function sanitize(raw: string): string {
  return raw
    .replace(/\*{1,3}/g, "")              // remove *, **, *** markers (keep wrapped text)
    .replace(/^#+\s+/gm, "")              // remove heading markers (keep heading text)
    .replace(/^>\s+/gm, "")               // remove blockquote markers (keep text)
    .replace(/`/g, "")                     // remove backtick markers (keep text)
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
        max_tokens: 800,
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

  // First attempt with slightly higher temperature for creativity
  let raw = await attempt(0.5);
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
