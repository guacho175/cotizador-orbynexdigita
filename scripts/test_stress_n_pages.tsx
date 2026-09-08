import React from "react";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { renderToFile } from "@react-pdf/renderer";
import { chromium } from "playwright";
import {
  Document,
  Font,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { addDays, formatDate, money, quoteNumber } from "../src/lib/format";
import { businessTaxLabel } from "../src/lib/quote-lifecycle";
import type { QuoteDocumentProps } from "../src/components/pdf/core/model";
import type { Business, Client, Quote, QuoteItem } from "../src/lib/types";
import { contrastColor, PDF_COLORS, PDF_LAYOUT } from "../src/components/pdf/core/tokens";

Font.registerHyphenationCallback((word) => [word]);

const businessDemo: Business = {
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
  condiciones:
    "Forma de pago: 50% de anticipo al confirmar y 50% contra entrega conforme. Validez de la oferta: 30 días continuos. Precios en pesos chilenos con IVA incluido según desglose.",
  pie_pagina: "Orbynex Digital SpA · contacto@orbynex.cl · www.orbynex.cl",
  iva_percent: 19,
  tax_label: "IVA",
  next_quote_number: 101,
  color_factura: "#0b2545",
  pdf_template_key: "standard-v1",
};

const clientDemo: Client = {
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

function generateItems(count: number, withAi: boolean): QuoteItem[] {
  const items: QuoteItem[] = [];
  for (let i = 1; i <= count; i++) {
    if (withAi) {
      items.push({
        id: `item-${i}`,
        quote_id: "demo",
        user_id: "u",
        orden: i,
        descripcion:
          `PARTIDA TÉCNICA ESPECIALIZADA #${i}: IMPLEMENTACIÓN Y SUMINISTRO\n` +
          `Línea Corporativa | Garantía Extendida 12 Meses\n` +
          `Servicio profesional de ingeniería y provisión de equipamiento certificado para faena comercial.\n` +
          `El servicio incluye:\n` +
          `- Especificación técnica del componente #${i} con certificación SEC.\n` +
          `- Pruebas de integración, puesta en marcha y protocolos de aseguramiento.\n` +
          `- Documentación técnica digital y manual de operación entregado al cliente.`,
        cantidad: (i % 5) + 1,
        precio_unitario: 85000 + i * 15000,
        total: ((i % 5) + 1) * (85000 + i * 15000),
      });
    } else {
      items.push({
        id: `item-${i}`,
        quote_id: "demo",
        user_id: "u",
        orden: i,
        descripcion: `Producto o servicio estandarizado de línea comercial #${i} - Entrega inmediata`,
        cantidad: (i % 4) + 1,
        precio_unitario: 45000 + i * 5000,
        total: ((i % 4) + 1) * (45000 + i * 5000),
      });
    }
  }
  return items;
}

function buildQuote(items: QuoteItem[]): Quote {
  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return {
    id: "demo-quote",
    user_id: "demo-user",
    client_id: clientDemo.id,
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
      "Propuesta comercial corporativa. Los plazos de desarrollo e instalación comienzan a regir tras la recepción conforme del anticipo y visto bueno de artes digitales.",
  };
}

// Test N-pages continuous architecture
import { computeLayoutMetrics, QuoteItemBlock } from "../src/components/pdf/core/blocks/quote-item";

function Closing({
  quote,
  business,
  metrics,
  observation,
  themeColor,
  themeContrast,
}: {
  quote: Quote;
  business: Business;
  metrics: any;
  observation: string;
  themeColor: string;
  themeContrast: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: metrics.closingMarginT,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        {observation ? (
          <View style={{ marginBottom: 5 }}>
            <Text
              style={{
                fontSize: 6.5,
                fontFamily: "Helvetica-Bold",
                color: PDF_COLORS.amber,
                letterSpacing: 0.5,
                marginBottom: 1.5,
              }}
            >
              CONDICIONES Y OBSERVACIONES
            </Text>
            <Text
              style={{
                fontSize: metrics.observationSize,
                lineHeight: 1.25,
                color: PDF_COLORS.slate500,
                textAlign: "justify",
              }}
            >
              {observation}
            </Text>
          </View>
        ) : null}

        {business.banco_nombre || business.banco_numero_cuenta ? (
          <View
            style={{
              backgroundColor: PDF_COLORS.slate50,
              borderWidth: 0.7,
              borderColor: PDF_COLORS.line,
              borderRadius: 5,
              padding: metrics.paymentPadding,
            }}
          >
            <Text
              style={{
                fontSize: 6.3,
                fontFamily: "Helvetica-Bold",
                color: PDF_COLORS.navy,
                marginBottom: 3,
                letterSpacing: 0.3,
              }}
            >
              DATOS PARA TRANSFERENCIA BANCARIA
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <View style={{ width: "48%" }}>
                <Text style={{ fontSize: 5.5, color: PDF_COLORS.slate400 }}>Banco / Tipo</Text>
                <Text
                  style={{
                    fontSize: 6.4,
                    color: PDF_COLORS.ink,
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {[business.banco_nombre, business.banco_tipo_cuenta].filter(Boolean).join(" - ")}
                </Text>
              </View>
              <View style={{ width: "48%" }}>
                <Text style={{ fontSize: 5.5, color: PDF_COLORS.slate400 }}>Titular / RUT</Text>
                <Text style={{ fontSize: 6.4, color: PDF_COLORS.ink }}>
                  {[business.banco_titular, business.banco_rut].filter(Boolean).join(" - ")}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: PDF_COLORS.amberLight,
                borderWidth: 0.5,
                borderColor: PDF_COLORS.amberBorder,
                borderRadius: 3.5,
                paddingVertical: 2.5,
                paddingHorizontal: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 7.2,
                  fontFamily: "Helvetica-Bold",
                  color: PDF_COLORS.ink,
                }}
              >
                N° Cuenta: {business.banco_numero_cuenta || "-"}
              </Text>
              {business.banco_email ? (
                <Text style={{ fontSize: 6.2, color: PDF_COLORS.slate700 }}>
                  Comprobante a: {business.banco_email}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ width: 175 }}>
        <View
          style={{
            borderWidth: 0.8,
            borderColor: PDF_COLORS.line,
            borderRadius: 5,
            backgroundColor: PDF_COLORS.paper,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: metrics.totalsPaddingV,
              paddingHorizontal: 7,
            }}
          >
            <Text style={{ fontSize: 7.2, color: PDF_COLORS.slate500 }}>Subtotal Neto</Text>
            <Text style={{ fontSize: 7.5, color: PDF_COLORS.slate700 }}>
              {money(quote.subtotal)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: metrics.totalsPaddingV,
              paddingHorizontal: 7,
            }}
          >
            <Text style={{ fontSize: 7.2, color: PDF_COLORS.slate500 }}>
              {businessTaxLabel(business)} ({quote.iva_percent}%)
            </Text>
            <Text style={{ fontSize: 7.5, color: PDF_COLORS.slate700 }}>{money(quote.iva)}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: themeColor,
              paddingVertical: metrics.grandTotalBarPaddingV,
              paddingHorizontal: 7,
              marginTop: 2,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Helvetica-Bold",
                color: themeContrast,
              }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                fontSize: metrics.grandTotalSize,
                fontFamily: "Helvetica-Bold",
                color: themeContrast,
              }}
            >
              {money(quote.total)}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 5.5,
              color: PDF_COLORS.slate400,
              textAlign: "center",
              paddingVertical: 1.5,
            }}
          >
            Valores en Pesos Chilenos (CLP)
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ContinuousMultiPageDocument(props: QuoteDocumentProps) {
  const { quote, items, business, client, logoDataUrl } = props;
  const metrics = computeLayoutMetrics(items);
  const themeColor = business.color_factura || PDF_COLORS.navy;
  const themeContrast = contrastColor(themeColor);
  const validUntil = addDays(quote.fecha, quote.validez_dias || 0);

  const issuerDetails = [
    business.rut ? `RUT: ${business.rut}` : null,
    business.telefono ? `Tel: ${business.telefono}` : null,
    business.email || null,
    business.sitio_web || null,
  ]
    .filter(Boolean)
    .join("  •  ");

  const observation =
    quote.observaciones ||
    business.condiciones ||
    "Propuesta comercial personalizada sujeta a confirmación de disponibilidad.";

  // Separate all items except the last one
  const allExceptLast = items.slice(0, items.length - 1);
  const lastItem = items[items.length - 1];

  const isFewItems = items.length <= 2;

  return (
    <Document
      title={`Cotización ${quote.numero == null ? "Borrador" : quoteNumber(quote.numero)}`}
      author={business.nombre || "Cotización"}
    >
      <Page
        size="A4"
        style={{
          paddingTop: PDF_LAYOUT.pageTop,
          paddingBottom: PDF_LAYOUT.pageBottom,
          paddingHorizontal: PDF_LAYOUT.pageHorizontal,
          fontSize: 8,
          fontFamily: "Helvetica",
          color: PDF_COLORS.ink,
          backgroundColor: PDF_COLORS.paper,
          display: "flex",
          flexDirection: "column",
        }}
        wrap
      >
        {/* Header Bar: Fixed across every single page */}
        <View
          style={{
            position: "absolute",
            top: PDF_LAYOUT.headerTop,
            left: PDF_LAYOUT.pageHorizontal,
            right: PDF_LAYOUT.pageHorizontal,
            height: 64,
            backgroundColor: themeColor,
            borderRadius: 7,
            paddingVertical: 9,
            paddingHorizontal: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          fixed
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12 }}>
            {logoDataUrl ? (
              <Image
                src={logoDataUrl}
                style={{ width: 44, height: 44, objectFit: "contain", marginRight: 10 }}
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: themeContrast }}>
                {business.nombre || "Tu Empresa"}
              </Text>
              {business.giro ? (
                <Text style={{ fontSize: 7.2, color: "#cbd5e1", marginTop: 1 }}>{business.giro}</Text>
              ) : null}
              {issuerDetails ? (
                <Text style={{ fontSize: 6.6, color: "#94a3b8", marginTop: 3, lineHeight: 1.2 }}>
                  {issuerDetails}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ alignItems: "flex-end", minWidth: 120 }}>
            <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#fbbf24", letterSpacing: 0.8 }}>
              COTIZACIÓN N°
            </Text>
            <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: themeContrast, marginTop: 1 }}>
              {quote.numero == null ? "BORRADOR" : quoteNumber(quote.numero)}
            </Text>
            <Text style={{ fontSize: 6.8, color: "#cbd5e1", marginTop: 1 }}>
              Fecha: {formatDate(quote.fecha)}
            </Text>
            <Text style={{ fontSize: 6.8, color: "#cbd5e1", marginTop: 1 }}>
              Válida hasta: {formatDate(validUntil)}
            </Text>
          </View>
        </View>

        {/* Client Card: Appears only on Page 1 (wrap={false}) */}
        <View
          style={{
            backgroundColor: PDF_COLORS.slate50,
            borderWidth: 0.8,
            borderColor: PDF_COLORS.line,
            borderLeftWidth: 3.5,
            borderLeftColor: themeColor,
            borderRadius: 5,
            paddingVertical: metrics.clientCardPaddingV,
            paddingHorizontal: 10,
            marginBottom: metrics.clientCardMarginB,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          wrap={false}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.amber, letterSpacing: 0.6, marginBottom: 1 }}>
              PREPARADO PARA
            </Text>
            <Text style={{ fontSize: metrics.clientNameSize, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink }}>
              {client?.nombre || "Sin cliente asignado"}
            </Text>
            <Text style={{ fontSize: 7.2, color: PDF_COLORS.slate500, marginTop: 1 }}>
              {[client?.rut ? `RUT: ${client.rut}` : null, quote.atencion ? `Atención: ${quote.atencion}` : null]
                .filter(Boolean)
                .join("   |   ")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {client?.direccion ? (
              <Text style={{ fontSize: 7, color: PDF_COLORS.slate500, lineHeight: 1.3, textAlign: "right" }}>
                {client.direccion}
              </Text>
            ) : null}
            <Text style={{ fontSize: 7, color: PDF_COLORS.slate500, lineHeight: 1.3, textAlign: "right" }}>
              {[client?.telefono, client?.email].filter(Boolean).join("  •  ")}
            </Text>
          </View>
        </View>

        {/* Table Header: Fixed on every page */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: PDF_COLORS.slate100,
            borderRadius: 4,
            paddingVertical: metrics.tableHeaderPaddingV,
            paddingHorizontal: 8,
            marginBottom: metrics.tableHeaderMarginB,
            alignItems: "center",
          }}
          fixed
        >
          <Text style={{ flex: 1, fontSize: 6.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.slate700, letterSpacing: 0.5 }}>
            DESCRIPCIÓN DEL SERVICIO / PRODUCTO
          </Text>
          <Text style={{ width: 36, fontSize: 6.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.slate700, textAlign: "center", letterSpacing: 0.5 }}>
            CANT.
          </Text>
          <Text style={{ width: 68, fontSize: 6.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.slate700, textAlign: "right", letterSpacing: 0.5 }}>
            P. UNITARIO
          </Text>
          <Text style={{ width: 72, fontSize: 6.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.slate700, textAlign: "right", letterSpacing: 0.5 }}>
            TOTAL
          </Text>
        </View>

        {/* Items and Closing stream */}
        {isFewItems ? (
          <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <View>
              {items.map((item, idx) => (
                <QuoteItemBlock
                  key={item.id}
                  item={item}
                  metrics={metrics}
                  isLast={idx === items.length - 1}
                />
              ))}
            </View>
            <View style={{ flexGrow: metrics.spacerGrow, minHeight: metrics.minSpacerHeight }} />
            <Closing
              quote={quote}
              business={business}
              metrics={metrics}
              observation={observation}
              themeColor={themeColor}
              themeContrast={themeContrast}
            />
          </View>
        ) : (
          <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {allExceptLast.map((item) => (
              <QuoteItemBlock
                key={item.id}
                item={item}
                metrics={metrics}
                isLast={false}
              />
            ))}

            {/* THE MASTER COUPLING: Last Item + Closing Block wrapped together!
                Guarantees that Closing can NEVER be alone on a page! */}
            <View wrap={false} style={{ display: "flex", flexDirection: "column" }}>
              {lastItem ? (
                <QuoteItemBlock
                  item={lastItem}
                  metrics={metrics}
                  isLast={true}
                />
              ) : null}
              <Closing
                quote={quote}
                business={business}
                metrics={metrics}
                observation={observation}
                themeColor={themeColor}
                themeContrast={themeContrast}
              />
            </View>
          </View>
        )}

        {/* Footer: Fixed on every page */}
        <View
          style={{
            position: "absolute",
            bottom: PDF_LAYOUT.footerBottom,
            left: PDF_LAYOUT.pageHorizontal,
            right: PDF_LAYOUT.pageHorizontal,
            borderTopWidth: 0.5,
            borderTopColor: PDF_COLORS.line,
            paddingTop: 4,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          fixed
        >
          <Text style={{ fontSize: 6.6, color: PDF_COLORS.slate400 }}>
            {business.pie_pagina || business.nombre || "Cotización"}
          </Text>
          <Text
            style={{ fontSize: 6.6, color: PDF_COLORS.slate400 }}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

async function run() {
  const logoPath = resolve("public/assets/logos/logo_orbynex_horizontal_claro_v2.png");
  const logoBase64 = readFileSync(logoPath).toString("base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  mkdirSync("public/assets/qa_stress", { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const stressCases = [
    { id: "stress_2_ai", name: "2 Items IA", items: generateItems(2, true) },
    { id: "stress_4_ai", name: "4 Items IA", items: generateItems(4, true) },
    { id: "stress_6_ai", name: "6 Items IA", items: generateItems(6, true) },
    { id: "stress_10_ai", name: "10 Items IA (Multi-página)", items: generateItems(10, true) },
    { id: "stress_15_short", name: "15 Items Cortos", items: generateItems(15, false) },
    { id: "stress_20_ai", name: "20 Items IA (Catálogo Extenso)", items: generateItems(20, true) },
  ];

  for (const c of stressCases) {
    const q = buildQuote(c.items);
    const pdfPath = resolve(`public/assets/qa_stress/${c.id}.pdf`);
    await renderToFile(
      <ContinuousMultiPageDocument
        quote={q}
        items={c.items}
        business={businessDemo}
        client={clientDemo}
        logoDataUrl={logoDataUrl}
      />,
      pdfPath
    );

    const buf = readFileSync(pdfPath);
    const pages = buf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length || 0;

    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
    await page.goto("file:///" + pdfPath.replace(/\\/g, "/"));
    await page.waitForTimeout(1500);
    const pngPath = resolve(`public/assets/qa_stress/${c.id}_p1.png`);
    await page.screenshot({ path: pngPath, fullPage: false });

    if (pages > 1) {
      await page.keyboard.press("End");
      await page.waitForTimeout(1000);
      const lastPngPath = resolve(`public/assets/qa_stress/${c.id}_last.png`);
      await page.screenshot({ path: lastPngPath, fullPage: false });
    }

    await page.close();

    console.log(`[${pages} páginas] ${c.name} -> ${pdfPath}`);
  }

  await browser.close();
}

run().catch(console.error);
