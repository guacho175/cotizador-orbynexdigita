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

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: AMBER,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: { color: AMBER, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  itemBlock: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  priceCol: {
    width: 90,
    alignItems: "flex-end",
  },
  priceValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  priceCurrency: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  priceQty: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 4,
  },

  itemsBox: { flexGrow: 1 },
  itemTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 2, textTransform: "uppercase", textAlign: "justify" },
  itemSubtitle: { fontSize: 8.5, color: AMBER, fontFamily: "Helvetica-Bold", marginBottom: 6, textAlign: "justify" },
  itemParagraph: { fontSize: 9, lineHeight: 1.4, marginBottom: 6, textAlign: "justify" },
  itemIncludesHeader: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4, textAlign: "justify" },
  bulletRow: { flexDirection: "row", marginBottom: 3, paddingRight: 4, alignItems: "flex-start" },
  bulletCheck: { 
    width: 12, 
    height: 12, 
    backgroundColor: AMBER, 
    color: "#ffffff", 
    fontSize: 8,
    textAlign: "center",
    borderRadius: 2,
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: { fontSize: 9, flex: 1, lineHeight: 1.3, textAlign: "justify" },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
  },
  observacionCol: {
    flex: 1,
    paddingRight: 20,
  },
  observacionLabel: {
    fontSize: 8,
    color: AMBER,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  observacionText: {
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.4,
    textAlign: "justify",
  },

  totalsCol: { width: 180 },
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

  bankBar: {
    flexDirection: "row",
    marginTop: 18,
    gap: 10,
  },
  bankCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fafbfc",
  },
  bankTitle: {
    fontSize: 7.5,
    color: AMBER,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bankText: {
    fontSize: 7.5,
    color: MUTED,
    marginBottom: 2,
  },
  bankBold: {
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },

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
    return <Text style={styles.itemParagraph}>{parsed.plain || "—"}</Text>;
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
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function getContrastColor(hexcolor: string) {
  const hex = hexcolor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return "#ffffff";
  const fullHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#14202e" : "#ffffff";
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
  const themeColor = business.color_factura || NAVY;
  const contrastColor = getContrastColor(themeColor);

  return (
    <Document
      title={`Cotización ${quoteNumber(quote.numero, quote.folio_cliente)}`}
      author={business.nombre || "Cotización"}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={[styles.headerBar, { backgroundColor: themeColor }]} fixed>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandName, { color: contrastColor }]}>{business.nombre || "Tu empresa"}</Text>
              {business.giro ? <Text style={[styles.brandLine, { color: contrastColor, opacity: 0.8 }]}>{business.giro}</Text> : null}
              {business.rut ? <Text style={[styles.brandLine, { color: contrastColor, opacity: 0.8 }]}>RUT {business.rut}</Text> : null}
            </View>
          </View>
          <View style={styles.quoteBadge}>
            <Text style={[styles.quoteLabel, { color: contrastColor, opacity: 0.9 }]}>COTIZACIÓN N°</Text>
            <Text style={[styles.quoteNumber, { color: contrastColor }]}>{quoteNumber(quote.numero, quote.folio_cliente)}</Text>
            <Text style={[styles.quoteDate, { color: contrastColor, opacity: 0.8 }]}>Fecha: {formatDate(quote.fecha)}</Text>
            <Text style={[styles.quoteDate, { color: contrastColor, opacity: 0.8 }]}>Válida hasta: {formatDate(validUntil)}</Text>
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

        <View style={styles.sectionHeader} fixed>
          <Text style={styles.sectionTitle}>DESCRIPCIÓN DEL SERVICIO</Text>
          <Text style={styles.sectionTitle}>VALOR UNITARIO</Text>
        </View>

        <View style={styles.itemsBox}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemBlock} wrap={false}>
              <View style={styles.itemTopRow}>
                <View style={{ flex: 1 }}>
                  <ItemDescription text={item.descripcion} />
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.priceValue}>{money(item.precio_unitario)}</Text>
                  <Text style={styles.priceCurrency}>CLP</Text>
                  {item.cantidad > 1 && (
                    <Text style={styles.priceQty}>
                      Cant: {item.cantidad} | {money(lineTotal(item.cantidad, item.precio_unitario))}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomRow} wrap={false}>
          <View style={styles.observacionCol}>
            <Text style={styles.observacionLabel}>Observación</Text>
            <Text style={styles.observacionText}>
              {quote.observaciones || business.condiciones || "La instalación considera la estructura actualmente disponible y una terminación profesional del material gráfico."}
            </Text>
          </View>

          <View style={styles.totalsCol}>
            <View style={styles.totalRow}>
              <Text style={styles.observacionText}>Valor neto</Text>
              <Text style={styles.observacionText}>{money(quote.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.observacionText}>IVA ({quote.iva_percent}%)</Text>
              <Text style={styles.observacionText}>{money(quote.iva)}</Text>
            </View>
            <View style={[styles.grandTotal, { backgroundColor: themeColor }]}>
              <Text style={[styles.grandLabel, { color: contrastColor }]}>TOTAL</Text>
              <Text style={[styles.grandValue, { color: contrastColor }]}>{money(quote.total)}</Text>
            </View>
          </View>
        </View>

        {business.banco_nombre || business.banco_numero_cuenta ? (
          <View style={styles.bankBar} wrap={false}>
            <View style={styles.bankCol}>
              <Text style={styles.bankTitle}>DATOS DE TRANSFERENCIA</Text>
              <Text style={styles.bankText}>
                <Text style={styles.bankBold}>{business.banco_titular?.toUpperCase() || "—"}</Text>
              </Text>
              <Text style={styles.bankText}>RUT {business.banco_rut || "—"}</Text>
              <Text style={styles.bankText}>
                <Text style={styles.bankBold}>{business.banco_nombre?.toUpperCase() || "—"}</Text> - {business.banco_tipo_cuenta?.toUpperCase() || "—"}
              </Text>
            </View>
            <View style={styles.bankCol}>
              <Text style={styles.bankTitle}>Confirmación de pago</Text>
              <Text style={styles.bankText}>
                N° de cuenta: <Text style={styles.bankBold}>{business.banco_numero_cuenta || "—"}</Text>
              </Text>
              <Text style={styles.bankText}>
                Email: {business.banco_email || "—"}
              </Text>
              <Text style={[styles.bankText, { marginTop: 4, lineHeight: 1.3 }]}>
                Una vez recibido el comprobante de transferencia, se dará curso a la solicitud.
              </Text>
            </View>
          </View>
        ) : null}



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
