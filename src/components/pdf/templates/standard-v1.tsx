import {
  Document,
  Font,
  Image,
  Link,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { addDays, formatDate, money, quoteNumber } from "@/lib/format";
import type { QuoteDocumentProps } from "../core/model";
import { QuoteItemBlock } from "../core/blocks/quote-item";
import { contrastColor, PDF_COLORS, PDF_LAYOUT } from "../core/tokens";

// React PDF otherwise applies an English-oriented hyphenator to Spanish copy.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: PDF_LAYOUT.pageTop,
    paddingBottom: PDF_LAYOUT.pageBottom,
    paddingHorizontal: PDF_LAYOUT.pageHorizontal,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: PDF_COLORS.ink,
  },
  headerBar: {
    position: "absolute",
    top: PDF_LAYOUT.headerTop,
    left: PDF_LAYOUT.pageHorizontal,
    right: PDF_LAYOUT.pageHorizontal,
    height: 76,
    backgroundColor: PDF_COLORS.navy,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  logo: { width: 46, height: 46, objectFit: "contain", marginRight: 12 },
  brandDetails: { flex: 1 },
  brandName: { color: PDF_COLORS.paper, fontSize: 15, fontFamily: "Helvetica-Bold" },
  brandLine: { color: "#c3d2e4", fontSize: 8, marginTop: 2 },
  quoteBadge: { alignItems: "flex-end" },
  quoteLabel: {
    color: PDF_COLORS.amber,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  quoteNumber: { color: PDF_COLORS.paper, fontSize: 18, fontFamily: "Helvetica-Bold" },
  quoteDraft: { color: PDF_COLORS.paper, fontSize: 12, fontFamily: "Helvetica-Bold" },
  quoteDate: { color: "#c3d2e4", fontSize: 8, marginTop: 2 },
  panels: { flexDirection: "row", gap: 10 },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: PDF_COLORS.line,
    borderRadius: 8,
    padding: 10,
  },
  panelTitle: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: PDF_COLORS.amber,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  strong: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  small: { fontSize: 8.5, color: PDF_COLORS.muted, marginBottom: 1.5 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.amber,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    color: PDF_COLORS.amber,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  itemsBox: { width: "100%", flexGrow: 1 },
  itemsSpacer: { flexGrow: 1 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.line,
    paddingTop: 10,
  },
  observationColumn: { flex: 1, paddingRight: 20 },
  observationLong: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.line,
    paddingTop: 10,
  },
  observationLabel: {
    fontSize: 8,
    color: PDF_COLORS.amber,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  observationText: {
    fontSize: 8,
    color: PDF_COLORS.muted,
    lineHeight: 1.4,
    textAlign: "justify",
  },
  totalsCol: { width: 180 },
  totalsStandalone: { width: 180, alignSelf: "flex-end", marginTop: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: PDF_COLORS.navy,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  grandLabel: { color: PDF_COLORS.paper, fontFamily: "Helvetica-Bold", fontSize: 10 },
  grandValue: { color: PDF_COLORS.paper, fontFamily: "Helvetica-Bold", fontSize: 12 },
  paymentCard: {
    width: "88%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: PDF_COLORS.line,
    backgroundColor: "#fafbfc",
    borderRadius: 8,
    marginTop: 8,
    padding: 7,
    flexDirection: "row",
  },
  paymentColLeft: { flex: 0.7, paddingRight: 6 },
  paymentColRight: {
    flex: 0.3,
    borderLeftWidth: 1,
    borderLeftColor: PDF_COLORS.line,
    paddingLeft: 7,
  },
  paymentHeader: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    flexDirection: "row",
  },
  paymentHeaderNum: { color: PDF_COLORS.amber, marginRight: 2 },
  paymentHeaderText: { color: PDF_COLORS.navy },
  paymentHeaderAccent: { color: PDF_COLORS.amber },
  paymentGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 4, marginBottom: 2 },
  paymentField: { width: "50%", paddingRight: 4 },
  paymentLabel: { fontSize: 5.8, color: PDF_COLORS.muted, marginBottom: 1 },
  paymentValue: { fontSize: 6.7, color: PDF_COLORS.navy },
  paymentValueBold: {
    fontSize: 6.7,
    color: PDF_COLORS.navy,
    fontFamily: "Helvetica-Bold",
  },
  accountBox: {
    backgroundColor: "#fff7e6",
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 2,
    marginRight: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountLabel: {
    fontSize: 6,
    color: PDF_COLORS.amber,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  accountNumber: { fontSize: 10.5, color: PDF_COLORS.navy, fontFamily: "Helvetica-Bold" },
  emailLabel: { fontSize: 6.2, color: PDF_COLORS.muted, marginBottom: 2 },
  emailLink: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.navy,
    textDecoration: "none",
  },
  footer: {
    position: "absolute",
    bottom: PDF_LAYOUT.footerBottom,
    left: PDF_LAYOUT.pageHorizontal,
    right: PDF_LAYOUT.pageHorizontal,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.line,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: PDF_COLORS.muted },
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

  return (
    <View style={[styles.headerBar, { backgroundColor: themeColor }]}>
      <View style={styles.brandRow}>
        {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : null}
        <View style={styles.brandDetails}>
          <Text style={[styles.brandName, { color: themeContrast }]}>
            {business.nombre || "Tu empresa"}
          </Text>
          {business.giro ? (
            <Text style={[styles.brandLine, { color: themeContrast, opacity: 0.8 }]}>
              {business.giro}
            </Text>
          ) : null}
          {business.rut ? (
            <Text style={[styles.brandLine, { color: themeContrast, opacity: 0.8 }]}>
              RUT {business.rut}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.quoteBadge}>
        <Text style={[styles.quoteLabel, { color: themeContrast, opacity: 0.9 }]}>
          COTIZACIÓN N°
        </Text>
        <Text
          style={[
            quote.numero == null ? styles.quoteDraft : styles.quoteNumber,
            { color: themeContrast },
          ]}
        >
          {quote.numero == null ? "BORRADOR" : quoteNumber(quote.numero)}
        </Text>
        <Text style={[styles.quoteDate, { color: themeContrast, opacity: 0.8 }]}>
          Fecha: {formatDate(quote.fecha)}
        </Text>
        <Text style={[styles.quoteDate, { color: themeContrast, opacity: 0.8 }]}>
          Válida hasta: {formatDate(validUntil)}
        </Text>
      </View>
    </View>
  );
}

function PartyPanels({ props }: { props: QuoteDocumentProps }) {
  const { business, client, quote } = props;
  return (
    <View style={styles.panels} wrap={false} minPresenceAhead={120}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>EMISOR</Text>
        <Text style={styles.strong}>{business.nombre || "-"}</Text>
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
  );
}

function Totals({
  props,
  themeColor,
  themeContrast,
  standalone = false,
}: {
  props: QuoteDocumentProps;
  themeColor: string;
  themeContrast: string;
  standalone?: boolean;
}) {
  const { quote } = props;
  return (
    <View
      style={standalone ? styles.totalsStandalone : styles.totalsCol}
      wrap={false}
      minPresenceAhead={76}
    >
      <View style={styles.totalRow}>
        <Text style={styles.observationText}>Valor neto</Text>
        <Text style={styles.observationText}>{money(quote.subtotal)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.observationText}>IVA ({quote.iva_percent}%)</Text>
        <Text style={styles.observationText}>{money(quote.iva)}</Text>
      </View>
      <View style={[styles.grandTotal, { backgroundColor: themeColor }]}>
        <Text style={[styles.grandLabel, { color: themeContrast }]}>TOTAL</Text>
        <Text style={[styles.grandValue, { color: themeContrast }]}>{money(quote.total)}</Text>
      </View>
    </View>
  );
}

function Closing({
  props,
  themeColor,
  themeContrast,
}: {
  props: QuoteDocumentProps;
  themeColor: string;
  themeContrast: string;
}) {
  const { quote, business } = props;
  const observation =
    quote.observaciones ||
    business.condiciones ||
    "La instalación considera la estructura actualmente disponible y una terminación profesional del material gráfico.";
  const isLongObservation = observation.length > 620;

  return (
    <>
      {isLongObservation ? (
        <>
          <View style={styles.observationLong} minPresenceAhead={56}>
            <Text style={styles.observationLabel}>Observación</Text>
            <Text style={styles.observationText} orphans={3} widows={3}>
              {observation}
            </Text>
          </View>
          <Totals props={props} themeColor={themeColor} themeContrast={themeContrast} standalone />
        </>
      ) : (
        <View style={styles.bottomRow} wrap={false} minPresenceAhead={112}>
          <View style={styles.observationColumn}>
            <Text style={styles.observationLabel}>Observación</Text>
            <Text style={styles.observationText}>{observation}</Text>
          </View>
          <Totals props={props} themeColor={themeColor} themeContrast={themeContrast} />
        </View>
      )}
      <PaymentDetails business={business} />
    </>
  );
}

function PaymentDetails({ business }: Pick<QuoteDocumentProps, "business">) {
  if (!business.banco_nombre && !business.banco_numero_cuenta) return null;

  return (
    <View style={styles.paymentCard} wrap={false} minPresenceAhead={112}>
      <View style={styles.paymentColLeft}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentHeaderAccent}>CÓMO PAGAR · </Text>
          <Text style={styles.paymentHeaderNum}>1</Text>
          <Text style={styles.paymentHeaderText}>TRANSFIERE</Text>
        </View>
        <View style={styles.paymentGrid}>
          <View style={styles.paymentField}>
            <Text style={styles.paymentLabel}>Titular</Text>
            <Text style={styles.paymentValueBold}>{business.banco_titular || "-"}</Text>
          </View>
          <View style={styles.paymentField}>
            <Text style={styles.paymentLabel}>RUT</Text>
            <Text style={styles.paymentValue}>{business.banco_rut || "-"}</Text>
          </View>
          <View style={styles.paymentField}>
            <Text style={styles.paymentLabel}>Banco</Text>
            <Text style={styles.paymentValueBold}>{business.banco_nombre || "-"}</Text>
          </View>
          <View style={styles.paymentField}>
            <Text style={styles.paymentLabel}>Tipo</Text>
            <Text style={styles.paymentValue}>{business.banco_tipo_cuenta || "-"}</Text>
          </View>
        </View>
        <View style={styles.accountBox}>
          <View>
            <Text style={styles.accountLabel}>N° DE CUENTA</Text>
            <Text style={styles.accountNumber}>{business.banco_numero_cuenta || "-"}</Text>
          </View>
          <Svg width="8" height="8" viewBox="0 0 8 8">
            <Rect
              x="1"
              y="2.5"
              width="4.5"
              height="4.5"
              rx="0.5"
              fill="none"
              stroke={PDF_COLORS.muted}
              strokeWidth="0.7"
            />
            <Rect
              x="2.5"
              y="1"
              width="4.5"
              height="4.5"
              rx="0.5"
              fill="none"
              stroke={PDF_COLORS.muted}
              strokeWidth="0.7"
            />
          </Svg>
        </View>
      </View>
      <View style={styles.paymentColRight}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentHeaderNum}>2</Text>
          <Text style={styles.paymentHeaderText}>ENVÍA EL COMPROBANTE</Text>
        </View>
        <Text style={styles.emailLabel}>Envía el comprobante a</Text>
        {business.banco_email ? (
          <Link src={`mailto:${business.banco_email}`} style={styles.emailLink}>
            {business.banco_email}
          </Link>
        ) : (
          <Text style={styles.paymentValue}>-</Text>
        )}
      </View>
    </View>
  );
}

export function StandardV1Template(props: QuoteDocumentProps) {
  const { quote, items, business } = props;
  const themeColor = business.color_factura || PDF_COLORS.navy;
  const themeContrast = contrastColor(themeColor);

  return (
    <Document
      title={`Cotización ${quote.numero == null ? "borrador" : quoteNumber(quote.numero)}`}
      author={business.nombre || "Cotización"}
    >
      <Page size="A4" style={styles.page} wrap>
        <Header props={props} themeColor={themeColor} themeContrast={themeContrast} />
        <PartyPanels props={props} />

        <View style={styles.sectionHeader} wrap={false} minPresenceAhead={90}>
          <Text style={styles.sectionTitle}>DESCRIPCIÓN DEL SERVICIO</Text>
          <Text style={styles.sectionTitle}>VALOR UNITARIO</Text>
        </View>

        <View style={styles.itemsBox}>
          {items.map((item) => (
            <QuoteItemBlock key={item.id} item={item} />
          ))}
          <View style={styles.itemsSpacer} />
          <Closing props={props} themeColor={themeColor} themeContrast={themeContrast} />
        </View>

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
