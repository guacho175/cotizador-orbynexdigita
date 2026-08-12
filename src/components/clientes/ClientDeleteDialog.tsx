import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Client } from "@/lib/types";

interface ClientDeleteDialogProps {
  client: Client | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClientDeleteDialog({ client, onClose, onConfirm }: ClientDeleteDialogProps) {
  return (
    <AlertDialog open={client !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-xl border-border/50 bg-card/95 backdrop-blur-md shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará permanentemente al cliente <strong className="text-foreground font-semibold">{client?.nombre}</strong>.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
