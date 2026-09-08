import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const VIEWPORT = { width: 1920, height: 1080 };
const RECORD_DIR = path.resolve("demo_recordings/ai_showcase");
const OUTPUT_MP4 = path.resolve("public/assets/videos/demo_asistente_ia_orbynex.mp4");
const LOGO_FILE = path.resolve("public/assets/logos/logo_orbynex_horizontal_claro_v2.png");

const timestamps = [];
let videoStartTime = null;

function recordTimestamp(label) {
  const elapsedSeconds = videoStartTime ? Math.round((Date.now() - videoStartTime) / 1000) : 0;
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  timestamps.push({ label, time: timeFormatted, seconds: elapsedSeconds });
  console.log(`⏱️ [${timeFormatted}] ${label}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let currentX = 960;
let currentY = 540;

async function smoothMouseMove(page, targetX, targetY, steps = 24) {
  const startX = currentX;
  const startY = currentY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const x = Math.round(startX + (targetX - startX) * ease);
    const y = Math.round(startY + (targetY - startY) * ease);
    await page.mouse.move(x, y);
    await sleep(15);
  }
  currentX = targetX;
  currentY = targetY;
}

async function hoverAndClick(page, selectorOrLocator, pauseAfter = 1800) {
  let locator;
  if (typeof selectorOrLocator === "string") {
    locator = page.locator(selectorOrLocator).first();
  } else {
    locator = selectorOrLocator;
  }
  await locator.waitFor({ state: "visible", timeout: 15000 });
  const box = await locator.boundingBox();
  if (box) {
    const targetX = Math.round(box.x + box.width / 2);
    const targetY = Math.round(box.y + box.height / 2);
    await smoothMouseMove(page, targetX, targetY);
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  } else {
    await locator.click();
  }
  await sleep(pauseAfter);
}

async function humanType(page, selectorOrLocator, text, delay = 60, pauseAfter = 1400) {
  let locator;
  if (typeof selectorOrLocator === "string") {
    locator = page.locator(selectorOrLocator).first();
  } else {
    locator = selectorOrLocator;
  }
  await locator.waitFor({ state: "visible", timeout: 15000 });
  const box = await locator.boundingBox();
  if (box) {
    await smoothMouseMove(page, Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
    await sleep(300);
    await page.mouse.down();
    await sleep(100);
    await page.mouse.up();
  } else {
    await locator.click();
  }
  await sleep(200);
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await sleep(120);
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(delay + Math.floor(Math.random() * 20));
  }
  await sleep(pauseAfter);
}

async function smoothScroll(page, targetScrollY, steps = 25) {
  const currentScrollY = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const y = Math.round(currentScrollY + (targetScrollY - currentScrollY) * ease);
    await page.evaluate((pos) => window.scrollTo(0, pos), y);
    await sleep(25);
  }
}

async function main() {
  console.log("🎬 Iniciando grabación de video enfocada en Asistente de IA ('Mejorar redacción') y Logo...");

  if (!fs.existsSync(RECORD_DIR)) {
    fs.mkdirSync(RECORD_DIR, { recursive: true });
  } else {
    for (const f of fs.readdirSync(RECORD_DIR)) {
      if (f.endsWith(".webm") || f.endsWith(".mp4")) {
        try { fs.unlinkSync(path.join(RECORD_DIR, f)); } catch (_) {}
      }
    }
  }

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: RECORD_DIR, size: VIEWPORT },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Inyectar cursor animado elegante
  await page.addInitScript(() => {
    const cursor = document.createElement("div");
    cursor.id = "playwright-mouse-pointer";
    cursor.style.cssText = `
      position: fixed; top: 0; left: 0; width: 22px; height: 22px; border-radius: 50%;
      background: rgba(14, 165, 233, 0.8); border: 2.5px solid #ffffff;
      box-shadow: 0 0 14px rgba(14, 165, 233, 0.9), 0 0 25px rgba(14, 165, 233, 0.5);
      pointer-events: none; z-index: 2147483647; transform: translate(-50%, -50%);
      transition: transform 0.08s ease, background 0.15s ease;
    `;
    const pulseRing = document.createElement("div");
    pulseRing.id = "playwright-mouse-ring";
    pulseRing.style.cssText = `
      position: fixed; top: 0; left: 0; width: 42px; height: 42px; border-radius: 50%;
      border: 1.5px solid rgba(14, 165, 233, 0.45); pointer-events: none;
      z-index: 2147483646; transform: translate(-50%, -50%);
      transition: transform 0.15s ease, opacity 0.15s ease;
    `;
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(pulseRing);
      document.body.appendChild(cursor);
    });
    window.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`;
      pulseRing.style.left = `${e.clientX}px`; pulseRing.style.top = `${e.clientY}px`;
    });
    window.addEventListener("mousedown", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
      cursor.style.background = "rgba(236, 72, 153, 0.95)";
      pulseRing.style.transform = "translate(-50%, -50%) scale(1.35)";
      pulseRing.style.borderColor = "rgba(236, 72, 153, 0.75)";
    });
    window.addEventListener("mouseup", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      cursor.style.background = "rgba(14, 165, 233, 0.8)";
      pulseRing.style.transform = "translate(-50%, -50%) scale(1)";
      pulseRing.style.borderColor = "rgba(14, 165, 233, 0.45)";
    });
  });

  videoStartTime = Date.now();

  // =========================================================================
  // PASO 1: LOGIN RÁPIDO Y DESTACADO DE LA PROPUESTA
  // =========================================================================
  recordTimestamp("1. Acceso a la Plataforma");
  await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle" });
  await sleep(1500);

  // Destacar el badge "Redacción asistida por IA" en la columna izquierda
  await smoothMouseMove(page, 430, 390);
  await sleep(1500);

  // Login
  await humanType(page, "#login-email", "demo.orbynex@gmail.com", 60, 900);
  await humanType(page, "#login-password", "PasswordDemo2026!", 60, 900);
  const submitLogin = page.locator('button:has-text("Entrar a mi cuenta")').first();
  await hoverAndClick(page, submitLogin, 2200);

  await page.waitForURL("**/panel**");
  await sleep(1800);

  // =========================================================================
  // PASO 2: MI NEGOCIO — SUBIDA Y VISUALIZACIÓN DEL LOGO EMPRESARIAL
  // =========================================================================
  recordTimestamp("2. Mi Negocio — Subida de Logo Empresarial");
  const navNegocio = page.locator('a[href="/negocio"]').first();
  await hoverAndClick(page, navNegocio, 1800);

  await page.waitForURL("**/negocio**");
  await sleep(1500);

  // Mover cursor a la sección del Logo para demostrar la subida
  const logoInput = page.locator('input#logo');
  const logoBox = page.locator('div:has(> img[alt="Logo actual"]), div:has-text("Sin logo")').first();
  const box = await logoBox.boundingBox();
  if (box) {
    await smoothMouseMove(page, Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
    await sleep(800);
  }

  // Cargar el archivo de logo
  console.log(`Subiendo logo oficial desde: ${LOGO_FILE}`);
  await logoInput.setInputFiles(LOGO_FILE);
  
  // Pausa clara con el cursor sobre el logo recién subido para que se vea nítido
  await sleep(1000);
  const logoImg = page.locator('img[alt="Logo actual"]').first();
  await logoImg.waitFor({ state: "visible", timeout: 8000 });
  const logoImgBox = await logoImg.boundingBox();
  if (logoImgBox) {
    await smoothMouseMove(page, Math.round(logoImgBox.x + logoImgBox.width / 2), Math.round(logoImgBox.y + logoImgBox.height / 2));
  }
  await sleep(3000); // 3 segundos para que el usuario aprecie el logo en pantalla

  // Datos corporativos
  await humanType(page, "#biz-nombre", "Orbynex Servicios Tecnológicos SpA", 40, 600);
  await humanType(page, "#biz-rut", "77.456.123-K", 45, 600);
  await humanType(page, "#biz-giro", "Soluciones de Software y Gráfica Publicitaria", 40, 600);
  await humanType(page, "#biz-direccion", "Av. Providencia 1208, Santiago", 40, 600);

  // Guardar cambios
  const saveBiz = page.locator('button:has-text("Guardar cambios")').first();
  await smoothScroll(page, 450, 20);
  await hoverAndClick(page, saveBiz, 2200);

  // =========================================================================
  // PASO 3: GESTIÓN DE CLIENTES
  // =========================================================================
  recordTimestamp("3. Gestión de Clientes — Cartera Empresarial");
  const navClientes = page.locator('a[href="/clientes"]').first();
  await hoverAndClick(page, navClientes, 1800);

  await page.waitForURL("**/clientes**");
  await sleep(1200);

  const clientExists = await page.locator('text="Inversiones del Maule"').isVisible().catch(() => false);
  if (!clientExists) {
    const newBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear tu primer cliente")').first();
    await hoverAndClick(page, newBtn, 1200);
    await humanType(page, 'input[name="nombre"]', "Inversiones del Maule Ltda.", 45, 600);
    await humanType(page, 'input[name="rut"]', "76.892.451-9", 50, 600);
    await humanType(page, 'input[name="contacto"]', "Rodrigo Morales Donoso", 45, 600);
    await humanType(page, 'input[name="email"]', "rmorales@inversionesdelmaule.cl", 45, 600);
    const saveClient = page.locator('div[role="dialog"] button:has-text("Guardar")').first();
    await hoverAndClick(page, saveClient, 2000);
  } else {
    // Breve paneo sobre la tarjeta del cliente
    await smoothMouseMove(page, 550, 280);
    await sleep(1500);
  }

  // =========================================================================
  // PASO 4: NUEVA COTIZACIÓN — EL PODER DEL ASISTENTE DE IA
  // =========================================================================
  recordTimestamp("4. Nueva Cotización — Preparación de Propuesta");
  const navNuevaCot = page.locator('header a[href="/cotizaciones/nueva"]').first();
  await hoverAndClick(page, navNuevaCot, 2000);

  await page.waitForURL("**/cotizaciones/nueva**");
  await sleep(1500);

  // Seleccionar cliente
  const clientSelect = page.locator("button#cliente, button:has-text('Selecciona un cliente')").first();
  await hoverAndClick(page, clientSelect, 1000);
  const clientOption = page.locator('[role="option"]:has-text("Inversiones del Maule")').first();
  await hoverAndClick(page, clientOption, 1200);

  // Validez a 30 días
  await humanType(page, "#validez", "30", 70, 800);

  // -------------------------------------------------------------------------
  // MAGIA IA 1: Escribir solo "pagina web" -> ASISTENTE DE IA LO TRANSFORMA
  // -------------------------------------------------------------------------
  recordTimestamp("4.1. Asistente IA — Input ambiguo: 'pagina web'");
  const item1Area = page.locator('textarea[placeholder="Descripción del producto o servicio"]').first();
  
  // Escribir solo la frase ambigua "pagina web"
  await humanType(page, item1Area, "pagina web", 75, 2200);

  // Pausa deliberada para que el espectador vea el texto simple
  await smoothMouseMove(page, 450, 380);
  await sleep(1800);

  // Mover cursor hacia el botón "Mejorar redacción" (icono Sparkles)
  recordTimestamp("4.2. Asistente IA — Clic en 'Mejorar redacción'");
  const aiButton1 = page.locator('button:has-text("Mejorar redacción")').first();
  await hoverAndClick(page, aiButton1, 500);

  // Esperar a que la IA complete el texto en la base de datos / UI
  console.log("Esperando respuesta del Asistente de IA para 'pagina web'...");
  await page.waitForFunction(() => {
    const ta = document.querySelector('textarea[placeholder="Descripción del producto o servicio"]');
    return ta && ta.value.length > 50;
  }, { timeout: 20000 });

  recordTimestamp("4.3. Asistente IA — Resultado Expandido y Profesional");
  // Mover cursor suavemente sobre la descripción enriquecida para que el usuario la lea
  await smoothMouseMove(page, 650, 420);
  await sleep(4000); // 4 segundos de apreciación completa

  // Precio unitario ítem 1
  const price1 = page.locator('.w-32 input').first();
  await humanType(page, price1, "1850000", 65, 1200);

  // -------------------------------------------------------------------------
  // MAGIA IA 2: Escribir "tarjetas de presentacion" -> DESGLOSE TÉCNICO
  // -------------------------------------------------------------------------
  recordTimestamp("4.4. Asistente IA — Segunda Línea: 'tarjetas de presentacion'");
  const addLine = page.locator('button:has-text("Agregar línea")').first();
  await hoverAndClick(page, addLine, 1500);

  const item2Area = page.locator('textarea[placeholder="Descripción del producto o servicio"]').nth(1);
  await smoothScroll(page, 480, 20);
  
  // Escribir solo "tarjetas de presentacion"
  await humanType(page, item2Area, "tarjetas de presentacion", 70, 2200);

  // Pausa para que se note la entrada sencilla
  await smoothMouseMove(page, 450, 600);
  await sleep(1800);

  // Clic en "Mejorar redacción" de la Línea 2
  recordTimestamp("4.5. Asistente IA — Transformación de Tarjetas de Presentación");
  const aiButton2 = page.locator('button:has-text("Mejorar redacción")').nth(1);
  await hoverAndClick(page, aiButton2, 500);

  console.log("Esperando respuesta del Asistente de IA para 'tarjetas de presentacion'...");
  await page.waitForFunction(() => {
    const all = document.querySelectorAll('textarea[placeholder="Descripción del producto o servicio"]');
    return all.length > 1 && all[1].value.length > 50;
  }, { timeout: 20000 });

  recordTimestamp("4.6. Asistente IA — Detalle Técnico Generado");
  // Recorrido visual del resultado
  await smoothMouseMove(page, 650, 680);
  await sleep(4000); // 4 segundos para leer las viñetas técnicas (couché, termolaminado, etc.)

  // Cantidad y Precio unitario ítem 2
  const qty2 = page.locator('.w-20 input').nth(1);
  await humanType(page, qty2, "5", 80, 800);

  const price2 = page.locator('.w-32 input').nth(1);
  await humanType(page, price2, "85000", 65, 1200);

  // Scroll a totales
  recordTimestamp("4.7. Verificación de Totales en CLP y Guardado");
  await smoothScroll(page, 800, 20);
  await sleep(2500);

  const saveQuoteBtn = page.locator('div.sticky button:has-text("Guardar")').first();
  await hoverAndClick(page, saveQuoteBtn, 2500);

  // =========================================================================
  // PASO 5: VISTA PREVIA Y PDF — LOGO EMPRESARIAL + DESCRIPCIONES DE IA
  // =========================================================================
  recordTimestamp("5. Vista Previa en PDF — Integración de Logo e IA");
  const previewBtn = page.locator('div.sticky button:has-text("Vista previa")').first();
  await hoverAndClick(page, previewBtn, 3500);

  const pdfFrame = page.locator('iframe[title="Vista previa del PDF"]');
  await pdfFrame.waitFor({ state: "visible", timeout: 25000 });
  await sleep(4000);

  // Recorrer el PDF en la vista previa: destacar el logo en el encabezado y el texto en las partidas
  recordTimestamp("5.1. Recorrido del PDF Oficial con Logo y Textos de IA");
  await smoothMouseMove(page, 960, 320); // Encabezado / Logo
  await sleep(2000);
  await smoothMouseMove(page, 960, 520); // Partidas con redacción de IA
  await sleep(3500);

  // Descargar PDF
  recordTimestamp("5.2. Emisión Oficial y Descarga");
  const downloadBtn = page.locator('div[role="dialog"] button:has-text("Descargar")').first();
  await hoverAndClick(page, downloadBtn, 1800);

  const conIvaBtn = page.locator('button:has-text("Con IVA")').first();
  await hoverAndClick(page, conIvaBtn, 4000);

  await sleep(3000);

  // Cerrar navegador
  await page.close();
  await context.close();
  await browser.close();

  console.log("\n🎉 Grabación del showcase de IA completada con éxito!");

  const rawFiles = fs.readdirSync(RECORD_DIR).filter((f) => f.endsWith(".webm"));
  if (rawFiles.length === 0) throw new Error("No se encontró video grabado");

  const rawWebm = path.join(RECORD_DIR, rawFiles[0]);
  console.log(`📁 Video grabado en: ${rawWebm}`);

  console.log("⚙️ Convirtiendo a MP4 de alta resolución...");
  const ffmpegCmd = `ffmpeg -y -i "${rawWebm}" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 30 "${OUTPUT_MP4}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });
  console.log(`✅ MP4 de alta resolución generado en: ${OUTPUT_MP4}`);

  fs.writeFileSync(
    "public/assets/videos/timestamps_ai_showcase.json",
    JSON.stringify(timestamps, null, 2),
    "utf8"
  );
}

main().catch((err) => {
  console.error("❌ Error durante la grabación de IA:", err);
  process.exit(1);
});
