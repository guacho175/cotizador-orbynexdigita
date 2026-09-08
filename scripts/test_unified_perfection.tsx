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

interface ParsedDescription {
  title?: string;
  subtitle?: string;
  paragraph?: string;
  includesHeader?: string;
  bullets: string[];
  plain?: string;
}

function parseDescription(raw: string): ParsedDescription {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletStart = lines.findIndex((line) => /^[-•]\s+/.test(line));
  if (bulletStart === -1) {
    if (lines.length > 1) {
      return {
        title: lines[0],
        paragraph: lines.slice(1).join(" "),
        bullets: [],
      };
    }
    return { plain: raw, bullets: [] };
  }

  const bullets = lines.slice(bulletStart).map((l) => l.replace(/^[-•]\s+/, ""));
  const headerIdx = lines.findIndex((l, i) => i < bulletStart && /incluye:?$/i.test(l));
  const hasHeader = headerIdx !== -1;
  const bodyEnd = hasHeader ? headerIdx : bulletStart;
  const bodyLines = lines.slice(0, bodyEnd);

  const title = bodyLines[0];
  const rest = bodyLines.slice(1);
  const hasSubtitle = Boolean(rest[0]?.includes("|") && rest[0].length < 100);

  return {
    title,
    subtitle: hasSubtitle ? rest[0] : undefined,
    paragraph: (hasSubtitle ? rest.slice(1) : rest).join(" ").trim() || undefined,
    includesHeader: hasHeader ? lines[headerIdx] : "El servicio incluye:",
    bullets,
  };
}

export type SpacingTier = "extra-spacious" | "spacious" | "compact" | "multipage";

export interface LayoutMetrics {
  tier: SpacingTier;
  clientCardPaddingV: number;
  clientCardMarginB: number;
  clientNameSize: number;
  tableHeaderPaddingV: number;
  tableHeaderMarginB: number;
  itemPaddingV: number;
  itemMarginB: number;
  itemTitleSize: number;
  itemSubtitleSize: number;
  itemTextSize: number;
  itemLineHeight: number;
  bulletMarginB: number;
  bulletDotSize: number;
  closingMarginT: number;
  paymentPadding: number;
  observationSize: number;
  totalsPaddingV: number;
  grandTotalBarPaddingV: number;
  grandTotalSize: number;
  spacerGrow: number;
  minSpacerHeight: number;
  splitIndex: number | null;
}

