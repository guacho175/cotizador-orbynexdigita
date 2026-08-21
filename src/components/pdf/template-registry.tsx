import type { ComponentType } from "react";
import { requestedPdfTemplateKey, type QuoteDocumentProps } from "./core/model";
import { StandardV1Template } from "./templates/standard-v1";

export const DEFAULT_PDF_TEMPLATE_KEY = "standard-v1" as const;

const PDF_TEMPLATE_REGISTRY = {
  [DEFAULT_PDF_TEMPLATE_KEY]: StandardV1Template,
} satisfies Record<string, ComponentType<QuoteDocumentProps>>;

export type PdfTemplateKey = keyof typeof PDF_TEMPLATE_REGISTRY;

export interface ResolvedPdfTemplate {
  key: PdfTemplateKey;
  Template: ComponentType<QuoteDocumentProps>;
}

function isRegisteredTemplateKey(value: string): value is PdfTemplateKey {
  return Object.prototype.hasOwnProperty.call(PDF_TEMPLATE_REGISTRY, value);
}

/**
 * Closed, compiled registry. Unknown persisted values always fall back to the
 * standard template and are never interpreted as module names or JSX.
 */
export function resolvePdfTemplate(props: QuoteDocumentProps): ResolvedPdfTemplate {
  const requested = requestedPdfTemplateKey(props);
  const key =
    requested && isRegisteredTemplateKey(requested) ? requested : DEFAULT_PDF_TEMPLATE_KEY;

  return { key, Template: PDF_TEMPLATE_REGISTRY[key] };
}
