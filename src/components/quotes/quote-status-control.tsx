import type { Estado, Quote } from "@/lib/types";
import {
  ISSUED_QUOTE_STATUS_OPTIONS,
  isIssuedQuote,
  normalizeQuoteStatus,
  quoteStatusLabel,
} from "@/lib/quote-lifecycle";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuoteStatusControlProps {
  quote: Quote;
  onChange: (status: Estado) => void;
  compact?: boolean;
}

export function QuoteStatusControl({ quote, onChange, compact = false }: QuoteStatusControlProps) {
  const status = normalizeQuoteStatus(quote);

  if (!isIssuedQuote(quote)) {
    return <Badge variant="secondary">{quoteStatusLabel(status)}</Badge>;
  }

  return (
    <Select value={status} onValueChange={(value) => onChange(value as Estado)}>
      <SelectTrigger
        className={compact ? "h-8 w-44 text-xs" : "w-full"}
        aria-label="Estado comercial"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ISSUED_QUOTE_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