export function computeLayoutMetrics(items: QuoteItem[]): LayoutMetrics {
  const count = items.length;
  let totalBullets = 0;
  let totalLines = 0;

  for (const item of items) {
    const parsed = parseDescription(item.descripcion || "");
    totalBullets += parsed.bullets.length;
    totalLines += (item.descripcion || "").split(/\r?\n/).filter(Boolean).length;
  }

  // Typographic points weight
  const contentPoints = totalLines * 11 + totalBullets * 12 + count * 24;

  // RULE 1: 1-2 items (Short or AI)
  // If 1-2 short items: contentPoints < 160
  if (count <= 2 && contentPoints < 160) {
    return {
      tier: "extra-spacious",
      clientCardPaddingV: 10,
      clientCardMarginB: 14,
      clientNameSize: 10.5,
      tableHeaderPaddingV: 6,
      tableHeaderMarginB: 8,
      itemPaddingV: 22,
      itemMarginB: 14,
      itemTitleSize: 10,
      itemSubtitleSize: 8,
      itemTextSize: 8.5,
      itemLineHeight: 1.44,
      bulletMarginB: 4,
      bulletDotSize: 4,
      closingMarginT: 18,
      paymentPadding: 8.5,
      observationSize: 7.4,
      totalsPaddingV: 4.8,
      grandTotalBarPaddingV: 8,
      grandTotalSize: 12,
      spacerGrow: 1,
      minSpacerHeight: 20,
      splitIndex: null,
    };
  }

  // If 2 AI items (or 3 short items):
  if (count <= 2 || (count === 3 && totalBullets <= 3)) {
    return {
      tier: "spacious",
      clientCardPaddingV: 9,
      clientCardMarginB: 12,
      clientNameSize: 10,
      tableHeaderPaddingV: 5.5,
      tableHeaderMarginB: 7,
      itemPaddingV: 19,
      itemMarginB: 14,
      itemTitleSize: 9.8,
      itemSubtitleSize: 8,
      itemTextSize: 7.9,
      itemLineHeight: 1.38,
      bulletMarginB: 3.6,
      bulletDotSize: 3.8,
      closingMarginT: 16,
      paymentPadding: 7.5,
      observationSize: 7.2,
      totalsPaddingV: 4.2,
      grandTotalBarPaddingV: 7.5,
      grandTotalSize: 11.5,
      spacerGrow: 1,
      minSpacerHeight: 14,
      splitIndex: null,
    };
  }

  // RULE 2: 3-4 items (or 5 short items with no bullets): ALWAYS 1 PAGE!
  // Even with 4 full AI items, they compact gracefully to fit 1 single page!
  const isFiveShort = count === 5 && totalBullets === 0;
  if (count <= 4 || isFiveShort) {
    const isHeavyFour = count === 4 && totalBullets >= 10;
    return {
      tier: "compact",
      clientCardPaddingV: isHeavyFour ? 5 : 5.8,
      clientCardMarginB: isHeavyFour ? 5 : 6,
      clientNameSize: isHeavyFour ? 8.8 : 9.2,
      tableHeaderPaddingV: isHeavyFour ? 3.8 : 4.2,
      tableHeaderMarginB: isHeavyFour ? 3 : 4,
      itemPaddingV: isHeavyFour ? 4.5 : 5.8,
      itemMarginB: 0,
      itemTitleSize: isHeavyFour ? 8.5 : 8.8,
      itemSubtitleSize: 7.1,
      itemTextSize: isHeavyFour ? 7.1 : 7.3,
      itemLineHeight: isHeavyFour ? 1.18 : 1.24,
      bulletMarginB: isHeavyFour ? 1.4 : 1.8,
      bulletDotSize: 3.2,
      closingMarginT: isHeavyFour ? 6 : 8,
      paymentPadding: isHeavyFour ? 4.8 : 5.5,
      observationSize: 6.6,
      totalsPaddingV: isHeavyFour ? 2.2 : 2.6,
      grandTotalBarPaddingV: isHeavyFour ? 4.8 : 5.5,
      grandTotalSize: isHeavyFour ? 10 : 10.5,
      spacerGrow: isHeavyFour ? 0 : 1,
      minSpacerHeight: isHeavyFour ? 2 : 5,
      splitIndex: null, // NEVER split 3 or 4 items!
    };
  }

  // RULE 3: 5+ items with AI (or 6+ items): MULTIPAGE
  // Page 1 gets 3 or 4 items, Page 2 gets the remainder + Closing!
  const splitIndex = count === 5 ? 3 : Math.min(4, Math.ceil(count / 2));
  return {
    tier: "multipage",
    clientCardPaddingV: 6,
    clientCardMarginB: 7,
    clientNameSize: 9.3,
    tableHeaderPaddingV: 4.5,
    tableHeaderMarginB: 4,
    itemPaddingV: 7.5,
    itemMarginB: 4,
    itemTitleSize: 8.8,
    itemSubtitleSize: 7.2,
    itemTextSize: 7.4,
    itemLineHeight: 1.26,
    bulletMarginB: 2.2,
    bulletDotSize: 3.5,
    closingMarginT: 10,
    paymentPadding: 5.5,
    observationSize: 6.8,
    totalsPaddingV: 2.8,
    grandTotalBarPaddingV: 5.5,
    grandTotalSize: 10.5,
    spacerGrow: 0,
    minSpacerHeight: 0,
    splitIndex,
  };
}

