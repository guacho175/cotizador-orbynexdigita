import { resolvePdfTemplate } from "./template-registry";
import type { QuoteDocumentProps } from "./core/model";

export type { QuoteDocumentProps } from "./core/model";

/**
 * Stable dispatcher used by preview, download and share. Template selection is
 * data-driven and validated by the closed registry; it never branches on IDs.
 */
export function QuoteDocument(props: QuoteDocumentProps) {
  const { Template } = resolvePdfTemplate(props);
  return <Template {...props} />;
}
