export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      businesses: {
        Row: {
          banco_email: string;
          banco_nombre: string;
          banco_numero_cuenta: string;
          banco_rut: string;
          banco_tipo_cuenta: string;
          banco_titular: string;
          color_factura: string | null;
          condiciones: string;
          created_at: string;
          direccion: string;
          email: string;
          giro: string;
          id: string;
          iva_percent: number;
          logo_path: string | null;
          next_quote_number: number;
          nombre: string;
          pdf_template_key: string;
          pie_pagina: string;
          rut: string;
          sitio_web: string;
          telefono: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          banco_email?: string;
          banco_nombre?: string;
          banco_numero_cuenta?: string;
          banco_rut?: string;
          banco_tipo_cuenta?: string;
          banco_titular?: string;
          color_factura?: string | null;
          condiciones?: string;
          created_at?: string;
          direccion?: string;
          email?: string;
          giro?: string;
          id?: string;
          iva_percent?: number;
          logo_path?: string | null;
          next_quote_number?: number;
          nombre?: string;
          pdf_template_key?: string;
          pie_pagina?: string;
          rut?: string;
          sitio_web?: string;
          telefono?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          banco_email?: string;
          banco_nombre?: string;
          banco_numero_cuenta?: string;
          banco_rut?: string;
          banco_tipo_cuenta?: string;
          banco_titular?: string;
          color_factura?: string | null;
          condiciones?: string;
          created_at?: string;
          direccion?: string;
          email?: string;
          giro?: string;
          id?: string;
          iva_percent?: number;
          logo_path?: string | null;
          next_quote_number?: number;
          nombre?: string;
          pdf_template_key?: string;
          pie_pagina?: string;
          rut?: string;
          sitio_web?: string;
          telefono?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          contacto: string;
          created_at: string;
          direccion: string;
          email: string;
          id: string;
          nombre: string;
          notas: string;
          pdf_template_key: string | null;
          rut: string;
          telefono: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          contacto?: string;
          created_at?: string;
          direccion?: string;
          email?: string;
          id?: string;
          nombre: string;
          notas?: string;
          pdf_template_key?: string | null;
          rut?: string;
          telefono?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          contacto?: string;
          created_at?: string;
          direccion?: string;
          email?: string;
          id?: string;
          nombre?: string;
          notas?: string;
          pdf_template_key?: string | null;
          rut?: string;
          telefono?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quote_items: {
        Row: {
          cantidad: number;
          created_at: string;
          descripcion: string;
          id: string;
          orden: number;
          precio_unitario: number;
          quote_id: string;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cantidad?: number;
          created_at?: string;
          descripcion?: string;
          id?: string;
          orden?: number;
          precio_unitario?: number;
          quote_id: string;
          total?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cantidad?: number;
          created_at?: string;
          descripcion?: string;
          id?: string;
          orden?: number;
          precio_unitario?: number;
          quote_id?: string;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          atencion: string;
          client_id: string | null;
          created_at: string;
          estado: string;
          fecha: string;
          id: string;
          is_archived: boolean;
          issued_at: string | null;
          iva: number;
          iva_percent: number;
          numero: number | null;
          observaciones: string;
          pdf_template_key: string | null;
          pdf_template_version: number | null;
          snapshot_cliente: Json | null;
          snapshot_negocio: Json | null;
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string;
          validez_dias: number;
        };
        Insert: {
          atencion?: string;
          client_id?: string | null;
          created_at?: string;
          estado?: string;
          fecha?: string;
          id?: string;
          is_archived?: boolean;
          issued_at?: string | null;
          iva?: number;
          iva_percent?: number;
          numero?: number | null;
          observaciones?: string;
          pdf_template_key?: string | null;
          pdf_template_version?: number | null;
          snapshot_cliente?: Json | null;
          snapshot_negocio?: Json | null;
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id: string;
          validez_dias?: number;
        };
        Update: {
          atencion?: string;
          client_id?: string | null;
          created_at?: string;
          estado?: string;
          fecha?: string;
          id?: string;
          is_archived?: boolean;
          issued_at?: string | null;
          iva?: number;
          iva_percent?: number;
          numero?: number | null;
          observaciones?: string;
          pdf_template_key?: string | null;
          pdf_template_version?: number | null;
          snapshot_cliente?: Json | null;
          snapshot_negocio?: Json | null;
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string;
          validez_dias?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      assign_quote_number: { Args: { _quote_id: string }; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