function ItemRow({
  item,
  metrics,
  isLast,
}: {
  item: QuoteItem;
  metrics: LayoutMetrics;
  isLast: boolean;
}) {
  const parsed = parseDescription(item.descripcion || "");

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: metrics.itemPaddingV,
        borderBottomWidth: 0.5,
        borderBottomColor: PDF_COLORS.line,
        marginBottom: isLast ? 0 : metrics.itemMarginB,
      }}
      wrap={false}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          {parsed.title ? (
            <Text
              style={{
                fontSize: metrics.itemTitleSize,
                fontFamily: "Helvetica-Bold",
                color: PDF_COLORS.ink,
                marginBottom: 2.5,
                lineHeight: 1.15,
              }}
            >
              {parsed.title}
            </Text>
          ) : null}
          {parsed.subtitle ? (
            <Text
              style={{
                fontSize: metrics.itemSubtitleSize,
                fontFamily: "Helvetica-Bold",
                color: PDF_COLORS.amber,
                marginBottom: 2.5,
              }}
            >
              {parsed.subtitle}
            </Text>
          ) : null}
          {parsed.plain ? (
            <Text
              style={{
                fontSize: metrics.itemTextSize,
                lineHeight: metrics.itemLineHeight,
                color: PDF_COLORS.slate700,
                marginBottom: 2,
              }}
            >
              {parsed.plain}
            </Text>
          ) : null}
          {parsed.paragraph ? (
            <Text
              style={{
                fontSize: metrics.itemTextSize,
                lineHeight: metrics.itemLineHeight,
                color: PDF_COLORS.slate700,
                marginBottom: 3,
              }}
            >
              {parsed.paragraph}
            </Text>
          ) : null}

          {parsed.bullets.length > 0 ? (
            <View>
              {parsed.includesHeader ? (
                <Text
                  style={{
                    fontSize: metrics.itemSubtitleSize,
                    fontFamily: "Helvetica-Bold",
                    color: PDF_COLORS.ink,
                    marginBottom: 2,
                  }}
                >
                  {parsed.includesHeader}
                </Text>
              ) : null}
              {parsed.bullets.map((bullet, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: metrics.bulletMarginB,
                  }}
                >
                  <View
                    style={{
                      width: metrics.bulletDotSize,
                      height: metrics.bulletDotSize,
                      borderRadius: metrics.bulletDotSize / 2,
                      backgroundColor: PDF_COLORS.amber,
                      marginRight: 5,
                      marginTop: 3,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: metrics.itemTextSize,
                      lineHeight: metrics.itemLineHeight,
                      color: PDF_COLORS.slate700,
                    }}
                  >
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Text
          style={{
            width: 36,
            fontSize: metrics.itemTextSize,
            color: PDF_COLORS.slate700,
            textAlign: "center",
            paddingTop: 1,
          }}
        >
          {item.cantidad}
        </Text>
        <Text
          style={{
            width: 68,
            fontSize: metrics.itemTextSize + 0.5,
            color: PDF_COLORS.slate700,
            textAlign: "right",
            paddingTop: 1,
          }}
        >
          {money(item.precio_unitario)}
        </Text>
        <Text
          style={{
            width: 72,
            fontSize: metrics.itemTextSize + 1,
            fontFamily: "Helvetica-Bold",
            color: PDF_COLORS.ink,
            textAlign: "right",
            paddingTop: 1,
          }}
        >
          {money(item.cantidad * item.precio_unitario)}
        </Text>
      </View>
    </View>
  );
}

function TableHeader({
  metrics,
  isContinuation = false,
}: {
  metrics: LayoutMetrics;
  isContinuation?: boolean;
}) {
  return (
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
      wrap={false}
      minPresenceAhead={30}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 6.8,
          fontFamily: "Helvetica-Bold",
          color: PDF_COLORS.slate700,
          letterSpacing: 0.5,
        }}
      >
        {isContinuation
          ? "DESCRIPCIÓN DEL SERVICIO / PRODUCTO (CONTINUACIÓN)"
          : "DESCRIPCIÓN DEL SERVICIO / PRODUCTO"}
      </Text>
      <Text
        style={{
          width: 36,
          fontSize: 6.8,
          fontFamily: "Helvetica-Bold",
          color: PDF_COLORS.slate700,
          textAlign: "center",
          letterSpacing: 0.5,
        }}
      >
        CANT.
      </Text>
      <Text
        style={{
          width: 68,
          fontSize: 6.8,
          fontFamily: "Helvetica-Bold",
          color: PDF_COLORS.slate700,
          textAlign: "right",
          letterSpacing: 0.5,
        }}
      >
        P. UNITARIO
      </Text>
      <Text
        style={{
          width: 72,
          fontSize: 6.8,
          fontFamily: "Helvetica-Bold",
          color: PDF_COLORS.slate700,
          textAlign: "right",
          letterSpacing: 0.5,
        }}
      >
        TOTAL
      </Text>
    </View>
  );
}

function Closing({
  props,
  metrics,
  themeColor,
  themeContrast,
}: {
  props: QuoteDocumentProps;
  metrics: LayoutMetrics;
  themeColor: string;
  themeContrast: string;
}) {
  const { quote, business } = props;
  const observation =
    quote.observaciones ||
    business.condiciones ||
    "Propuesta comercial personalizada sujeta a confirmación de disponibilidad.";

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: metrics.closingMarginT,
        gap: 12,
      }}
      wrap={false}
      minPresenceAhead={60}
    >
      {/* Left Col: Observation + Payment Details */}
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

      {/* Right Col: Totals */}
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

