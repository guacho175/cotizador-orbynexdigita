import { pdf } from "@react-pdf/renderer";
import { QuoteDocument, type QuoteDocumentProps } from "@/components/pdf/quote-document";
import { quoteNumber } from "./format";

export async function buildQuotePdfBlob(props: QuoteDocumentProps): Promise<Blob> {
  return pdf(<QuoteDocument {...props} />).toBlob();
}

export function pdfFileName(props: QuoteDocumentProps): string {
  const cliente = (props.client?.nombre || "cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .slice(0, 40);
  return `cotizacion-${quoteNumber(props.quote.numero)}-${cliente}.pdf`;
}

export async function previewQuotePdfUrl(props: QuoteDocumentProps): Promise<string> {
  const blob = await buildQuotePdfBlob(props);
  return URL.createObjectURL(blob);
}

export async function buildQuotePdfFile(props: QuoteDocumentProps): Promise<File> {
  const blob = await buildQuotePdfBlob(props);
  return new File([blob], pdfFileName(props), { type: "application/pdf" });
}

export function downloadQuotePdfFile(file: File) {
  const blob = file.slice(0, file.size, file.type);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canSharePdfFiles(): boolean {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const isTouchFirstDevice = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (!isTouchFirstDevice || !navigator.share || !nav.canShare) return false;
  const probe = new File([""], "cotizacion.pdf", { type: "application/pdf" });
  return nav.canShare({ files: [probe] });
}

export async function sharePreparedQuotePdf(file: File): Promise<void> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (!nav.canShare?.({ files: [file] })) {
    throw new Error("Este dispositivo no permite compartir archivos PDF.");
  }
  await navigator.share({ files: [file], title: file.name });
}
