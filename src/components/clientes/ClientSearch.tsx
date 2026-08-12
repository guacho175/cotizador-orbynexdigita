import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClientSearchProps {
  term: string;
  setTerm: (term: string) => void;
  onNew: () => void;
}

export function ClientSearch({ term, setTerm, onNew }: ClientSearchProps) {
  return (
    <div className="flex w-full max-w-md gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 h-10 rounded-lg border-border/50 shadow-sm transition-colors focus-visible:ring-primary/30"
          placeholder="Buscar cliente..."
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>
      <Button 
        onClick={onNew} 
        className="rounded-lg h-10 shadow-sm bg-primary hover:bg-primary/90"
      >
        <Plus className="size-4 mr-1.5" />
        Nuevo
      </Button>
    </div>
  );
}
