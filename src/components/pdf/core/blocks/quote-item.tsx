import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { lineTotal, money } from "@/lib/format";
import type { QuoteItem } from "@/lib/types";
import { PDF_COLORS } from "../tokens";

const MAX_FRAGMENT_CHARACTERS = 760;
const SHORT_ITEM_CHARACTERS = 700;

const styles = StyleSheet.create({
  itemBlock: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  continuationBlock: {
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.line,
    paddingTop: 7,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  contentColumn: { flex: 1, paddingRight: 8 },
  priceCol: { width: 90, alignItems: "flex-end" },
  priceValue: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  priceCurrency: {
    fontSize: 7,
    color: PDF_COLORS.muted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  priceQty: { fontSize: 7.5, color: PDF_COLORS.muted, marginTop: 4 },
  continuationPrice: {
    fontSize: 6.5,
    color: PDF_COLORS.muted,
    marginTop: 1,
    textAlign: "right",
  },
  continuationLabel: {
    color: PDF_COLORS.amber,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.navy,
    marginBottom: 2,
    textTransform: "uppercase",
    textAlign: "justify",
  },
  itemSubtitle: {
    fontSize: 8.5,
    color: PDF_COLORS.amber,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textAlign: "justify",
  },
  itemParagraph: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 6,
    textAlign: "justify",
  },
  itemIncludesHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    textAlign: "justify",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingRight: 4,
    alignItems: "flex-start",
  },
  bulletCheck: {
    width: 12,
    height: 12,
    backgroundColor: PDF_COLORS.amber,
    color: PDF_COLORS.paper,
    fontSize: 8,
    textAlign: "center",
    borderRadius: 2,
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: { fontSize: 9, flex: 1, lineHeight: 1.3, textAlign: "justify" },
});

interface ParsedItemDescription {
  title?: string;
  subtitle?: string;
  paragraph?: string;
  includesHeader?: string;
  bullets?: string[];
  plain?: string;
}

interface DescriptionFragment {
  title?: string;
  subtitle?: string;
  paragraphs: string[];
  includesHeader?: string;
  bullets: string[];
  plain?: string;
  continuation: boolean;
}

/** Parses the structured convention produced by the copy-improvement flow. */
function parseItemDescription(raw: string): ParsedItemDescription {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletStart = lines.findIndex((line) => /^[-•]\s+/.test(line));
  if (lines.length < 2 || bulletStart <= 0) return { plain: raw };

  const hasHeader = /incluye:?$/i.test(lines[bulletStart - 1]);
  const bodyEnd = hasHeader ? bulletStart - 1 : bulletStart;
  const bodyLines = lines.slice(0, bodyEnd);
  if (bodyLines.length === 0) return { plain: raw };

  const bullets = lines.slice(bulletStart).map((line) => line.replace(/^[-•]\s+/, ""));
  const [title, ...rest] = bodyLines;
  const hasSubtitle = Boolean(rest[0]?.includes("|") && rest[0].length < 90);

  return {
    title,
    subtitle: hasSubtitle ? rest[0] : undefined,
    paragraph: (hasSubtitle ? rest.slice(1) : rest).join(" ").trim() || undefined,
    includesHeader: hasHeader ? lines[bulletStart - 1] : "El servicio incluye:",
    bullets,
  };
}

function hardSplit(text: string, maximum: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= maximum) {
      current = `${current} ${word}`;
    } else {
      chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

/** Splits at paragraph/sentence boundaries before falling back to words. */
function semanticChunks(text: string, maximum = MAX_FRAGMENT_CHARACTERS): string[] {
  const units = text
    .split(/(?:\r?\n){2,}|(?<=[.!?])\s+/)
    .map((unit) => unit.trim())
    .filter(Boolean)
    .flatMap((unit) => (unit.length > maximum ? hardSplit(unit, maximum) : [unit]));

  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (!current) {
      current = unit;
    } else if (`${current} ${unit}`.length <= maximum) {
      current = `${current} ${unit}`;
    } else {
      chunks.push(current);
      current = unit;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.trim() || "-"];
}

function descriptionFragments(text: string): DescriptionFragment[] {
  const parsed = parseItemDescription(text || "");
  if (parsed.plain !== undefined) {
    return semanticChunks(parsed.plain).map((plain, index) => ({
      paragraphs: [],
      bullets: [],
      plain,
      continuation: index > 0,
    }));
  }

  const fragments: DescriptionFragment[] = [];
  const paragraphs = parsed.paragraph ? semanticChunks(parsed.paragraph) : [];
  const bullets = (parsed.bullets || []).flatMap((bullet) =>
    semanticChunks(bullet, Math.floor(MAX_FRAGMENT_CHARACTERS * 0.75)),
  );

  if (!paragraphs.length && !bullets.length) {
    paragraphs.push("");
  }

  for (const paragraph of paragraphs) {
    fragments.push({
      title: fragments.length === 0 ? parsed.title : undefined,
      subtitle: fragments.length === 0 ? parsed.subtitle : undefined,
      paragraphs: paragraph ? [paragraph] : [],
      bullets: [],
      continuation: fragments.length > 0,
    });
  }

  let current = fragments.at(-1);
  for (const bullet of bullets) {
    const currentLength =
      (current?.paragraphs.join(" ").length || 0) + (current?.bullets.join(" ").length || 0);
    if (!current || currentLength + bullet.length > MAX_FRAGMENT_CHARACTERS) {
      current = {
        paragraphs: [],
        includesHeader: parsed.includesHeader,
        bullets: [],
        continuation: fragments.length > 0,
      };
      fragments.push(current);
    }
    current.includesHeader = current.includesHeader || parsed.includesHeader;
    current.bullets.push(bullet);
  }

  return fragments;
}

function FragmentDescription({ fragment }: { fragment: DescriptionFragment }) {
  return (
    <>
      {fragment.continuation ? (
        <Text style={styles.continuationLabel}>CONTINUACIÓN DEL PRODUCTO</Text>
      ) : null}
      {fragment.title ? <Text style={styles.itemTitle}>{fragment.title}</Text> : null}
      {fragment.subtitle ? <Text style={styles.itemSubtitle}>{fragment.subtitle}</Text> : null}
      {fragment.plain ? (
        <Text style={styles.itemParagraph} orphans={3} widows={3}>
          {fragment.plain}
        </Text>
      ) : null}
      {fragment.paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.itemParagraph} orphans={3} widows={3}>
          {paragraph}
        </Text>
      ))}
      {fragment.bullets.length ? (
        <View>
          <Text style={styles.itemIncludesHeader}>{fragment.includesHeader}</Text>
          {fragment.bullets.map((bullet, index) => (
            <View key={index} style={styles.bulletRow} wrap={false}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.bulletText} orphans={2} widows={2}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function Price({ item, continuation }: { item: QuoteItem; continuation: boolean }) {
  if (continuation) {
    return <Text style={styles.continuationPrice}>Valor en el primer bloque</Text>;
  }

  return (
    <>
      <Text style={styles.priceValue}>{money(item.precio_unitario)}</Text>
      <Text style={styles.priceCurrency}>CLP</Text>
      {item.cantidad > 1 ? (
        <Text style={styles.priceQty}>
          Cant: {item.cantidad} | {money(lineTotal(item.cantidad, item.precio_unitario))}
        </Text>
      ) : null}
    </>
  );
}

export function QuoteItemBlock({ item }: { item: QuoteItem }) {
  const fragments = descriptionFragments(item.descripcion);
  const isShort =
    fragments.length === 1 && (item.descripcion?.length || 0) <= SHORT_ITEM_CHARACTERS;

  if (isShort) {
    return (
      <View style={styles.itemBlock} wrap={false} minPresenceAhead={72}>
        <View style={styles.itemTopRow}>
          <View style={styles.contentColumn}>
            <FragmentDescription fragment={fragments[0]} />
          </View>
          <View style={styles.priceCol}>
            <Price item={item} continuation={false} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.itemBlock} minPresenceAhead={88}>
      {fragments.map((fragment, index) => (
        <View
          key={index}
          style={index === 0 ? styles.itemTopRow : [styles.itemTopRow, styles.continuationBlock]}
          wrap={false}
          minPresenceAhead={index === 0 ? 88 : 48}
        >
          <View style={styles.contentColumn}>
            <FragmentDescription fragment={fragment} />
          </View>
          <View style={styles.priceCol}>
            <Price item={item} continuation={index > 0} />
          </View>
        </View>
      ))}
    </View>
  );
}
