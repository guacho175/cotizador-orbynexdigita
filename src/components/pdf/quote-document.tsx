import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Business, Client, Quote, QuoteItem } from "@/lib/types";
import { formatDate, lineTotal, money, quoteNumber, addDays } from "@/lib/format";

const NAVY = "#0b2545";
const AMBER = "#e0930f";
const LINE = "#dbe2ea";
const MUTED = "#5b6b7f";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 64,
    paddingHorizontal: 34,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#14202e",
  },
  headerBar: {
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { width: 46, height: 46, objectFit: "contain", marginRight: 12 },
  brandName: { color: "#ffffff", fontSize: 15, fontFamily: "Helvetica-Bold" },
  brandLine: { color: "#c3d2e4", fontSize: 8, marginTop: 2 },
  quoteBadge: { alignItems: "flex-end" },
  quoteLabel: { color: AMBER, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  quoteNumber: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
  quoteDate: { color: "#c3d2e4", fontSize: 8, marginTop: 2 },

  panels: { flexDirection: "row", marginTop: 16, gap: 10 },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 10,
  },
  panelTitle: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: AMBER,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  strong: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  small: { fontSize: 8.5, color: MUTED, marginBottom: 1.5 },

  tableHead: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 18,
  },
  th: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  colDesc: { flex: 1, paddingRight: 8 },
  colQty: { width: 46, textAlign: "right" },
  colPrice: { width: 78, textAlign: "right" },
  colTotal: { width: 84, textAlign: "right" },
  cell: { fontSize: 9 },
  cellMuted: { fontSize: 8, color: MUTED, marginTop: 2 },

  itemsBox: { flexGrow: 1 },
  itemTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  itemSubtitle: { fontSize: 8.5, color: AMBER, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  itemParagraph: { fontSize: 9, lineHeight: 1.4, marginBottom: 4 },
  itemIncludesHeader: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  bulletRow: { flexDirection: "row", marginBottom: 2, paddingRight: 4 },
  bulletDot: { width: 7, height: 7, backgroundColor: AMBER, marginRight: 6, marginTop: 1.5 },
  bulletText: { fontSize: 9, flex: 1, lineHeight: 1.3 },

  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totals: { width: 230 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: NAVY,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  grandLabel: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 10 },
  grandValue: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 12 },

  bank: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: LINE,
    borderLeftWidth: 4,
    borderLeftColor: AMBER,
    borderRadius: 8,
    padding: 10,
  },
  bankGrid: { flexDirection: "row", flexWrap: "wrap" },
  bankItem: { width: "50%", marginBottom: 3 },

  terms: { marginTop: 12, fontSize: 8, color: MUTED, lineHeight: 1.4 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 34,
    right: 34,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: MUTED },
});

interface ParsedItemDescription {
  title?: string;
  subtitle?: string;
  paragraph?: string;
  includesHeader?: string;
  bullets?: string[];
  plain?: string;
}

/**
 * Item descriptions are plain text. The AI "Mejorar redacción" mode writes them in a
 * title / spec-subtitle / paragraph / "incluye:" / bullet-lines convention; this parses
 * that convention when present and falls back to plain text otherwise.
 */
function parseItemDescription(raw: string): ParsedItemDescription {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const bulletStart = lines.findIndex((line) => /^[-•]\s+/.test(line));
  if (lines.length < 2 || bulletStart <= 0) return { plain: raw };

  const hasHeader = /incluye:?$/i.test(lines[bulletStart - 1]);
  const bodyEnd = hasHeader ? bulletStart - 1 : bulletStart;
  const bodyLines = lines.slice(0, bodyEnd);
  if (bodyLines.length === 0) return { plain: raw };

  const bullets = lines.slice(bulletStart).map((line) => line.replace(/^[-•]\s+/, ""));
  const [title, ...rest] = bodyLines;
  let subtitle: string | undefined;
  let paragraphLines = rest;
  if (rest[0]?.includes("|") && rest[0].length < 90) {
    subtitle = rest[0];
    paragraphLines = rest.slice(1);
  }

  return {
    title,
    subtitle,
    paragraph: paragraphLines.join(" ").trim() || undefined,
    includesHeader: hasHeader ? lines[bulletStart - 1] : "El servicio incluye:",
    bullets,
  };
}

