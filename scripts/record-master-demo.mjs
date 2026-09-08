import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const VIEWPORT = { width: 1920, height: 1080 };
const RECORD_DIR = path.resolve("demo_recordings/master");
const OUTPUT_MP4 = path.resolve("public/assets/videos/tutorial_demo_orbynex_master.mp4");
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

async function humanType(page, selectorOrLocator, text, delay = 55, pauseAfter = 1400) {
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
  console.log("🎬 Iniciando grabación MASTER: Landing, Registro en vivo, Logo, Clientes, Magia IA y PDF...");

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

  // Inyectar cursor interactivo animado
  await page.addInitScript(() => {
    const cursor = document.createElement("div");
    cursor.id = "playwright-mouse-pointer";
    cursor.style.cssText = `
      position: fixed; top: 0; left: 0; width: 22px; height: 22px; border-radius: 50%;
      background: rgba(14, 165, 233, 0.85); border: 2.5px solid #ffffff;
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
      cursor.style.background = "rgba(14, 165, 233, 0.85)";
      pulseRing.style.transform = "translate(-50%, -50%) scale(1)";
      pulseRing.style.borderColor = "rgba(14, 165, 233, 0.45)";
    });
  });

  videoStartTime = Date.now();

  // =========================================================================
  // BLOQUE 1: LANDING PAGE (/)
  // =========================================================================
  recordTimestamp("1. Landing Page — Portada y Presentación");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await sleep(2000);

  // Mover cursor sobre Hero
  await smoothMouseMove(page, 960, 260);
  await sleep(1800);

  // Recorrido visual al mockup
  recordTimestamp("1.1. Landing Page — Mockup y Bento Grid");
  await smoothScroll(page, 550, 25);
  await smoothMouseMove(page, 960, 520);
  await sleep(2000);

  // Scroll a Bento Grid
  await smoothScroll(page, 1150, 30);
  await smoothMouseMove(page, 620, 680);
  await sleep(1500);

  // Retorno al Hero
  await smoothScroll(page, 0, 30);
  await sleep(1500);

  // Clic en "Comenzar ahora gratis"
  recordTimestamp("1.2. Landing Page — Clic en Comenzar Ahora");
  const ctaBtn = page.locator('a:has-text("Comenzar ahora gratis")').first();
  await hoverAndClick(page, ctaBtn, 2000);

  // =========================================================================
  // BLOQUE 2: AUTENTICACIÓN — CREAR CUENTA EN VIVO (/auth)
  // =========================================================================
  recordTimestamp("2. Autenticación — Pestaña Crear Cuenta");
  await page.waitForURL("**/auth**");
  await sleep(2000);

  // Clic en la pestaña "Crear cuenta"
  const signupTab = page.locator('button:has-text("Crear cuenta")').first();
  await hoverAndClick(page, signupTab, 1800);

  // Generar correo único para registro real sin conflictos
  const uniqueId = Math.floor(Math.random() * 9000 + 1000);
  const demoEmail = `contacto.morales${uniqueId}@orbynex.cl`;

  // Llenar formulario de registro en vivo
  recordTimestamp("2.1. Registro en Vivo — Datos de Usuario");
  await humanType(page, "#signup-name", "Rodrigo Morales Donoso", 55, 1100);
  await humanType(page, "#signup-email", demoEmail, 60, 1100);
  await humanType(page, "#signup-password", "PasswordDemo2026!", 60, 1100);

  // Demostración del ojo de contraseña
  recordTimestamp("2.2. Autenticación — Alternar Visibilidad de Contraseña");
  const toggleEye = page.locator('button[aria-label="Ver contraseña"]').first();
  await hoverAndClick(page, toggleEye, 2000);
  const hideEye = page.locator('button[aria-label="Ocultar contraseña"]').first();
  await hoverAndClick(page, hideEye, 1500);

  // Enviar formulario de registro (Crear cuenta)
  recordTimestamp("2.3. Registro Exitoso — Acceso Directo al Panel");
  const submitSignup = page.locator('button:has-text("Crear cuenta")').last();
  await hoverAndClick(page, submitSignup, 2500);

  // Esperar navegación automática al panel
  await page.waitForURL("**/panel**");
  await sleep(2500);

  // =========================================================================
  // BLOQUE 3: MI NEGOCIO — SUBIDA VISIBLE DE LOGO Y DATOS CORPORATIVOS (/negocio)
  // =========================================================================
  recordTimestamp("3. Mi Negocio — Acceso e Identidad Corporativa");
  const navNegocio = page.locator('a[href="/negocio"]').first();
  await hoverAndClick(page, navNegocio, 2000);

  await page.waitForURL("**/negocio**");
  await sleep(1500);

  // SUBIDA CLARA DEL LOGO: Mover el cursor directamente al área de carga
  recordTimestamp("3.1. Mi Negocio — Carga Visible del Logotipo Oficial");
  const logoInput = page.locator('input#logo');
  const logoBox = page.locator('label[for="logo"]').first();
  const box = await logoBox.boundingBox();
  if (box) {
    await smoothMouseMove(page, Math.round(box.x + 80), Math.round(box.y + 40));
    await sleep(600);
  }

  console.log(`Subiendo logotipo oficial desde: ${LOGO_FILE}`);
  await logoInput.setInputFiles(LOGO_FILE);

  // Esperar a que el logo se muestre en el recuadro y pausar 3 segundos para que se aprecie
  await sleep(1000);
  const logoImg = page.locator('img[alt="Logo actual"]').first();
  await logoImg.waitFor({ state: "visible", timeout: 8000 });
  const logoImgBox = await logoImg.boundingBox();
  if (logoImgBox) {
    await smoothMouseMove(page, Math.round(logoImgBox.x + logoImgBox.width / 2), Math.round(logoImgBox.y + logoImgBox.height / 2));
  }
  await sleep(3000); // 3 segundos para destacar la presencia del logo

  // Llenar datos de la empresa
  recordTimestamp("3.2. Mi Negocio — Datos de Facturación y Condiciones");
  await humanType(page, "#biz-nombre", "Orbynex Servicios Tecnológicos SpA", 45, 800);
  await humanType(page, "#biz-rut", "77.456.123-K", 50, 800);
  await humanType(page, "#biz-giro", "Soluciones de Software y Gráfica Publicitaria", 45, 800);
  await humanType(page, "#biz-direccion", "Av. Providencia 1208, Of. 602, Santiago", 45, 800);
  await humanType(page, "#biz-telefono", "+56 9 8765 4321", 50, 800);
  await humanType(page, "#biz-email", "contacto@orbynex.cl", 50, 800);
  await humanType(page, "#biz-sitio_web", "https://orbynex.cl", 50, 900);

  // Scroll a Datos de transferencia y condiciones
  await smoothScroll(page, 650, 20);
  await sleep(1000);

  await humanType(page, "#bank-banco_nombre", "Banco de Chile", 50, 700);
  await humanType(page, "#bank-banco_tipo_cuenta", "Cuenta Corriente", 50, 700);
  await humanType(page, "#bank-banco_numero_cuenta", "00-123-45678-90", 50, 700);
  await humanType(page, "#bank-banco_titular", "Orbynex Servicios Tecnológicos SpA", 45, 700);
  await humanType(page, "#bank-banco_rut", "77.456.123-K", 50, 700);

  await smoothScroll(page, 950, 20);
  await sleep(800);

  await humanType(
    page,
    "#condiciones",
    "Pago 50% de anticipo al inicio y 50% contra entrega conforme. Validez de oferta: 30 días corridos. Transferencia bancaria directa.",
    40,
    1200
  );

  // Guardar cambios
  recordTimestamp("3.3. Mi Negocio — Guardado Exitoso");
  const saveBiz = page.locator('button:has-text("Guardar cambios")').first();
  await hoverAndClick(page, saveBiz, 2500);

  // =========================================================================
  // BLOQUE 4: GESTIÓN DE CLIENTES — REGISTRO LIMPIO POR PRIMERA VEZ (/clientes)
  // =========================================================================
  recordTimestamp("4. Clientes — Acceso a Cartera y Creación de Primer Cliente");
  const navClientes = page.locator('a[href="/clientes"]').first();
  await hoverAndClick(page, navClientes, 2000);

  await page.waitForURL("**/clientes**");
  await sleep(1500);

  // Clic en el botón "Crear tu primer cliente" o "Nuevo"
  const newClientBtn = page.locator('button:has-text("Crear tu primer cliente"), button:has-text("Nuevo")').first();
  await hoverAndClick(page, newClientBtn, 1500);

  // Modal de registro de cliente
  recordTimestamp("4.1. Clientes — Registro de Inversiones del Maule Ltda.");
  await humanType(page, 'input[name="nombre"]', "Inversiones del Maule Ltda.", 50, 800);
  await humanType(page, 'input[name="rut"]', "76.892.451-9", 55, 800);
  await humanType(page, 'input[name="contacto"]', "Rodrigo Morales Donoso", 50, 800);
  await humanType(page, 'input[name="email"]', "rmorales@inversionesdelmaule.cl", 50, 800);
  await humanType(page, 'input[name="telefono"]', "+56 9 7654 3210", 55, 800);
  await humanType(page, 'input[name="direccion"]', "Av. San Isidro 450, Talca / Las Condes, Santiago", 45, 800);
  await humanType(page, 'textarea[name="notas"]', "Cliente corporativo para desarrollo de software e identidad corporativa.", 45, 1200);

  // Guardar cliente
  recordTimestamp("4.2. Clientes — Guardado y Confirmación en Lista");
  const saveClient = page.locator('div[role="dialog"] button:has-text("Guardar")').first();
  await hoverAndClick(page, saveClient, 2800);

  // =========================================================================
  // BLOQUE 5: NUEVA COTIZACIÓN — EL PODER DEL ASISTENTE DE IA
  // =========================================================================
  recordTimestamp("5. Nueva Cotización — Apertura y Selección de Cliente");
  const navNuevaCot = page.locator('header a[href="/cotizaciones/nueva"]').first();
  await hoverAndClick(page, navNuevaCot, 2200);

  await page.waitForURL("**/cotizaciones/nueva**");
  await sleep(1800);

  // Seleccionar cliente
  const clientSelect = page.locator("button#cliente, button:has-text('Selecciona un cliente')").first();
  await hoverAndClick(page, clientSelect, 1000);
  const clientOption = page.locator('[role="option"]:has-text("Inversiones del Maule")').first();
  await hoverAndClick(page, clientOption, 1200);

  // Validez de 30 días
  await humanType(page, "#validez", "30", 70, 800);
  await humanType(page, "#atencion", "Gerencia de Operaciones", 50, 800);

  // -------------------------------------------------------------------------
  // MAGIA IA 1: Escribir simplemente "pagina web" -> IA GENERA DESGLOSE COMPLETO
  // -------------------------------------------------------------------------
  recordTimestamp("5.1. Asistente IA — Input ambiguo: 'pagina web'");
  const item1Area = page.locator('textarea[placeholder="Descripción del producto o servicio"]').first();
  
  // Tipear la frase breve y ambigua
  await humanType(page, item1Area, "pagina web", 75, 2500);

  // Pausa clara con el cursor para que el espectador vea el texto simple
  await smoothMouseMove(page, 450, 420);
  await sleep(2000);

  // Mover cursor deliberadamente al botón con icono Sparkles: "Mejorar redacción"
  recordTimestamp("5.2. Asistente IA — Clic en 'Mejorar redacción'");
  const aiBtn1 = page.locator('button:has-text("Mejorar redacción")').first();
  await hoverAndClick(page, aiBtn1, 500);

  // Esperar a que la IA responda y llene el textarea
  console.log("Esperando respuesta de IA para 'pagina web'...");
  await page.waitForFunction(() => {
    const ta = document.querySelector('textarea[placeholder="Descripción del producto o servicio"]');
    return ta && ta.value.length > 50;
  }, { timeout: 25000 });

  recordTimestamp("5.3. Asistente IA — Resultado Mágico: Propuesta Web Completa");
  // Mover cursor suavemente sobre las viñetas y especificaciones para que el usuario las lea con calma
  await smoothMouseMove(page, 600, 450);
  await sleep(4000); // 4 segundos de lectura cómoda

  // Ingresar precio unitario
  const price1 = page.locator('.w-32 input').first();
  await humanType(page, price1, "1850000", 65, 1200);

  // -------------------------------------------------------------------------
  // MAGIA IA 2: Escribir "tarjetas de presentacion" -> DESGLOSE TÉCNICO DE IMPRENTA
  // -------------------------------------------------------------------------
  recordTimestamp("5.4. Asistente IA — Segunda Partida: 'tarjetas de presentacion'");
  const addLineBtn = page.locator('button:has-text("Agregar línea")').first();
  await hoverAndClick(page, addLineBtn, 1500);

  // Scroll suave para centrar la segunda partida
  await smoothScroll(page, 520, 20);
  await sleep(800);

  const item2Area = page.locator('textarea[placeholder="Descripción del producto o servicio"]').nth(1);
  await humanType(page, item2Area, "tarjetas de presentacion", 70, 2500);

  // Pausa para que se lea la palabra sencilla
  await smoothMouseMove(page, 450, 640);
  await sleep(2000);

  // Clic en "Mejorar redacción" de la Línea 2
  recordTimestamp("5.5. Asistente IA — Transformación a Ficha de Imprenta");
  const aiBtn2 = page.locator('button:has-text("Mejorar redacción")').nth(1);
  await hoverAndClick(page, aiBtn2, 500);

  console.log("Esperando respuesta de IA para 'tarjetas de presentacion'...");
  await page.waitForFunction(() => {
    const all = document.querySelectorAll('textarea[placeholder="Descripción del producto o servicio"]');
    return all.length > 1 && all[1].value.length > 50;
  }, { timeout: 25000 });

  recordTimestamp("5.6. Asistente IA — Ficha Técnica Generada (Couché 350g, etc.)");
  await smoothMouseMove(page, 600, 720);
  await sleep(4000); // 4 segundos de lectura del acabado técnico

  // Cantidad y Precio unitario
  const qty2 = page.locator('.w-20 input').nth(1);
  await humanType(page, qty2, "5", 75, 700);

  const price2 = page.locator('.w-32 input').nth(1);
  await humanType(page, price2, "85000", 65, 1200);

  // Scroll a totales
  recordTimestamp("5.7. Totales en CLP y Guardado de Cotización");
  await smoothScroll(page, 850, 20);
  await sleep(2000);

  // Guardar cotización
  const saveQuoteBtn = page.locator('div.sticky button:has-text("Guardar")').first();
  await hoverAndClick(page, saveQuoteBtn, 2500);

  // =========================================================================
  // BLOQUE 6: VISTA PREVIA Y PDF — LOGO EMPRESARIAL + TEXTOS DE IA
  // =========================================================================
  recordTimestamp("6. Vista Previa en PDF — Integración de Logo e IA");
  const previewBtn = page.locator('div.sticky button:has-text("Vista previa")').first();
  await hoverAndClick(page, previewBtn, 3500);

  const pdfFrame = page.locator('iframe[title="Vista previa del PDF"]');
  await pdfFrame.waitFor({ state: "visible", timeout: 25000 });
  await sleep(4000);

  // Recorrido visual del PDF: Encabezado con logo y tabla con viñetas de IA
  recordTimestamp("6.1. Recorrido del Documento Oficial");
  await smoothMouseMove(page, 960, 320); // Encabezado / Logo
  await sleep(2500);
  await smoothMouseMove(page, 960, 520); // Partidas con redacción de IA
  await sleep(3500);

  // Descargar PDF
  recordTimestamp("6.2. Emisión Oficial y Descarga");
  const downloadBtn = page.locator('div[role="dialog"] button:has-text("Descargar")').first();
  await hoverAndClick(page, downloadBtn, 1800);

  const conIvaBtn = page.locator('button:has-text("Con IVA")').first();
  await hoverAndClick(page, conIvaBtn, 4000);

  await sleep(3000);

  // Cerrar navegador
  await page.close();
  await context.close();
  await browser.close();

  console.log("\n🎉 Grabación MASTER completada con éxito!");

  const rawFiles = fs.readdirSync(RECORD_DIR).filter((f) => f.endsWith(".webm"));
  if (rawFiles.length === 0) throw new Error("No se encontró video grabado");

  const rawWebm = path.join(RECORD_DIR, rawFiles[0]);
  console.log(`📁 Video fuente grabado en: ${rawWebm}`);

  console.log("⚙️ Convirtiendo a MP4 de alta resolución...");
  const ffmpegCmd = `ffmpeg -y -i "${rawWebm}" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 30 "${OUTPUT_MP4}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });
  console.log(`✅ MP4 de alta resolución generado en: ${OUTPUT_MP4}`);

  fs.writeFileSync(
    "public/assets/videos/timestamps_master.json",
    JSON.stringify(timestamps, null, 2),
    "utf8"
  );
}

main().catch((err) => {
  console.error("❌ Error durante la grabación MASTER:", err);
  process.exit(1);
});
