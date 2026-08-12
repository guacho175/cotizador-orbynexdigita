import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Client } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const clientSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(160),
  rut: z.string().trim().max(20),
  contacto: z.string().trim().max(120),
  email: z.union([z.string().trim().email("Correo inválido").max(255), z.literal("")]),
  telefono: z.string().trim().max(40),
  direccion: z.string().trim().max(240),
  notas: z.string().trim().max(600),
});

type FormValues = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  draft: Client | null;
  isEditing: boolean;
  onClose: () => void;
  onSave: (data: FormValues) => Promise<void>;
}

export function ClientFormDialog({ draft, isEditing, onClose, onSave }: ClientFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: "",
      rut: "",
      contacto: "",
      email: "",
      telefono: "",
      direccion: "",
      notas: "",
    },
  });

  useEffect(() => {
    if (draft) {
      form.reset({
        nombre: draft.nombre || "",
        rut: draft.rut || "",
        contacto: draft.contacto || "",
        email: draft.email || "",
        telefono: draft.telefono || "",
        direccion: draft.direccion || "",
        notas: draft.notas || "",
      });
    } else {
      form.reset();
    }
  }, [draft, form]);

  const onSubmit = async (data: FormValues) => {
    await onSave(data);
    form.reset();
  };

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[600px] rounded-xl border-border/50 bg-card/95 backdrop-blur-md shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre o razón social</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg shadow-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg shadow-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de contacto</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg shadow-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input type="email" className="rounded-lg shadow-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg shadow-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg shadow-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        className="resize-none rounded-lg shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="rounded-lg"
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-lg">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
