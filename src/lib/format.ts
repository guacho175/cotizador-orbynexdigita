export const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function money(value: number): string {
  return CLP.format(Math.round(value || 0));
}

export function plain(value: number): string {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  );
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Money math lives here only — never in AI code. */
export function lineTotal(cantidad: number, precio: number): number {
  return Math.round((Number(cantidad) || 0) * (Number(precio) || 0));
}

export function computeTotals(
  lines: { cantidad: number; precio_unitario: number }[],
  ivaPercent: number,
) {
  const subtotal = lines.reduce(
    (acc, line) => acc + lineTotal(line.cantidad, line.precio_unitario),
    0,
  );
  const iva = Math.round((subtotal * (Number(ivaPercent) || 0)) / 100);
  return { subtotal, iva, total: subtotal + iva };
}

export function quoteNumber(numero: number | null, folio_cliente?: number | null): string {
  const val = folio_cliente ?? numero;
  return val == null ? "—" : String(val).padStart(5, "0");
}
