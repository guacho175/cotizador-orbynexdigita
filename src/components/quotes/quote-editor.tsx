import { useMemo, useState, useEffect, useEffectEvent, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { GripVertical, Plus, Save, Trash2, FileDown, Share2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { db } from "@/lib/db";
import { computeTotals, lineTotal, money } from "@/lib/format";
import { emptyItem, issueQuote, saveQuote } from "@/lib/repo";
import type { Business, Client, Quote, QuoteItem } from "@/lib/types";
import {
  businessTaxLabel,
  isIssuedQuote,
  normalizeQuoteStatus,
  quoteStatusLabel,
  validateQuoteForIssuance,
} from "@/lib/quote-lifecycle";
import { AiAssist } from "./ai-assist";
import { PdfPreviewDialog } from "./pdf-preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const clients =
    useLiveQuery(() => db.clients.where("user_id").equals(userId).sortBy("nombre"), [userId], []) ??
    [];

  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(
    initialItems.length ? initialItems : [emptyItem(initialQuote.id, userId, 0)],
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "share" | "preview" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [issueMode, setIssueMode] = useState<"pdf" | "share" | null>(null);
  const [preparedShareFile, setPreparedShareFile] = useState<File | null>(null);
  const [canShare, setCanShare] = useState(false);

  const totals = useMemo(() => computeTotals(items, quote.iva_percent), [items, quote.iva_percent]);
  const issued = isIssuedQuote(quote);
  const taxLabel = businessTaxLabel(business);

  const isFirstRender = useRef(true);
  const lastPersisted = useRef<{ quote: Quote; items: QuoteItem[] } | null>(null);
  const runAutoSave = useEffectEvent(() => persist(true));

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (
      lastPersisted.current &&
      lastPersisted.current.quote === quote &&
      lastPersisted.current.items === items
    ) {
      return;
    }
    const timer = setTimeout(() => {
      void runAutoSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [quote, items, runAutoSave]);

  const client = clients.find((candidate) => candidate.id === quote.client_id) ?? null;

  useEffect(() => {
    let active = true;
    void import("@/lib/pdf").then(({ canSharePdfFiles }) => {
      if (active) setCanShare(canSharePdfFiles());
    });
    return () => {
      active = false;
    };
  }, []);

  function patchItem(id: string, patch: Partial<QuoteItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function persist(isAutoSave = false, draft: Quote = quote): Promise<Quote | null> {
    if (!isAutoSave) setSaving(true);
    try {
      const snapshotBusiness = { ...business, logo_data: undefined } as unknown as Record<
        string,
        unknown
      >;
      const saved = await saveQuote(
        {
          ...draft,
          snapshot_negocio: snapshotBusiness,
          snapshot_cliente: client ? ({ ...client } as unknown as Record<string, unknown>) : null,
        },
        items,
      );
      lastPersisted.current = { quote: saved, items };
      setQuote(saved);
      if (isAutoSave) {
        toast.success("Autoguardado", { id: "autosave-quote", duration: 1500 });
      } else {
        toast.success("Cotización guardada");
      }
      return saved;
    } catch (error) {
      if (!isAutoSave) toast.error(error instanceof Error ? error.message : "No se pudo guardar");
      return null;
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  }

  function buildPdfProps(saved: Quote) {
    const usesFrozenIdentity = saved.issued_at != null;
    const frozenBusiness =
      usesFrozenIdentity && saved.snapshot_negocio ? saved.snapshot_negocio : null;
    const frozenClient =
      usesFrozenIdentity && saved.snapshot_cliente
        ? (saved.snapshot_cliente as unknown as Client)
        : null;
    const documentBusiness = frozenBusiness
      ? ({
          ...business,
          ...frozenBusiness,
          logo_data:
            frozenBusiness.logo_path === business.logo_path ? (business.logo_data ?? null) : null,
        } as Business)
      : business;

    return {
      quote: { ...saved, ...computeTotals(items, saved.iva_percent) },
      items,
      business: documentBusiness,
      client: frozenClient ?? client,
      logoDataUrl: documentBusiness.logo_data ?? null,
    };
  }

  async function exportPdf(mode: "pdf" | "share", withTax: boolean) {
    setExporting(mode);
    try {
      const draft = {
        ...quote,
        iva_percent: withTax ? Number(business.iva_percent) || 0 : 0,
      };
      const saved = await persist(false, draft);
      if (!saved) return;
      const issued = await issueQuote(saved.id);
      lastPersisted.current = { quote: issued, items };
      setQuote(issued);

      const { buildQuotePdfFile, downloadQuotePdfFile } = await import("@/lib/pdf");
      const props = buildPdfProps(issued);
      const file = await buildQuotePdfFile(props);
      if (mode === "share") {
        setPreparedShareFile(file);
        toast.success("PDF listo para compartir.");
      } else {
        downloadQuotePdfFile(file);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el PDF");
    } finally {
      setExporting(null);
    }
  }

  function requestPdf(mode: "pdf" | "share") {
    if (issued) {
      void exportPdf(mode, quote.iva_percent > 0);
      return;
    }

    const issues = validateQuoteForIssuance({ quote, items, client, business });
    if (issues.length) {
      toast.error(issues[0].message);
      return;
    }
    setIssueMode(mode);
  }

  async function sharePreparedFile() {
    if (!preparedShareFile) return;
    try {
      const { sharePreparedQuotePdf } = await import("@/lib/pdf");
      await sharePreparedQuotePdf(preparedShareFile);
    } catch (error) {
      const shareError = error as { name?: string };
      if (shareError.name !== "AbortError") {
        toast.error(error instanceof Error ? error.message : "No se pudo compartir el PDF.");
      }
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
            <Label>Estado</Label>
            <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium">
              {quoteStatusLabel(normalizeQuoteStatus(quote))}
            </div>
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
          <p className="self-end text-xs text-muted-foreground">
            {issued
              ? `${taxLabel} aplicado: ${quote.iva_percent}%`
              : `Al emitir podrás aplicar ${taxLabel} (${business.iva_percent}%) o cotizar sin recargo.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Detalle</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setItems((current) => [...current, emptyItem(quote.id, userId, current.length)])
            }
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
            <span className="text-muted-foreground">
              {taxLabel} ({quote.iva_percent}%)
            </span>
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
          {exporting === "preview" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Eye className="size-4" />
          )}
          Vista previa
        </Button>
        <Button variant="outline" onClick={() => requestPdf("pdf")} disabled={exporting !== null}>
          {exporting === "pdf" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          Descargar PDF
        </Button>
        {canShare ? (
          <Button
            variant="outline"
            onClick={() => requestPdf("share")}
            disabled={exporting !== null}
          >
            {exporting === "share" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            Compartir
          </Button>
        ) : null}
        {preparedShareFile ? (
          <Button onClick={() => void sharePreparedFile()}>
            <Share2 className="size-4" />
            Compartir PDF listo
          </Button>
        ) : null}
      </div>

      <PdfPreviewDialog
        open={showPreview}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        pdfUrl={previewUrl}
        loading={!previewUrl && showPreview}
        onDownload={() => requestPdf("pdf")}
        downloading={exporting === "pdf"}
      />
      <AlertDialog open={issueMode !== null} onOpenChange={(open) => !open && setIssueMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cómo deseas emitir esta cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Elige si el PDF definitivo aplica {taxLabel} ({business.iva_percent}%) o se emite sin
              recargo. Esta acción asigna el folio y marca la cotización como realizada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const mode = issueMode;
                setIssueMode(null);
                if (mode) void exportPdf(mode, false);
              }}
            >
              Sin {taxLabel}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                const mode = issueMode;
                setIssueMode(null);
                if (mode) void exportPdf(mode, true);
              }}
            >
              Con {taxLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
