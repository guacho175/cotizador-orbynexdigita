import { GoogleGenAI } from "@google/genai";

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

Recuerda: 
- NO uses asteriscos ni negritas en NINGUNA parte. Todo debe ser texto plano.
- Devuelve SOLAMENTE el texto estructurado. No agregues saludos, ni frases como "Aquí tienes", ni despedidas.`;

const MODES: Record<string, string> = {
  mejorar: MEJORAR_PROMPT,
  ortografia:
    "Corrige únicamente ortografía, tildes, mayúsculas y puntuación de la siguiente descripción. No reescribas el estilo ni cambies la estructura de líneas.",
  breve: "Resume la siguiente descripción en una sola línea, conservando la información esencial.",
};

export function buildMessages(mode: string, text: string) {
  if (mode === "mejorar") {
    return [
      { role: "system" as const, content: MEJORAR_PROMPT },
      {
        role: "user" as const,
        content: `Texto:\n"""Reposición de tela PVC de 15 oz, en medidas de 720 × 140 cm, incluye diseño e instalación."""`,
      },
      {
        role: "assistant" as const,
        content: `REPOSICIÓN E INSTALACIÓN DE GRÁFICA EN TELA PVC\nTela PVC de 15 oz | Formato final: 7,20 x 1,40 m\nServicio integral para la renovación de la gráfica publicitaria, considerando la preparación del archivo, producción e instalación final sobre la estructura existente.\nEl servicio incluye:\n- Adaptación y preparación del diseño gráfico para impresión.\n- Producción e impresión de la nueva tela PVC de 15 oz.\n- Retiro del material gráfico existente.\n- Instalación, tensado y ajuste final sobre la estructura.\n- Revisión de terminaciones y presentación visual.`,
      },
      { role: "user" as const, content: `Texto:\n"""${text}"""` },
    ];
  }

  const instruction = MODES[mode] ?? MODES.mejorar;
  const system = `${BASE_RULES}\n\n${instruction}\nMáximo 60 palabras.`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Texto:\n"""${text}"""` },
  ];
}

/** Strip markdown markers but KEEP the content they wrap. */
function sanitize(raw: string): string {
  return raw
    .replace(/\*{1,3}/g, "") // remove *, **, *** markers (keep wrapped text)
    .replace(/^#+\s+/gm, "") // remove heading markers (keep heading text)
    .replace(/^>\s+/gm, "") // remove blockquote markers (keep text)
    .replace(/`/g, "") // remove backtick markers (keep text)
    .replace(/^\*\s/gm, "- ") // normalise bullet markers
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n")
    .trim();
}

const ENGLISH_NOISE =
  /\b(draft|brief|paragraph|summary|overview|here is|note:|output:|response:)\b/i;

/** Quick heuristic: returns true when the response looks like usable Spanish text. */
function looksValid(text: string): boolean {
  if (ENGLISH_NOISE.test(text)) return false;
  // Count common English function-words
  const ENGLISH_WORDS = new Set([
    "the",
    "and",
    "this",
    "with",
    "for",
    "that",
    "from",
    "have",
    "will",
    "are",
    "you",
    "your",
    "not",
    "but",
    "was",
    "been",
    "can",
    "all",
    "about",
    "into",
  ]);
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return false;
  const englishCount = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return englishCount / words.length < 0.15;
}

// Monthly quota depletion model cache
const blockedModels = new Map<string, number>(); // modelName -> monthIndex (0..11)

function isModelBlocked(model: string): boolean {
  const currentMonth = new Date().getMonth();
  const blockedMonth = blockedModels.get(model);
  if (blockedMonth === undefined) return false;
  if (blockedMonth !== currentMonth) {
    // Reset block if a new month has started
    blockedModels.delete(model);
    return false;
  }
  return true;
}

function blockModel(model: string) {
  const currentMonth = new Date().getMonth();
  blockedModels.set(model, currentMonth);
  console.warn(`[AI Cascade] Model ${model} marked as QUOTA_EXHAUSTED until month reset.`);
}

const DEFAULT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

export async function callGateway(mode: string, text: string): Promise<string> {
  // Parse API keys (supports comma-separated list GEMINI_API_KEYS or single GEMINI_API_KEY)
  const keysInput = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const apiKeys = keysInput
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (apiKeys.length === 0) {
    throw new Error("AI no configurada. Agrega GEMINI_API_KEY en las variables de entorno.");
  }

  async function attempt(temperature: number): Promise<string> {
    let lastError: unknown = null;

    // Try each API Key across available models in cascade
    for (const apiKey of apiKeys) {
      const ai = new GoogleGenAI({ apiKey });
      const messages = buildMessages(mode, text);
      const systemInstruction = messages.find((m) => m.role === "system")?.content;
      const userContent = messages
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      for (const model of DEFAULT_MODELS) {
        if (isModelBlocked(model)) {
          console.log(`[AI Cascade] Skipping ${model} because it is quota blocked for this month.`);
          continue;
        }

        try {
          const response = await ai.models.generateContent({
            model,
            contents: userContent,
            config: {
              systemInstruction,
              temperature,
              maxOutputTokens: 1500,
            },
          });

          const content = response.text?.trim();
          if (content && content.length > 0) {
            return content;
          }
        } catch (err: unknown) {
          lastError = err;
          const errMessage = err instanceof Error ? err.message : String(err);
          const isRateLimit =
            errMessage.includes("429") ||
            errMessage.toLowerCase().includes("quota") ||
            errMessage.toLowerCase().includes("rate");

          if (isRateLimit) {
            blockModel(model);
          }

          console.warn(
            `[AI Cascade] Attempt with model ${model} failed (${isRateLimit ? "Quota 429 - Blocked" : "Error"}). Trying next fallback...`,
          );
          // Continue loop to try next model / next key
        }
      }
    }

    console.error("[AI Cascade] All API keys and model attempts exhausted.", lastError);
    throw new Error(
      "El servicio de IA superó el límite de cuota o no está disponible temporalmente.",
    );
  }

  // First attempt with slightly higher temperature for creativity
  let raw = await attempt(0.5);
  let result = sanitize(raw)
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  // If the result looks invalid, retry once with lower temperature
  if (!looksValid(result)) {
    console.warn("[ai] first response failed validation, retrying with lower temperature");
    raw = await attempt(0.1);
    result = sanitize(raw)
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();

    if (!looksValid(result)) {
      console.error("[ai] second response also failed validation:", result);
      throw new Error("El asistente no pudo generar una respuesta válida. Intenta de nuevo.");
    }
  }

  return result;
}
