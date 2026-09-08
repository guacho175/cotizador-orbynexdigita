import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// Configuración de visualización y velocidad
const VIEWPORT = { width: 1920, height: 1080 };
const RECORD_DIR = path.resolve("demo_recordings");
const OUTPUT_MP4 = path.resolve("public/assets/videos/tutorial_demo_orbynex.mp4");
const OUTPUT_WEBM = path.resolve("public/assets/videos/tutorial_demo_orbynex.webm");

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

// Movimiento suave del cursor usando curvas de aceleración
let currentX = 960;
let currentY = 540;

async function smoothMouseMove(page, targetX, targetY, steps = 25) {
  const startX = currentX;
  const startY = currentY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Función de curvatura easeInOutCubic
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
  await sleep(250);
  // Limpiar campo si tiene contenido
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await sleep(150);
  // Tipeo progresivo humano
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(delay + Math.floor(Math.random() * 20));
  }
  await sleep(pauseAfter);
}

async function smoothScroll(page, targetScrollY, steps = 30) {
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
  console.log("🎬 Iniciando grabación de video tutorial en Full HD 1920x1080...");

  // Limpiar videos antiguos de la carpeta temporal
  if (!fs.existsSync(RECORD_DIR)) {
    fs.mkdirSync(RECORD_DIR, { recursive: true });
  } else {
    for (const file of fs.readdirSync(RECORD_DIR)) {
      if (file.endsWith(".webm") || file.endsWith(".mp4")) {
        try {
          fs.unlinkSync(path.join(RECORD_DIR, file));
        } catch (_) {}
      }
    }
  }

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
    ],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: RECORD_DIR,
      size: VIEWPORT,
    },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Inyectar cursor interactivo animado para el video
  await page.addInitScript(() => {
    const cursor = document.createElement("div");
    cursor.id = "playwright-mouse-pointer";
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.75);
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 12px rgba(14, 165, 233, 0.9), 0 0 20px rgba(14, 165, 233, 0.4);
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%);
      transition: transform 0.08s ease, background 0.15s ease, box-shadow 0.15s ease;
    `;
    const pulseRing = document.createElement("div");
    pulseRing.id = "playwright-mouse-ring";
    pulseRing.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid rgba(14, 165, 233, 0.4);
      pointer-events: none;
      z-index: 2147483646;
      transform: translate(-50%, -50%);
      transition: transform 0.15s ease, opacity 0.15s ease;
    `;

    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(pulseRing);
      document.body.appendChild(cursor);
    });

    window.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      pulseRing.style.left = `${e.clientX}px`;
      pulseRing.style.top = `${e.clientY}px`;
    });

    window.addEventListener("mousedown", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
      cursor.style.background = "rgba(236, 72, 153, 0.95)";
      cursor.style.boxShadow = "0 0 15px rgba(236, 72, 153, 1), 0 0 25px rgba(236, 72, 153, 0.6)";
      pulseRing.style.transform = "translate(-50%, -50%) scale(1.3)";
      pulseRing.style.borderColor = "rgba(236, 72, 153, 0.7)";
    });

    window.addEventListener("mouseup", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      cursor.style.background = "rgba(14, 165, 233, 0.75)";
      cursor.style.boxShadow = "0 0 12px rgba(14, 165, 233, 0.9), 0 0 20px rgba(14, 165, 233, 0.4)";
      pulseRing.style.transform = "translate(-50%, -50%) scale(1)";
      pulseRing.style.borderColor = "rgba(14, 165, 233, 0.4)";
    });
  });

  videoStartTime = Date.now();

  // =========================================================================
  // BLOQUE 1: LANDING PAGE (/)
  // =========================================================================
  recordTimestamp("1. Landing Page — Entrada y Hero");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await sleep(2000);

  // Mover cursor suavemente sobre el Hero
  await smoothMouseMove(page, 960, 260);
  await sleep(1800);

  // Recorrido visual hacia la captura del panel en el Hero
  recordTimestamp("1.1. Landing Page — Vista de mockup y Bento Grid");
  await smoothScroll(page, 550, 25);
  await smoothMouseMove(page, 960, 520);
  await sleep(2000);

  // Desplazamiento por el Bento Grid de características
  await smoothScroll(page, 1150, 30);
  await smoothMouseMove(page, 620, 680);
  await sleep(1500);
  await smoothMouseMove(page, 1250, 750);
  await sleep(1800);

  // Desplazamiento hacia el footer con luces
  recordTimestamp("1.2. Landing Page — Footer y llamado a la acción");
  await smoothScroll(page, 2000, 30);
  await smoothMouseMove(page, 960, 850);
  await sleep(2000);

  // Retorno fluido hacia el Hero
  await smoothScroll(page, 0, 35);
  await sleep(1500);

  // Clic en "Comenzar ahora gratis"
  recordTimestamp("1.3. Landing Page — Navegación a Autenticación");
  const ctaButton = page.locator('a:has-text("Comenzar ahora gratis")').first();
  await hoverAndClick(page, ctaButton, 2000);

  // =========================================================================
  // BLOQUE 2: AUTENTICACIÓN SPLIT-SCREEN (/auth)
  // =========================================================================
  recordTimestamp("2. Pantalla de Autenticación — Demostración Split-Screen");
  await page.waitForURL("**/auth**");
  await sleep(2200);

  // Explorar branding en la columna izquierda
  await smoothMouseMove(page, 450, 420);
  await sleep(1800);

  // Demostración de cambio de pestaña: "Crear cuenta"
  recordTimestamp("2.1. Autenticación — Pestaña Crear Cuenta");
  const signupTab = page.locator('button:has-text("Crear cuenta")').first();
  await hoverAndClick(page, signupTab, 2200);

  // Retorno a la pestaña "Iniciar sesión"
  recordTimestamp("2.2. Autenticación — Pestaña Iniciar Sesión y Credenciales");
  const loginTab = page.locator('button:has-text("Iniciar sesión")').first();
  await hoverAndClick(page, loginTab, 1500);

  // Ingreso de email corporativo de demostración
  await humanType(page, "#login-email", "demo.orbynex@gmail.com", 65, 1400);

  // Ingreso de contraseña de prueba
  await humanType(page, "#login-password", "PasswordDemo2026!", 65, 1400);

  // Demostración del botón para alternar visibilidad de contraseña (icono de ojo)
  recordTimestamp("2.3. Autenticación — Alternar visibilidad de contraseña");
  const toggleEyeButton = page.locator('button[aria-label="Ver contraseña"]').first();
  await hoverAndClick(page, toggleEyeButton, 2200);

  // Ocultar contraseña nuevamente
  const hideEyeButton = page.locator('button[aria-label="Ocultar contraseña"]').first();
  await hoverAndClick(page, hideEyeButton, 1500);

  // Clic en "Entrar a mi cuenta"
  recordTimestamp("2.4. Autenticación — Inicio de sesión hacia el Panel");
  const submitLoginButton = page.locator('button:has-text("Entrar a mi cuenta")').first();
  await hoverAndClick(page, submitLoginButton, 2500);

  await page.waitForURL("**/panel**");
  await sleep(2500);

  // =========================================================================
  // BLOQUE 3: CONFIGURACIÓN DE LA EMPRESA / MI NEGOCIO (/negocio)
  // =========================================================================
  recordTimestamp("3. Mi Negocio — Navegación y Carga de Identidad Corporativa");
  const negocioNavLink = page.locator('a[href="/negocio"]').first();
  await hoverAndClick(page, negocioNavLink, 2000);

  await page.waitForURL("**/negocio**");
  await sleep(1500);

  // Completar campos de identidad
  await humanType(page, "#biz-nombre", "Orbynex Servicios Tecnológicos SpA", 50, 1100);
  await humanType(page, "#biz-rut", "77.456.123-K", 55, 900);
  await humanType(page, "#biz-giro", "Servicios de Consultoría y Desarrollo de Software", 50, 900);
  await humanType(page, "#biz-direccion", "Av. Providencia 1208, Of. 602, Providencia, Santiago", 45, 900);
  await humanType(page, "#biz-telefono", "+56 9 8765 4321", 55, 900);
  await humanType(page, "#biz-email", "contacto@orbynex.com", 55, 900);
  await humanType(page, "#biz-sitio_web", "https://orbynex.com", 55, 1000);

  // Scroll a Datos de transferencia y condiciones
  recordTimestamp("3.1. Mi Negocio — Condiciones Comerciales y Datos Bancarios");
  await smoothScroll(page, 600, 25);
  await sleep(1200);

  await humanType(page, "#bank-banco_nombre", "Banco de Chile", 55, 800);
  await humanType(page, "#bank-banco_tipo_cuenta", "Cuenta Corriente", 55, 800);
  await humanType(page, "#bank-banco_numero_cuenta", "00-123-45678-90", 55, 800);
  await humanType(page, "#bank-banco_titular", "Orbynex Servicios Tecnológicos SpA", 50, 800);
  await humanType(page, "#bank-banco_rut", "77.456.123-K", 55, 800);
  await humanType(page, "#bank-banco_email", "pagos@orbynex.com", 55, 900);

  await smoothScroll(page, 950, 25);
  await sleep(1000);

  await humanType(
    page,
    "#condiciones",
    "Pago 50% de anticipo al inicio y 50% contra entrega conforme en servidor de producción. Validez de oferta: 30 días corridos.",
    40,
    1300
  );

  await humanType(
    page,
    "#pie",
    "Orbynex Digital — Plataforma y Software Empresarial de Alta Disponibilidad",
    45,
    1100
  );

  // Guardar cambios
  recordTimestamp("3.2. Mi Negocio — Guardado Exitoso");
  const saveBizButton = page.locator('button:has-text("Guardar cambios")').first();
  await hoverAndClick(page, saveBizButton, 2500);

  // =========================================================================
  // BLOQUE 4: GESTIÓN DE CLIENTES (/clientes)
  // =========================================================================
  recordTimestamp("4. Gestión de Clientes — Acceso y Apertura de Formulario");
  const clientesNavLink = page.locator('a[href="/clientes"]').first();
  await hoverAndClick(page, clientesNavLink, 2000);

  await page.waitForURL("**/clientes**");
  await sleep(1500);

  // Clic en el botón para agregar cliente (sea "Nuevo" o "Crear tu primer cliente")
  const newClientButton = page
    .locator('button:has-text("Nuevo"), button:has-text("Crear tu primer cliente")')
    .first();
  await hoverAndClick(page, newClientButton, 1800);

  // Modal de cliente
  recordTimestamp("4.1. Gestión de Clientes — Registro de Inversiones del Maule Ltda.");
  await humanType(page, 'input[name="nombre"]', "Inversiones del Maule Ltda.", 50, 900);
  await humanType(page, 'input[name="rut"]', "76.892.451-9", 55, 900);
  await humanType(page, 'input[name="contacto"]', "Rodrigo Morales Donoso", 50, 900);
  await humanType(page, 'input[name="email"]', "rmorales@inversionesdelmaule.cl", 50, 900);
  await humanType(page, 'input[name="telefono"]', "+56 9 7654 3210", 55, 900);
  await humanType(page, 'input[name="direccion"]', "Av. San Isidro 450, Talca / Las Condes, Santiago", 45, 900);
  await humanType(
    page,
    'textarea[name="notas"]',
    "Cliente corporativo para desarrollo de infraestructura de software e-commerce B2B.",
    45,
    1300
  );

  // Guardar cliente
  recordTimestamp("4.2. Gestión de Clientes — Guardado y Confirmación en Lista");
  const saveClientButton = page.locator('div[role="dialog"] button:has-text("Guardar")').first();
  await hoverAndClick(page, saveClientButton, 2800);

  // =========================================================================
  // BLOQUE 5: CREACIÓN DE NUEVA COTIZACIÓN (/cotizaciones/nueva)
  // =========================================================================
  recordTimestamp("5. Nueva Cotización — Apertura y Selección de Cliente");
  const newQuoteHeaderLink = page.locator('header a[href="/cotizaciones/nueva"]').first();
  await hoverAndClick(page, newQuoteHeaderLink, 2200);

  await page.waitForURL("**/cotizaciones/nueva**");
  await sleep(1800);

  // Seleccionar cliente en el desplegable
  const clientSelect = page.locator("button#cliente, button:has-text('Selecciona un cliente')").first();
  await hoverAndClick(page, clientSelect, 1200);

  const clientOption = page.locator('[role="option"]:has-text("Inversiones del Maule")').first();
  await hoverAndClick(page, clientOption, 1500);

  // Validez en días
  await humanType(page, "#validez", "30", 70, 1100);

  // Atención a
  await humanType(page, "#atencion", "Gerencia de Transformación Digital", 55, 1100);

  // Ítem 1
  recordTimestamp("5.1. Nueva Cotización — Carga de Ítems Comerciales en CLP");
  const item1Desc = page.locator('textarea[placeholder="Descripción del producto o servicio"]').first();
  await humanType(
    page,
    item1Desc,
    "Desarrollo e Implementación de Plataforma E-Commerce B2B con Pasarela de Pagos Transbank y Sincronización ERP",
    40,
    1100
  );

  // Precio unitario ítem 1
  const item1Price = page.locator('.w-32 input').first();
  await humanType(page, item1Price, "3850000", 65, 1400);

  // Agregar Línea 2
  recordTimestamp("5.2. Nueva Cotización — Segunda Línea de Servicio");
  const addLineBtn = page.locator('button:has-text("Agregar línea")').first();
  await hoverAndClick(page, addLineBtn, 1500);

  const item2Desc = page.locator('textarea[placeholder="Descripción del producto o servicio"]').nth(1);
  await humanType(
    page,
    item2Desc,
    "Arquitectura Cloud Serverless, Configuración de Base de Datos Supabase y Sincronización PWA Offline",
    40,
    1100
  );

  const item2Price = page.locator('.w-32 input').nth(1);
  await humanType(page, item2Price, "1450000", 65, 1400);

  // Observaciones
  await smoothScroll(page, 400, 20);
  const observacionesArea = page.locator('textarea[placeholder*="Observaciones adicionales"]').first();
  await humanType(
    page,
    observacionesArea,
    "Propuesta incluye garantía técnica de 90 días corridos y soporte continuo para alta disponibilidad.",
    40,
    1400
  );

  // Apreciación de totales en CLP
  recordTimestamp("5.3. Nueva Cotización — Verificación de Subtotal, IVA y Total");
  await smoothScroll(page, 650, 20);
  await sleep(2200);

  // Guardar cotización
  const saveQuoteBtn = page.locator('div.sticky button:has-text("Guardar")').first();
  await hoverAndClick(page, saveQuoteBtn, 2500);

  // =========================================================================
  // BLOQUE 6: PREVISUALIZACIÓN Y DESCARGA DE PDF
  // =========================================================================
  recordTimestamp("6. Previsualización en PDF — Apertura de Vista Previa");
  const previewPdfBtn = page.locator('div.sticky button:has-text("Vista previa")').first();
  await hoverAndClick(page, previewPdfBtn, 3000);

  // Esperar a que el visor de PDF muestre el documento
  const pdfFrame = page.locator('iframe[title="Vista previa del PDF"]');
  await pdfFrame.waitFor({ state: "visible", timeout: 25000 });
  await sleep(4000);

  // Mover cursor suavemente sobre la vista previa para apreciar el documento
  recordTimestamp("6.1. Previsualización en PDF — Recorrido del Documento");
  await smoothMouseMove(page, 960, 480);
  await sleep(2500);

  // Clic en "Descargar" dentro del diálogo de vista previa
  recordTimestamp("6.2. Emisión y Descarga — Diálogo de Emisión Oficial");
  const downloadInPreviewBtn = page.locator('div[role="dialog"] button:has-text("Descargar")').first();
  await hoverAndClick(page, downloadInPreviewBtn, 2000);

  // Diálogo de confirmación: ¿Cómo deseas emitir esta cotización?
  const conIvaBtn = page.locator('button:has-text("Con IVA")').first();
  await hoverAndClick(page, conIvaBtn, 4000);

  recordTimestamp("6.3. Emisión Exitosa y Cierre");
  await sleep(3500);

  // Cerrar sesión ordenadamente al finalizar el tutorial
  recordTimestamp("7. Finalización — Cierre de Sesión y Salida");
  const logoutBtn = page.locator('aside button:has-text("Cerrar sesión")').first();
  if (await logoutBtn.isVisible()) {
    await hoverAndClick(page, logoutBtn, 2000);
  }

  await sleep(1500);

  // Cerrar página y contexto para finalizar el guardado del video en disco
  await page.close();
  await context.close();
  await browser.close();

  console.log("\n🎉 Grabación del navegador completada exitosamente!");

  // Buscar archivo .webm generado
  const recordedFiles = fs.readdirSync(RECORD_DIR).filter((f) => f.endsWith(".webm"));
  if (recordedFiles.length === 0) {
    throw new Error("No se encontró ningún archivo .webm generado en " + RECORD_DIR);
  }

  const rawWebmPath = path.join(RECORD_DIR, recordedFiles[0]);
  console.log(`📁 Archivo fuente WebM: ${rawWebmPath}`);

  // Copiar también a public/assets/videos como webm
  fs.copyFileSync(rawWebmPath, OUTPUT_WEBM);
  console.log(`✅ WebM copiado a: ${OUTPUT_WEBM}`);

  // Convertir a MP4 Full HD con ffmpeg para máxima compatibilidad
  console.log("⚙️ Procesando video con FFmpeg a formato MP4 (H.264 / 30fps Full HD)...");
  try {
    const ffmpegCmd = `ffmpeg -y -i "${rawWebmPath}" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 "${OUTPUT_MP4}"`;
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(`✅ Video MP4 Full HD generado exitosamente en: ${OUTPUT_MP4}`);
  } catch (err) {
    console.error("⚠️ Error convirtiendo a MP4 con FFmpeg, conservando WebM:", err.message);
  }

  // Guardar archivo JSON de timestamps
  const timestampsPath = path.resolve("public/assets/videos/timestamps.json");
  fs.writeFileSync(timestampsPath, JSON.stringify(timestamps, null, 2), "utf8");

  console.log("\n=======================================================");
  console.log("📋 ÍNDICE DE TIEMPOS (TIMESTAMPS) PARA EDICIÓN DE VIDEO:");
  console.log("=======================================================");
  for (const item of timestamps) {
    console.log(`- **${item.time}** : ${item.label}`);
  }
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("❌ Error durante la grabación:", err);
  process.exit(1);
});