export function UnifiedMasterQuoteDocument(props: QuoteDocumentProps) {
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

  const isMulti = metrics.splitIndex !== null;
  const page1Items = isMulti ? items.slice(0, metrics.splitIndex!) : items;
  const page2Items = isMulti ? items.slice(metrics.splitIndex!) : [];

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
        {/* Header Bar (fixed across all pages) */}
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
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Helvetica-Bold",
                  color: themeContrast,
                  letterSpacing: 0.2,
                }}
              >
                {business.nombre || "Tu Empresa"}
              </Text>
              {business.giro ? (
                <Text style={{ fontSize: 7.2, color: "#cbd5e1", marginTop: 1 }}>
                  {business.giro}
                </Text>
              ) : null}
              {issuerDetails ? (
                <Text style={{ fontSize: 6.6, color: "#94a3b8", marginTop: 3, lineHeight: 1.2 }}>
                  {issuerDetails}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ alignItems: "flex-end", minWidth: 120 }}>
            <Text
              style={{
                fontSize: 6.5,
                fontFamily: "Helvetica-Bold",
                color: "#fbbf24",
                letterSpacing: 0.8,
              }}
            >
              COTIZACIÓN N°
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Helvetica-Bold",
                color: themeContrast,
                marginTop: 1,
              }}
            >
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

        {/* Client Card (Page 1) */}
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
          minPresenceAhead={35}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              style={{
                fontSize: 6.5,
                fontFamily: "Helvetica-Bold",
                color: PDF_COLORS.amber,
                letterSpacing: 0.6,
                marginBottom: 1,
              }}
            >
              PREPARADO PARA
            </Text>
            <Text
              style={{
                fontSize: metrics.clientNameSize,
                fontFamily: "Helvetica-Bold",
                color: PDF_COLORS.ink,
              }}
            >
              {client?.nombre || "Sin cliente asignado"}
            </Text>
            <Text
              style={{
                fontSize: 7.2,
                color: PDF_COLORS.slate500,
                marginTop: 1,
              }}
            >
              {[
                client?.rut ? `RUT: ${client.rut}` : null,
                quote.atencion ? `Atención: ${quote.atencion}` : null,
              ]
                .filter(Boolean)
                .join("   |   ")}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            {client?.direccion ? (
              <Text
                style={{
                  fontSize: 7,
                  color: PDF_COLORS.slate500,
                  lineHeight: 1.3,
                  textAlign: "right",
                }}
              >
                {client.direccion}
              </Text>
            ) : null}
            <Text
              style={{
                fontSize: 7,
                color: PDF_COLORS.slate500,
                lineHeight: 1.3,
                textAlign: "right",
              }}
            >
              {[client?.telefono, client?.email].filter(Boolean).join("  •  ")}
            </Text>
          </View>
        </View>

        {/* Page 1 Items */}
        <TableHeader metrics={metrics} />
        <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <View>
            {page1Items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                metrics={metrics}
                isLast={idx === page1Items.length - 1}
              />
            ))}
          </View>

          {/* If Single Page: Spacer and Closing on Page 1 */}
          {!isMulti ? (
            <>
              <View
                style={{
                  flexGrow: metrics.spacerGrow,
                  minHeight: metrics.minSpacerHeight,
                }}
              />
              <Closing
                props={props}
                metrics={metrics}
                themeColor={themeColor}
                themeContrast={themeContrast}
              />
            </>
          ) : null}
        </View>

        {/* Page 2 Items & Closing (When Multi-Page) */}
        {isMulti ? (
          <View break style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <TableHeader metrics={metrics} isContinuation />
            <View>
              {page2Items.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  metrics={metrics}
                  isLast={idx === page2Items.length - 1}
                />
              ))}
            </View>
            <View style={{ flexGrow: 1, minHeight: 15 }} />
            <Closing
              props={props}
              metrics={metrics}
              themeColor={themeColor}
              themeContrast={themeContrast}
            />
          </View>
        ) : null}

        {/* Footer (fixed across all pages) */}
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

// Demo data
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

