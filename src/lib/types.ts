export type Estado = "borrador" | "enviada" | "aceptada" | "rechazada";

export interface Business {
  id: string;
  user_id: string;
  nombre: string;
  rut: string;
  giro: string;
  direccion: string;
  telefono: string;
  email: string;
  sitio_web: string;
  logo_path: string | null;
  banco_nombre: string;
  banco_tipo_cuenta: string;
  banco_numero_cuenta: string;
  banco_titular: string;
  banco_rut: string;
  banco_email: string;
  condiciones: string;
  pie_pagina: string;
  iva_percent: number;
  next_quote_number: number;
  color_factura: string | null;
  created_at?: string;
  updated_at?: string;
  /** Local-only: data URL of the logo so the PDF works offline. Never sent to the server. */
  logo_data?: string | null;
}

export interface Client {
  id: string;
  user_id: string;
  nombre: string;
  rut: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  notas: string;
  created_at?: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  user_id: string;
  client_id: string | null;
  numero: number | null;
  fecha: string;
  validez_dias: number;
  estado: Estado;
  atencion: string;
  subtotal: number;
  iva: number;
  total: number;
  iva_percent: number;
  snapshot_negocio: Record<string, unknown> | null;
  snapshot_cliente: Record<string, unknown> | null;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  user_id: string;
  orden: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export const ESTADOS: { value: Estado; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "enviada", label: "Enviada" },
  { value: "aceptada", label: "Aceptada" },
  { value: "rechazada", label: "Rechazada" },
];
