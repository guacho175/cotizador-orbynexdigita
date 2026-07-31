import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const text = "Reposición de tela PVC de 15 oz, en medidas de 720 × 140 cm, incluye diseño e instalación.";

const BASE_RULES = `Eres un asistente experto en redactar cotizaciones comerciales y propuestas de valor para empresas de publicidad, impresión y servicios en Chile.
Reglas estrictas:
- Responde ÚNICAMENTE en español de Chile.
- Mantén un tono sumamente profesional, corporativo y vendedor.
- NUNCA uses markdown (ni asteriscos **, ni numerales #, ni backticks). Todo debe ser texto plano.
- Nunca agregues explicaciones fuera de la estructura requerida.`;

const MEJORAR_PROMPT = `${BASE_RULES}

Tu objetivo es tomar una descripción básica o vaga proporcionada por el usuario y transformarla en un desglose de servicio premium y detallado, que aporte valor y se vea "bacán" (muy atractivo y profesional) para el cliente final.

Estructura tu respuesta EXACTAMENTE de la siguiente forma (una idea por línea):

Línea 1: Título del servicio. Debe estar todo en MAYÚSCULAS, ser atractivo y profesional. Ejemplo: REPOSICIÓN E INSTALACIÓN DE GRÁFICA EN TELA PVC
Línea 2: Especificaciones técnicas (material, medidas, formato). Separa los datos con " | ". Ejemplo: Tela PVC de 15 oz | Formato final: 7,20 x 1,40 m
Línea 3: Párrafo vendedor y descriptivo (1 o 2 oraciones). Explica el valor del servicio de manera integral. Ejemplo: Servicio integral para la renovación de la gráfica publicitaria, considerando la preparación del archivo, producción e instalación final sobre la estructura existente.
Línea 4: Escribe exactamente "El servicio incluye:"
Líneas 5 en adelante: Entre 4 a 6 viñetas detallando el alcance del trabajo paso a paso. Cada viñeta DEBE iniciar con un guion medio y un espacio ("- "). Detalla etapas lógicas (adaptación de diseño, producción, retiro de material antiguo, instalación, revisión final) aunque el usuario no las haya mencionado explícitamente, pero siempre coherentes con el servicio principal.

Recuerda: 
- NO uses asteriscos ni negritas.
- Devuelve SOLAMENTE este texto estructurado.`;

async function test() {
  const envPath = path.join(__dirname, '.env');
  let apiKey = process.env.LOVABLE_API_KEY;
  if (fs.existsSync(envPath)) {
     const env = fs.readFileSync(envPath, 'utf8');
     const match = env.match(/LOVABLE_API_KEY=([^\s]+)/);
     if (match) apiKey = match[1];
  }
  
  if (!apiKey) {
    console.log("NO API KEY");
    return;
  }

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey },
    body: JSON.stringify({
      model: 'google/gemini-3.5-flash',
      messages: [
        { role: 'system', content: MEJORAR_PROMPT },
        { role: 'user', content: `Texto:\n"""${text}"""` }
      ],
      temperature: 0.5,
      max_tokens: 800
    })
  });
  
  console.log("STATUS:", res.status);
  const data = await res.json();
  console.log("RESPONSE:\n" + data.choices?.[0]?.message?.content);
}

test();
