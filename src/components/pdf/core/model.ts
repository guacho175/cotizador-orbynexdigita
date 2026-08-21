import type { Business, Client, Quote, QuoteItem } from "@/lib/types";

export interface QuoteDocumentProps {
  quote: Quote;
  items: QuoteItem[];
  business: Business;
  client: Client | null;
  logoDataUrl?: string | null;
}

type TemplateAwareEntity = {
  pdf_template_key?: unknown;
  template_key?: unknown;
};

function readTemplateKey(entity: unknown): string | null {
  if (!entity || typeof entity !== "object") return null;

  const candidate = entity as TemplateAwareEntity;
  const value = candidate.pdf_template_key ?? candidate.template_key;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A quote-level key is the frozen choice for an issued quote. Drafts without a
 * key inherit from the client and then the business. Registry validation stays
 * separate so database values can never select an arbitrary component/module.
 */
export function requestedPdfTemplateKey({
  quote,
  client,
  business,
}: QuoteDocumentProps): string | null {
  return readTemplateKey(quote) ?? readTemplateKey(client) ?? readTemplateKey(business);
}
