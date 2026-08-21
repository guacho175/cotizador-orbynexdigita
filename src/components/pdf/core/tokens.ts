export const PDF_COLORS = {
  navy: "#0b2545",
  amber: "#e0930f",
  line: "#dbe2ea",
  muted: "#5b6b7f",
  ink: "#14202e",
  paper: "#ffffff",
} as const;

export const PDF_LAYOUT = {
  pageHorizontal: 34,
  pageTop: 122,
  pageBottom: 64,
  headerTop: 28,
  footerBottom: 24,
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