function ItemDescription({ text }: { text: string }) {
  const parsed = parseItemDescription(text || "");
  if (parsed.plain !== undefined) {
    return <Text style={styles.cell}>{parsed.plain || "—"}</Text>;
  }
  return (
    <View>
      {parsed.title ? <Text style={styles.itemTitle}>{parsed.title}</Text> : null}
      {parsed.subtitle ? <Text style={styles.itemSubtitle}>{parsed.subtitle}</Text> : null}
      {parsed.paragraph ? <Text style={styles.itemParagraph}>{parsed.paragraph}</Text> : null}
      {parsed.bullets?.length ? (
        <View>
          <Text style={styles.itemIncludesHeader}>{parsed.includesHeader}</Text>
          {parsed.bullets.map((bullet, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export interface QuoteDocumentProps {
  quote: Quote;
  items: QuoteItem[];
  business: Business;
  client: Client | null;
  logoDataUrl?: string | null;
}

export function QuoteDocument({ quote, items, business, client, logoDataUrl }: QuoteDocumentProps) {
  const validUntil = addDays(quote.fecha, quote.validez_dias || 0);

  return (
    <Document
      title={`Cotización ${quoteNumber(quote.numero)}`}
      author={business.nombre || "Cotización"}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerBar} fixed>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>{business.nombre || "Tu empresa"}</Text>
              {business.giro ? <Text style={styles.brandLine}>{business.giro}</Text> : null}
              {business.rut ? <Text style={styles.brandLine}>RUT {business.rut}</Text> : null}
            </View>
          </View>
          <View style={styles.quoteBadge}>
            <Text style={styles.quoteLabel}>COTIZACIÓN N°</Text>
            <Text style={styles.quoteNumber}>{quoteNumber(quote.numero)}</Text>
            <Text style={styles.quoteDate}>Fecha: {formatDate(quote.fecha)}</Text>
            <Text style={styles.quoteDate}>Válida hasta: {formatDate(validUntil)}</Text>
          </View>
        </View>

        <View style={styles.panels}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>EMISOR</Text>
            <Text style={styles.strong}>{business.nombre || "—"}</Text>
            {business.direccion ? <Text style={styles.small}>{business.direccion}</Text> : null}
            {business.telefono ? <Text style={styles.small}>Tel: {business.telefono}</Text> : null}
            {business.email ? <Text style={styles.small}>{business.email}</Text> : null}
            {business.sitio_web ? <Text style={styles.small}>{business.sitio_web}</Text> : null}
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>CLIENTE</Text>
            <Text style={styles.strong}>{client?.nombre || "Sin cliente asignado"}</Text>
            {client?.rut ? <Text style={styles.small}>RUT {client.rut}</Text> : null}
            {quote.atencion ? <Text style={styles.small}>Atención: {quote.atencion}</Text> : null}
            {client?.direccion ? <Text style={styles.small}>{client.direccion}</Text> : null}
            {client?.telefono ? <Text style={styles.small}>Tel: {client.telefono}</Text> : null}
            {client?.email ? <Text style={styles.small}>{client.email}</Text> : null}
          </View>
        </View>

        <View style={styles.tableHead} fixed>
          <Text style={[styles.th, styles.colDesc]}>DESCRIPCIÓN</Text>
          <Text style={[styles.th, styles.colQty]}>CANT.</Text>
          <Text style={[styles.th, styles.colPrice]}>P. UNITARIO</Text>
          <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.row} wrap={false}>
            <View style={styles.colDesc}>
              <Text style={styles.cell}>{item.descripcion || "—"}</Text>
            </View>
            <Text style={[styles.cell, styles.colQty]}>{item.cantidad}</Text>
            <Text style={[styles.cell, styles.colPrice]}>{money(item.precio_unitario)}</Text>
            <Text style={[styles.cell, styles.colTotal]}>
              {money(lineTotal(item.cantidad, item.precio_unitario))}
            </Text>
          </View>
        ))}

        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.cell}>Subtotal</Text>
              <Text style={styles.cell}>{money(quote.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.cell}>IVA ({quote.iva_percent}%)</Text>
              <Text style={styles.cell}>{money(quote.iva)}</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{money(quote.total)}</Text>
            </View>
          </View>
        </View>

        {business.banco_nombre || business.banco_numero_cuenta ? (
          <View style={styles.bank} wrap={false}>
            <Text style={styles.panelTitle}>DATOS DE TRANSFERENCIA</Text>
            <View style={styles.bankGrid}>
              <View style={styles.bankItem}>
                <Text style={styles.small}>Titular: {business.banco_titular || "—"}</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.small}>RUT: {business.banco_rut || "—"}</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.small}>Banco: {business.banco_nombre || "—"}</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.small}>Tipo de cuenta: {business.banco_tipo_cuenta || "—"}</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.small}>N° de cuenta: {business.banco_numero_cuenta || "—"}</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.small}>Email: {business.banco_email || "—"}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {business.condiciones ? <Text style={styles.terms}>{business.condiciones}</Text> : null}

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
