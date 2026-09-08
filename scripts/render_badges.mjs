import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const badges = [
  { id: 1, step: "01", title: "PORTADA Y HERO COMERCIAL", subtitle: "COTIZADOR ORBYNEX DIGITAL v2.0" },
  { id: 2, step: "02", title: "AUTENTICACIÓN SPLIT-SCREEN", subtitle: "SEGURIDAD Y CONTROL DE ACCESO" },
  { id: 3, step: "03", title: "CONFIGURACIÓN DE MI NEGOCIO", subtitle: "IDENTIDAD Y CONDICIONES BANCARIAS" },
  { id: 4, step: "04", title: "GESTIÓN DE CLIENTES EMPRESARIALES", subtitle: "CARTERA Y DATOS DE CONTACTO" },
  { id: 5, step: "05", title: "NUEVA COTIZACIÓN EN CLP", subtitle: "CÁLCULO AUTOMÁTICO DE IVA Y TOTALES" },
  { id: 6, step: "06", title: "VISTA PREVIA Y EMISIÓN PDF", subtitle: "PROPUESTA OFICIAL CON CORRELATIVO" },
];

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 600, height: 200 } });

  for (const b of badges) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: transparent;
            display: inline-block;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 14px;
            background: rgba(10, 15, 30, 0.92);
            border: 1.5px solid rgba(14, 165, 233, 0.6);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(14, 165, 233, 0.35);
            padding: 12px 22px;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: linear-gradient(135deg, #0ea5e9 0%, #ec4899 100%);
            color: #ffffff;
            font-weight: 800;
            font-size: 15px;
            box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
          }
          .content {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #38bdf8;
            text-transform: uppercase;
            letter-spacing: 1.2px;
          }
          .title {
            font-size: 15px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.2px;
          }
        </style>
      </head>
      <body>
        <div class="badge" id="badge">
          <div class="icon">${b.step}</div>
          <div class="content">
            <div class="subtitle">${b.subtitle}</div>
            <div class="title">${b.title}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html);
    const badgeElement = page.locator("#badge");
    const outPath = path.resolve(`demo_recordings/badge_${b.id}.png`);
    await badgeElement.screenshot({ path: outPath, omitBackground: true });
    console.log(`Rendered ${outPath}`);
  }

  await browser.close();
}

main().catch(console.error);
