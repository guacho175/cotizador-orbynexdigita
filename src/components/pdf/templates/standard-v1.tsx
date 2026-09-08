import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { addDays, formatDate, money, quoteNumber } from "@/lib/format";
import { businessTaxLabel } from "@/lib/quote-lifecycle";
import type { QuoteDocumentProps } from "../core/model";
import { computeLayoutMetrics, type LayoutMetrics, QuoteItemBlock } from "../core/blocks/quote-item";
import { contrastColor, PDF_COLORS, PDF_LAYOUT } from "../core/tokens";

// Hyphenation callback for Spanish text
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: PDF_LAYOUT.pageTop,
    paddingBottom: PDF_LAYOUT.pageBottom,
    paddingHorizontal: PDF_LAYOUT.pageHorizontal,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: PDF_COLORS.ink,
    backgroundColor: PDF_COLORS.paper,
    display: "flex",
    flexDirection: "column",
  },
  headerBar: {
    position: "absolute",
    top: PDF_LAYOUT.headerTop,
    left: PDF_LAYOUT.pageHorizontal,
    right: PDF_LAYOUT.pageHorizontal,
    height: 64,
    backgroundColor: PDF_COLORS.navy,
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
    marginRight: 10,
  },
  issuerInfo: {
    flex: 1,
  },
  issuerName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.paper,
    letterSpacing: 0.2,
  },
  issuerGiro: {
    fontSize: 7.2,
    color: "#cbd5e1",
    marginTop: 1,
  },
  issuerContactRow: {
    fontSize: 6.6,
    color: "#94a3b8",
    marginTop: 3,
    lineHeight: 1.2,
  },
  headerRight: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  quoteTag: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#fbbf24",
    letterSpacing: 0.8,
  },
  quoteNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.paper,
    marginTop: 1,
  },
  quoteDraft: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.paper,
    marginTop: 1,
  },
  quoteDateRow: {
    fontSize: 6.8,
    color: "#cbd5e1",
    marginTop: 1,
  },
  footer: {
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
  },
  footerText: {
    fontSize: 6.6,
    color: PDF_COLORS.slate400,
  },
});

function Header({
  props,
  themeColor,
  themeContrast,
}: {
  props: QuoteDocumentProps;
  themeColor: string;
  themeContrast: string;
}) {
  const { quote, business, logoDataUrl } = props;
  const validUntil = addDays(quote.fecha, quote.validez_dias || 0);

  const issuerDetails = [
    business.rut ? `RUT: ${business.rut}` : null,
    business.telefono ? `Tel: ${business.telefono}` : null,
    business.email || null,
    business.sitio_web || null,
  ]
    .filter(Boolean)
    .join("  •  ");

  return (
    <View style={[styles.headerBar, { backgroundColor: themeColor }]} fixed>
      <View style={styles.headerLeft}>
        {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : null}
        <View style={styles.issuerInfo}>
          <Text style={[styles.issuerName, { color: themeContrast }]}>
            {business.nombre || "Tu Empresa"}
          </Text>
          {business.giro ? (
            <Text style={[styles.issuerGiro, { color: themeContrast, opacity: 0.85 }]}>
              {business.giro}
            </Text>
          ) : null}
          {issuerDetails ? (
            <Text style={[styles.issuerContactRow, { color: themeContrast, opacity: 0.75 }]}>
              {issuerDetails}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.quoteTag}>COTIZACIÓN N°</Text>
        <Text
          style={[
            quote.numero == null ? styles.quoteDraft : styles.quoteNumber,
            { color: themeContrast },
          ]}
        >
          {quote.numero == null ? "BORRADOR" : quoteNumber(quote.numero)}
        </Text>
        <Text style={[styles.quoteDateRow, { color: themeContrast, opacity: 0.85 }]}>
          Fecha: {formatDate(quote.fecha)}
        </Text>
        <Text style={[styles.quoteDateRow, { color: themeContrast, opacity: 0.85 }]}>
          Válida hasta: {formatDate(validUntil)}
        </Text>
      </View>
    </View>
  );
}

function ClientCard({
  props,
  metrics,
  themeColor,
}: {
  props: QuoteDocumentProps;
  metrics: LayoutMetrics;
  themeColor: string;
}) {
  const { client, quote } = props;

  return (
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
        <Text style={{ fontSize: 7.2, color: PDF_COLORS.slate500, marginTop: 1 }}>
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
          <Text style={{ fontSize: 7, color: PDF_COLORS.slate500, lineHeight: 1.3, textAlign: "right" }}>
            {client.direccion}
          </Text>
        ) : null}
        <Text style={{ fontSize: 7, color: PDF_COLORS.slate500, lineHeight: 1.3, textAlign: "right" }}>
          {[client?.telefono, client?.email].filter(Boolean).join("  •  ")}
        </Text>
      </View>
    </View>
  );
}

function TableHeader({
  metrics,
  fixed = false,
  isContinuation = false,
}: {
  metrics: LayoutMetrics;
  fixed?: boolean;
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
      fixed={fixed}
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
      {/* Left Column: Conditions + Payment Transfer Card */}
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

      {/* Right Column: Totals Card */}
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

export function StandardV1Template(props: QuoteDocumentProps) {
  const { quote, items, business } = props;
  const metrics = computeLayoutMetrics(items);
  const themeColor = business.color_factura || PDF_COLORS.navy;
  const themeContrast = contrastColor(themeColor);

  const isFewItems = items.length <= 2;
  const allExceptLast = items.slice(0, items.length - 1);
  const lastItem = items[items.length - 1];

  return (
    <Document
      title={`Cotización ${quote.numero == null ? "borrador" : quoteNumber(quote.numero)}`}
      author={business.nombre || "Cotización"}
    >
      <Page size="A4" style={styles.page} wrap>
        <Header props={props} themeColor={themeColor} themeContrast={themeContrast} />
        <ClientCard props={props} metrics={metrics} themeColor={themeColor} />
        <TableHeader metrics={metrics} fixed />

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
                props={props}
                metrics={metrics}
                themeColor={themeColor}
                themeContrast={themeContrast}
              />
            </View>
          </View>
        )}

        {/* Footer (fixed across all pages) */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {business.pie_pagina || business.nombre || "Cotización"}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
