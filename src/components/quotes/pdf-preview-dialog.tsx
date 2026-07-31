import { FileDown, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  loading: boolean;
  onDownload: () => void;
  onShare: () => void;
  downloading: boolean;
  sharing: boolean;
}

export function PdfPreviewDialog({
  open,
  onOpenChange,
  pdfUrl,
  loading,
  onDownload,
  onShare,
  downloading,
  sharing,
}: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0 sm:h-[85vh]">
        <DialogHeader className="flex-shrink-0 border-b px-4 py-3 sm:px-6">
          <DialogTitle className="text-base">Vista previa de cotización</DialogTitle>
          <DialogDescription className="sr-only">
            Previsualización del PDF generado
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden bg-muted">
          {loading || !pdfUrl ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <span className="text-sm">Generando vista previa…</span>
              </div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              title="Vista previa del PDF"
              className="h-full w-full border-0"
              style={{ minHeight: 0 }}
            />
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={loading || downloading}
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Descargar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            disabled={loading || sharing}
          >
            {sharing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            Compartir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