const ai1: QuoteItem = {
  id: "ai-1",
  quote_id: "demo",
  user_id: "u",
  orden: 1,
  descripcion:
    "DESARROLLO DE SITIO WEB CORPORATIVO PROFESIONAL\n" +
    "Plataforma Web Next.js | Optimización SEO y Cloud\n" +
    "Servicio integral de arquitectura digital, programación frontend de alto rendimiento y diseño responsivo adaptado a la identidad de marca.\n" +
    "El servicio incluye:\n" +
    "- Arquitectura de información y diseño UX/UI responsive adaptable a móviles, tablets y desktop.\n" +
    "- Desarrollo frontend de alto rendimiento con optimización SEO on-page y carga ultrarrápida.\n" +
    "- Integración de formulario de contacto con validación en tiempo real y enlace a WhatsApp Business.\n" +
    "- Configuración de panel autoadministrable, certificado SSL y despliegue en infraestructura cloud de alta disponibilidad.",
  cantidad: 1,
  precio_unitario: 450000,
  total: 450000,
};

const ai2: QuoteItem = {
  id: "ai-2",
  quote_id: "demo",
  user_id: "u",
  orden: 2,
  descripcion:
    "DISEÑO E IMPRESIÓN DE TARJETAS DE PRESENTACIÓN PREMIUM\n" +
    "Couché 350g | Termolaminado Soft-Touch\n" +
    "Producción gráfica corporativa de alta definición con acabado táctil premium para presentación comercial.\n" +
    "El servicio incluye:\n" +
    "- Formato estándar 9x5 cm en papel couché importado de 350 gramos de alto gramaje.\n" +
    "- Terminación con termolaminado mate soft-touch por ambas caras para mayor durabilidad y elegancia.\n" +
    "- Impresión offset digital de alta resolución a 4/4 colores (full color tiro y retiro).\n" +
    "- Puntas redondeadas y empaque de entrega rígido con control de calidad individual.",
  cantidad: 5,
  precio_unitario: 85000,
  total: 425000,
};

const ai3: QuoteItem = {
  id: "ai-3",
  quote_id: "demo",
  user_id: "u",
  orden: 3,
  descripcion:
    "LETRERO CORPORATIVO EN CAJA DE LUZ BACKLIGHT\n" +
    "Perfil 30x30 | Iluminación LED Samsung\n" +
    "Fabricación e instalación de letrero comercial de alta visibilidad diurna y nocturna para fachada principal.\n" +
    "El servicio incluye:\n" +
    "- Fabricación de bastidor en fierro electroesmaltado anticorrosivo.\n" +
    "- Sistema de iluminación interna LED de alta eficiencia con transformador IP67.\n" +
    "- Frontal de acrílico opal de 3 mm con gráfica translúcida LG Hausys.\n" +
    "- Fijación estructural a muro con pernos de anclaje de alta resistencia.",
  cantidad: 1,
  precio_unitario: 520000,
  total: 520000,
};

const ai4: QuoteItem = {
  id: "ai-4",
  quote_id: "demo",
  user_id: "u",
  orden: 4,
  descripcion:
    "BRANDING Y MANUAL DE IDENTIDAD VISUAL CORPORATIVA\n" +
    "Kit Vectorial Completo | Tipografías y Colores\n" +
    "Desarrollo de marca corporativa, construcción geométrica de imagotipo y manual de normas de uso comercial.\n" +
    "El servicio incluye:\n" +
    "- Diseño de logotipo principal y versiones secundarias para redes sociales.\n" +
    "- Definición de paleta cromática corporativa en RGB, CMYK y Pantone.\n" +
    "- Selección y licencias de fuentes tipográficas para papelería y digital.",
  cantidad: 1,
  precio_unitario: 280000,
  total: 280000,
};

const ai5: QuoteItem = {
  id: "ai-5",
  quote_id: "demo",
  user_id: "u",
  orden: 5,
  descripcion:
    "CONFIGURACIÓN DE SERVIDOR CLOUD Y CORREOS CORPORATIVOS\n" +
    "Google Workspace | DNS Seguro con SPF/DKIM/DMARC\n" +
    "Puesta en marcha y migración de casillas de correo electrónico institucionales con seguridad avanzada.\n" +
    "El servicio incluye:\n" +
    "- Alta y configuración de panel en la nube para 10 usuarios corporativos.\n" +
    "- Configuración de registros DNS contra suplantación y spam.\n" +
    "- Capacitación y soporte remoto para configuración en teléfonos móviles.",
  cantidad: 1,
  precio_unitario: 150000,
  total: 150000,
};

