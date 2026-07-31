import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { GripVertical, Plus, Save, Trash2, FileDown, Share2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { db } from "@/lib/db";
import { computeTotals, lineTotal, money } from "@/lib/format";
import { emptyItem, saveQuote, uuid } from "@/lib/repo";
import type { Business, Client, Estado, Quote, QuoteItem } from "@/lib/types";
import { ESTADOS } from "@/lib/types";
import { AiAssist } from "./ai-assist";
import { PdfPreviewDialog } from "./pdf-preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  userId: string;
  business: Business;
  initialQuote: Quote;
  initialItems: QuoteItem[];
}

export function QuoteEditor({ userId, business, initialQuote, initialItems }: Props) {
  const navigate = useNavigate();
  const clients = useLiveQuery(() => db.clients.orderBy("nombre").toArray(), [], []) ?? [];

  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(
    initialItems.length ? initialItems : [emptyItem(initialQuote.id, userId, 0)],
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "share" | "preview" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const totals = useMemo(
    () => computeTotals(items, quote.iva_percent),
    [items, quote.iva_percent],
  );

  const client = clients.find((candidate) => candidate.id === quote.client_id) ?? null;

  function patchItem(id: string, patch: Partial<QuoteItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function persist(): Promise<Quote | null> {
    if (!items.some((item) => item.descripcion.trim())) {
      toast.error("Agrega al menos una línea con descripción.");
      return null;
    }
    setSaving(true);
    try {
      const snapshotBusiness = { ...business, logo_data: undefined } as unknown as Record<string, unknown>;
      const saved = await saveQuote(
        {
          ...quote,
          snapshot_negocio: snapshotBusiness,
          snapshot_cliente: client ? ({ ...client } as unknown as Record<string, unknown>) : null,
        },
        items,
      );
      setQuote(saved);
      toast.success("Cotización guardada");
      return saved;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function buildPdfProps(saved: Quote) {
    return {
      quote: { ...saved, ...totals },
      items,
      business,
      client,
      logoDataUrl: business.logo_data ?? null,
    };
  }

  async function exportPdf(mode: "pdf" | "share") {
    const saved = (await persist()) ?? quote;
    setExporting(mode);
    try {
      const { downloadQuotePdf, shareQuotePdf } = await import("@/lib/pdf");
      const props = buildPdfProps(saved);
      if (mode === "share") await shareQuotePdf(props);
      else await downloadQuotePdf(props);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el PDF");
    } finally {
      setExporting(null);
    }
  }

  async function openPreview() {
    const saved = (await persist()) ?? quote;
    setExporting("preview");
    setShowPreview(true);
    try {
      const { previewQuotePdfUrl } = await import("@/lib/pdf");
      const url = await previewQuotePdfUrl(buildPdfProps(saved));
      setPreviewUrl(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar la vista previa");
      setShowPreview(false);
    } finally {
      setExporting(null);
    }
  }

  function closePreview() {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos de la cotización</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select
              value={quote.client_id ?? "none"}
              onValueChange={(value) =>
                setQuote((current) => ({ ...current, client_id: value === "none" ? null : value }))
              }
            >
              <SelectTrigger id="cliente">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cliente</SelectItem>
                {clients.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="atencion">Atención a</Label>
            <Input
              id="atencion"
              maxLength={120}
              value={quote.atencion}
              onChange={(event) => setQuote((c) => ({ ...c, atencion: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={quote.estado}
              onValueChange={(value) => setQuote((c) => ({ ...c, estado: value as Estado }))}
            >
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={quote.fecha}
              onChange={(event) => setQuote((c) => ({ ...c, fecha: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validez">Validez (días)</Label>
            <Input
              id="validez"
              type="number"
              min={0}
              max={365}
              value={quote.validez_dias}
              onChange={(event) =>
                setQuote((c) => ({ ...c, validez_dias: Number(event.target.value) || 0 }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iva">IVA (%)</Label>
            <Input
              id="iva"
              type="number"
              min={0}
              max={100}
              value={quote.iva_percent}
              onChange={(event) =>
                setQuote((c) => ({ ...c, iva_percent: Number(event.target.value) || 0 }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Detalle</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setItems((current) => [...current, emptyItem(quote.id, userId, current.length)])}
          >
            <Plus className="size-4" />
            Agregar línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <GripVertical className="size-3.5" />
                Línea {index + 1}
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1 text-destructive hover:underline"
                  onClick={() =>
                    setItems((current) =>
                      current.length === 1
                        ? [emptyItem(quote.id, userId, 0)]
                        : current.filter((row) => row.id !== item.id),
                    )
                  }
                >
                  <Trash2 className="size-3.5" />
                  Quitar
                </button>
              </div>
              <Textarea
                rows={Math.max(3, (item.descripcion.match(/\n/g)?.length ?? 0) + 2)}
                maxLength={1200}
                className="min-h-[4.5rem] resize-y"
                placeholder="Descripción del producto o servicio"
                value={item.descripcion}
                onChange={(event) => patchItem(item.id, { descripcion: event.target.value })}
              />
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <AiAssist
                  text={item.descripcion}
                  onResult={(next) => patchItem(item.id, { descripcion: next })}
                />
                <div className="flex items-end gap-2">
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Cant.</Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={item.cantidad === 0 ? "" : item.cantidad}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === "") {
                          patchItem(item.id, { cantidad: 0 });
                        } else {
                          const num = Number(val);
                          if (!isNaN(num) && num >= 0) {
                            patchItem(item.id, { cantidad: num });
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">P. unitario</Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={item.precio_unitario === 0 ? "" : item.precio_unitario}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === "") {
                          patchItem(item.id, { precio_unitario: 0 });
                        } else {
                          const num = Number(val);
                          if (!isNaN(num) && num >= 0) {
                            patchItem(item.id, { precio_unitario: num });
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Total</Label>
                    <div className="flex h-9 items-center justify-end rounded-md border border-input bg-muted px-3 text-sm font-medium tabular-nums">
                      {money(lineTotal(item.cantidad, item.precio_unitario))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observaciones adicionales para esta cotización (opcional). Si lo dejas en blanco se usará la condición por defecto de la empresa."
            value={quote.observaciones || ""}
            onChange={(event) => setQuote((c) => ({ ...c, observaciones: event.target.value }))}
            className="min-h-[4rem] resize-y"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-end gap-1 pt-6 text-sm tabular-nums">
          <div className="flex w-full max-w-xs justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{money(totals.subtotal)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between">
            <span className="text-muted-foreground">IVA ({quote.iva_percent}%)</span>
            <span>{money(totals.iva)}</span>
          </div>
          <div className="mt-2 flex w-full max-w-xs justify-between rounded-lg bg-primary px-3 py-2 text-primary-foreground">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-semibold">{money(totals.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-16 z-20 flex flex-wrap gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur md:bottom-4">
        <Button
          onClick={async () => {
            const saved = await persist();
            if (saved) navigate({ to: "/cotizaciones/$id", params: { id: saved.id } });
          }}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar
        </Button>
        <Button variant="outline" onClick={() => void openPreview()} disabled={exporting !== null}>
          {exporting === "preview" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Vista previa
        </Button>
        <Button variant="outline" onClick={() => void exportPdf("pdf")} disabled={exporting !== null}>
          {exporting === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          Descargar PDF
        </Button>
        <Button variant="outline" onClick={() => void exportPdf("share")} disabled={exporting !== null}>
          {exporting === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          Compartir
        </Button>
      </div>

      <PdfPreviewDialog
        open={showPreview}
        onOpenChange={(open) => { if (!open) closePreview(); }}
        pdfUrl={previewUrl}
        loading={!previewUrl && showPreview}
        onDownload={() => void exportPdf("pdf")}
        onShare={() => void exportPdf("share")}
        downloading={exporting === "pdf"}
        sharing={exporting === "share"}
      />
    </div>
  );
}

export function newQuoteId(): string {
  return uuid();
}

export type { Client };
