import { MoreHorizontal, Edit, Trash2, Mail, Phone, User, Hash } from "lucide-react";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientMobileCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export function ClientMobileCard({ client, onEdit, onDelete }: ClientMobileCardProps) {
  return (
    <div className="md:hidden flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-muted/30 relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {getInitials(client.nombre)}
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
              {client.nombre}
            </h3>
            {client.rut && (
              <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Hash className="size-3" />
                {client.rut}
              </span>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => onEdit(client)} className="rounded-lg">
              <Edit className="size-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(client)}
              className="text-destructive focus:text-destructive rounded-lg"
            >
              <Trash2 className="size-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground mt-1">
        {client.contacto && (
          <div className="flex items-center gap-2">
            <User className="size-3.5 shrink-0" />
            <span className="truncate" title={client.contacto}>{client.contacto}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate" title={client.email}>{client.email}</span>
          </div>
        )}
        {client.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0" />
            <span className="truncate">{client.telefono}</span>
          </div>
        )}
      </div>
    </div>
  );
}
