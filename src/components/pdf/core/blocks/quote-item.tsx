import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { money } from "@/lib/format";
import type { QuoteItem } from "@/lib/types";
import { PDF_COLORS } from "../tokens";

export interface ParsedItemDescription {
  title?: string;
  subtitle?: string;
  paragraph?: string;
  includesHeader?: string;
  bullets: string[];
  plain?: string;
}

export function parseDescription(raw: string): ParsedItemDescription {
  const lines = (raw || "")
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
    return { plain: raw || "-", bullets: [] };
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

  // Typographic points weight formula
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

export interface QuoteItemBlockProps {
  item: QuoteItem;
  metrics?: LayoutMetrics;
  isLast?: boolean;
}

export function QuoteItemBlock({ item, metrics, isLast = false }: QuoteItemBlockProps) {
  const parsed = parseDescription(item.descripcion || "");

  const itemPaddingV = metrics?.itemPaddingV ?? 5.5;
  const itemMarginB = isLast ? 0 : (metrics?.itemMarginB ?? 0);
  const itemTitleSize = metrics?.itemTitleSize ?? 8.8;
  const itemSubtitleSize = metrics?.itemSubtitleSize ?? 7.3;
  const itemTextSize = metrics?.itemTextSize ?? 7.4;
  const itemLineHeight = metrics?.itemLineHeight ?? 1.25;
  const bulletMarginB = metrics?.bulletMarginB ?? 1.8;
  const bulletDotSize = metrics?.bulletDotSize ?? 3.5;

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: itemPaddingV,
        borderBottomWidth: 0.5,
        borderBottomColor: PDF_COLORS.line,
        marginBottom: itemMarginB,
      }}
      wrap={false}
      minPresenceAhead={35}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          {parsed.title ? (
            <Text
              style={{
                fontSize: itemTitleSize,
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
                fontSize: itemSubtitleSize,
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
                fontSize: itemTextSize,
                lineHeight: itemLineHeight,
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
                fontSize: itemTextSize,
                lineHeight: itemLineHeight,
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
                    fontSize: itemSubtitleSize,
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
                    marginBottom: bulletMarginB,
                  }}
                >
                  <View
                    style={{
                      width: bulletDotSize,
                      height: bulletDotSize,
                      borderRadius: bulletDotSize / 2,
                      backgroundColor: PDF_COLORS.amber,
                      marginRight: 5,
                      marginTop: 3,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: itemTextSize,
                      lineHeight: itemLineHeight,
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
            fontSize: itemTextSize,
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
            fontSize: itemTextSize + 0.5,
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
            fontSize: itemTextSize + 1,
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