const ai6: QuoteItem = {
  id: "ai-6",
  quote_id: "demo",
  user_id: "u",
  orden: 6,
  descripcion:
    "CAMPAÑA PUBLICITARIA GOOGLE ADS Y META BUSINESS\n" +
    "Setup de Conversión | Segmentación Avanzada\n" +
    "Estrategia de adquisición de clientes potenciales con medición de ROI y optimización de palabras clave.\n" +
    "El servicio incluye:\n" +
    "- Configuración de píxel de seguimiento y Google Tag Manager.\n" +
    "- Creación de 3 grupos de anuncios con redacción persuasiva y copys de alto impacto.\n" +
    "- Reporte semanal de métricas de costo por clic (CPC) y conversión.",
  cantidad: 1,
  precio_unitario: 220000,
  total: 220000,
};

const s1: QuoteItem = {
  id: "s-1",
  quote_id: "demo",
  user_id: "u",
  orden: 1,
  descripcion: "Instalación y configuración de cámara de seguridad IP exterior 4MP",
  cantidad: 2,
  precio_unitario: 65000,
  total: 130000,
};

const s2: QuoteItem = {
  id: "s-2",
  quote_id: "demo",
  user_id: "u",
  orden: 2,
  descripcion: "Punto de red cableado estructurado Cat6 con conector RJ45 blindado",
  cantidad: 4,
  precio_unitario: 25000,
  total: 100000,
};

const s3: QuoteItem = {
  id: "s-3",
  quote_id: "demo",
  user_id: "u",
  orden: 3,
  descripcion: "Certificación de punto de red con reflectómetro óptico y entrega de informe",
  cantidad: 4,
  precio_unitario: 15000,
  total: 60000,
};

const s4: QuoteItem = {
  id: "s-4",
  quote_id: "demo",
  user_id: "u",
  orden: 4,
  descripcion: "Switch Gigabit administrable de 16 puertos PoE+ 120W",
  cantidad: 1,
  precio_unitario: 180000,
  total: 180000,
};

const s5: QuoteItem = {
  id: "s-5",
  quote_id: "demo",
  user_id: "u",
  orden: 5,
  descripcion: "Gabinete mural rack 9U con puerta de vidrio templado y cerradura",
  cantidad: 1,
  precio_unitario: 95000,
  total: 95000,
};

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
      "Propuesta comercial personalizada. Los plazos de desarrollo e instalación comienzan a regir tras la recepción conforme del anticipo y visto bueno de artes digitales.",
  };
}

async function run() {
  const logoPath = resolve("public/assets/logos/logo_orbynex_horizontal_claro_v2.png");
  const logoBase64 = readFileSync(logoPath).toString("base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  mkdirSync("public/assets/qa_unified", { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const testMatrix = [
    { id: "case1_1prod_short", name: "1 Prod Corto", items: [s1] },
    { id: "case2_1prod_ai", name: "1 Prod IA", items: [ai1] },
    { id: "case3_2prod_short", name: "2 Prod Cortos", items: [s1, s2] },
    { id: "case4_2prod_ai_demo", name: "2 Prod IA (Demo de Usuario)", items: [ai1, ai2] },
    { id: "case5_3prod_ai", name: "3 Prod IA", items: [ai1, ai2, ai3] },
    { id: "case6_4prod_ai", name: "4 Prod IA", items: [ai1, ai2, ai3, ai4] },
    { id: "case7_5prod_short", name: "5 Prod Cortos", items: [s1, s2, s3, s4, s5] },
    { id: "case8_5prod_ai", name: "5 Prod IA", items: [ai1, ai2, ai3, ai4, ai5] },
    { id: "case9_6prod_ai", name: "6 Prod IA", items: [ai1, ai2, ai3, ai4, ai5, ai6] },
  ];

  for (const t of testMatrix) {
    const q = buildQuote(t.items);
    const pdfPath = resolve(`public/assets/qa_unified/${t.id}.pdf`);
    await renderToFile(
      <UnifiedMasterQuoteDocument
        quote={q}
        items={t.items}
        business={businessDemo}
        client={clientDemo}
        logoDataUrl={logoDataUrl}
      />,
      pdfPath
    );

    const buf = readFileSync(pdfPath);
    const pages = buf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length || 0;

    const page = await browser.newPage({ viewport: { width: 1200, height: pages > 1 ? 2600 : 1600 } });
    await page.goto("file:///" + pdfPath.replace(/\\/g, "/"));
    await page.waitForTimeout(1500);
    const pngPath = resolve(`public/assets/qa_unified/${t.id}.png`);
    await page.screenshot({ path: pngPath, fullPage: true });
    await page.close();

    console.log(`[${pages} pág] ${t.name} -> ${pngPath}`);
  }

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
