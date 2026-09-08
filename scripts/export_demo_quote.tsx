import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { chromium } from "playwright";
import { QuoteDocument } from "../src/components/pdf/quote-document";
import type { Business, Client, Quote, QuoteItem } from "../src/lib/types";

async function run() {
  const logoPath = resolve("public/assets/logos/logo_orbynex_horizontal_claro_v2.png");
  const logoBase64 = readFileSync(logoPath).toString("base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  const business: Business = {
    id: "demo-business",
    user_id: "demo-user",
    nombre: "Orbynex Digital SpA",
    rut: "77.123.456-7",
    giro: "Servicios Digitales y Software",
    direccion: "Av. Providencia 1234, Oficina 601, Santiago",
    telefono: "+56 9 8765 4321",
    email: "contacto@orbynex.cl",
    sitio_web: "https://orbynex.cl",
    logo_path: "logo_orbynex_horizontal_claro_v2.png",
    banco_titular: "Orbynex SpA",
    banco_rut: "77.123.456-7",
    banco_nombre: "Banco de Chile",
    banco_tipo_cuenta: "Cuenta Corriente",
    banco_numero_cuenta: "123-45678-90",
    banco_email: "pagos@orbynex.cl",
    condiciones: "Forma de pago: 50% anticipo al confirmar y 50% contra entrega conforme. Validez de la oferta: 30 días continuos. Precios en pesos chilenos con IVA incluido según desglose.",
    pie_pagina: "Orbynex Digital SpA · contacto@orbynex.cl · www.orbynex.cl",
    iva_percent: 19,
    next_quote_number: 101,
    color_factura: "#0b2545",
    pdf_template_key: "standard-v1",
  };

  const client: Client = {
    id: "demo-client",
    user_id: "demo-user",
    nombre: "Inversiones del Maule Ltda.",
    rut: "76.543.210-K",
    contacto: "Francisco Valenzuela",
    email: "contacto@inversionesmaule.cl",
    telefono: "+56 9 9876 5432",
    direccion: "Calle 1 Sur 1234, Talca, Región del Maule",
    notas: "Cliente corporativo",
    pdf_template_key: null,
  };

  const items: QuoteItem[] = [
    {
      id: "item-1",
      quote_id: "demo-quote",
      user_id: "demo-user",
      orden: 1,
      descripcion:
        "Desarrollo de Sitio Web Corporativo Profesional\n" +
        "• Arquitectura de información y diseño UX/UI responsive adaptable a móviles, tablets y desktop.\n" +
        "• Desarrollo frontend de alto rendimiento con optimización SEO on-page y carga ultrarrápida.\n" +
        "• Integración de formulario de contacto con validación en tiempo real y enlace a WhatsApp Business.\n" +
        "• Configuración de panel autoadministrable, certificado SSL y despliegue en infraestructura cloud de alta disponibilidad.",
      cantidad: 1,
      precio_unitario: 450000,
      total: 450000,
    },
    {
      id: "item-2",
      quote_id: "demo-quote",
      user_id: "demo-user",
      orden: 2,
      descripcion:
        "Diseño e Impresión de Tarjetas de Presentación Premium\n" +
        "• Formato estándar 9x5 cm en papel couché importado de 350 gramos de alto gramaje.\n" +
        "• Terminación con termolaminado mate soft-touch por ambas caras para mayor durabilidad y elegancia.\n" +
        "• Impresión offset digital de alta resolución a 4/4 colores (full color tiro y retiro).\n" +
        "• Puntas redondeadas y empaque de entrega rígido con control de calidad individual.",
      cantidad: 5,
      precio_unitario: 85000,
      total: 425000,
    },
  ];

  const subtotal = 875000;
  const iva = 166250;
  const total = 1041250;

  const quote: Quote = {
    id: "demo-quote",
    user_id: "demo-user",
    client_id: client.id,
    numero: 1001,
    pdf_template_key: "standard-v1",
    pdf_template_version: 1,
    issued_at: new Date().toISOString(),
    fecha: new Date().toISOString().split("T")[0],
    validez_dias: 30,
    estado: "emitida",
    atencion: "Francisco Valenzuela",
    subtotal,
    iva,
    total,
    iva_percent: 19,
    snapshot_negocio: null,
    snapshot_cliente: null,
    observaciones:
      "Propuesta comercial personalizada. Los plazos de desarrollo e impresión comienzan a regir tras la recepción del anticipo y la entrega de activos gráficos requeridos.",
  };

  const outputPath = resolve("public/assets/cotizacion_demo_orbynex.pdf");
  await renderToFile(
    <QuoteDocument
      quote={quote}
      items={items}
      business={business}
      client={client}
      logoDataUrl={logoDataUrl}
    />,
    outputPath
  );

  const previewPath = resolve("public/assets/cotizacion_demo_preview.png");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  await page.goto("file:///" + outputPath.replace(/\\/g, "/"));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: previewPath, fullPage: false });
  await browser.close();

  console.log(`✅ PDF generado exitosamente en: ${outputPath}`);
  console.log(`📸 Preview PNG generado en: ${previewPath}`);
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
