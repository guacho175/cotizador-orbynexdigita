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

export async function downloadQuotePdf(props: QuoteDocumentProps) {
  const blob = await buildQuotePdfBlob(props);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pdfFileName(props);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareQuotePdf(props: QuoteDocumentProps): Promise<boolean> {
  const blob = await buildQuotePdfBlob(props);
  const file = new File([blob], pdfFileName(props), { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: pdfFileName(props) });
    return true;
  }
  await downloadQuotePdf(props);
  return false;
}
