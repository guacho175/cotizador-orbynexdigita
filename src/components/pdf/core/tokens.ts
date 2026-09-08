export const PDF_COLORS = {
  navy: "#0b2545",
  amber: "#d97706",
  amberLight: "#fffbeb",
  amberBorder: "#fde68a",
  line: "#e2e8f0",
  muted: "#64748b",
  ink: "#0f172a",
  paper: "#ffffff",
  slate700: "#334155",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
} as const;

export const PDF_LAYOUT = {
  pageHorizontal: 28,
  pageTop: 92,
  pageBottom: 42,
  headerTop: 18,
  footerBottom: 14,
} as const;

export function contrastColor(background: string): string {
  const hex = background.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return PDF_COLORS.paper;

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;
  const red = Number.parseInt(normalized.substring(0, 2), 16);
  const green = Number.parseInt(normalized.substring(2, 4), 16);
  const blue = Number.parseInt(normalized.substring(4, 6), 16);

  if (![red, green, blue].every(Number.isFinite)) return PDF_COLORS.paper;
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 150 ? PDF_COLORS.ink : PDF_COLORS.paper;
}
