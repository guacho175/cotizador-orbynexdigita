import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export function ClientsTable({ clients, isLoading, onEdit, onDelete }: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="hidden md:block rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="w-[30%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre o razón social</TableHead>
              <TableHead className="w-[15%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">RUT</TableHead>
              <TableHead className="w-[20%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Persona de contacto</TableHead>
              <TableHead className="w-[25%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Correo y teléfono</TableHead>
              <TableHead className="w-[10%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-b border-border/40 hover:bg-transparent">
                <TableCell className="px-4 py-3.5 overflow-hidden"><Skeleton className="h-5 w-3/4 rounded-md" /></TableCell>
                <TableCell className="px-4 py-3.5 overflow-hidden"><Skeleton className="h-5 w-1/2 rounded-md" /></TableCell>
                <TableCell className="px-4 py-3.5 overflow-hidden"><Skeleton className="h-5 w-2/3 rounded-md" /></TableCell>
                <TableCell className="px-4 py-3.5 overflow-hidden"><Skeleton className="h-5 w-4/5 rounded-md" /></TableCell>
                <TableCell className="px-4 py-3.5 overflow-hidden"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="hidden md:block rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-b border-border/40 hover:bg-transparent">
            <TableHead className="w-[30%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre o razón social</TableHead>
            <TableHead className="w-[15%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">RUT</TableHead>
            <TableHead className="w-[20%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Persona de contacto</TableHead>
            <TableHead className="w-[25%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Correo y teléfono</TableHead>
            <TableHead className="w-[10%] h-11 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow 
              key={client.id} 
              className="group border-b border-border/40 hover:bg-muted/30 transition-colors"
            >
              <TableCell className="px-4 py-3.5 overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(client.nombre)}
                  </div>
                  <div 
                    className="font-semibold text-sm text-foreground truncate cursor-pointer hover:underline"
                    onClick={() => onEdit(client)}
                    title={client.nombre}
                  >
                    {client.nombre}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground overflow-hidden">
                <div className="truncate" title={client.rut}>{client.rut || "—"}</div>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground overflow-hidden">
                <div className="truncate" title={client.contacto}>{client.contacto || "—"}</div>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground overflow-hidden">
                <div className="flex flex-col gap-0.5 truncate">
                  {client.email && <span className="truncate" title={client.email}>{client.email}</span>}
                  {client.telefono && <span className="truncate" title={client.telefono}>{client.telefono}</span>}
                  {!client.email && !client.telefono && "—"}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-right overflow-hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-muted-foreground opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
