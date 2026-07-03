export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      historico_motos: {
        Row: {
          created_at: string
          descricao: string
          diff: Json | null
          id: string
          motivo: string | null
          moto_id: string
          operador: string
          tipo_evento: Database["public"]["Enums"]["historico_tipo"]
        }
        Insert: {
          created_at?: string
          descricao: string
          diff?: Json | null
          id?: string
          motivo?: string | null
          moto_id: string
          operador?: string
          tipo_evento: Database["public"]["Enums"]["historico_tipo"]
        }
        Update: {
          created_at?: string
          descricao?: string
          diff?: Json | null
          id?: string
          motivo?: string | null
          moto_id?: string
          operador?: string
          tipo_evento?: Database["public"]["Enums"]["historico_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "historico_motos_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
        ]
      }
      motos: {
        Row: {
          ano: number | null
          chassi: string
          cilindrada: number | null
          cor: string | null
          created_at: string
          documentos: Json
          estado: Database["public"]["Enums"]["moto_estado"]
          id: string
          km: number | null
          marca: string
          matricula: string | null
          modelo: string
          notas_internas: string | null
          preco_venda: number | null
          proprietario_bi: string | null
          proprietario_contacto: string | null
          proprietario_distrito: string | null
          proprietario_localidade: string | null
          proprietario_nome: string
          proprietario_posto_admin: string | null
          proprietario_provincia: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          chassi: string
          cilindrada?: number | null
          cor?: string | null
          created_at?: string
          documentos?: Json
          estado?: Database["public"]["Enums"]["moto_estado"]
          id?: string
          km?: number | null
          marca: string
          matricula?: string | null
          modelo: string
          notas_internas?: string | null
          preco_venda?: number | null
          proprietario_bi?: string | null
          proprietario_contacto?: string | null
          proprietario_distrito?: string | null
          proprietario_localidade?: string | null
          proprietario_nome: string
          proprietario_posto_admin?: string | null
          proprietario_provincia?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          chassi?: string
          cilindrada?: number | null
          cor?: string | null
          created_at?: string
          documentos?: Json
          estado?: Database["public"]["Enums"]["moto_estado"]
          id?: string
          km?: number | null
          marca?: string
          matricula?: string | null
          modelo?: string
          notas_internas?: string | null
          preco_venda?: number | null
          proprietario_bi?: string | null
          proprietario_contacto?: string | null
          proprietario_distrito?: string | null
          proprietario_localidade?: string | null
          proprietario_nome?: string
          proprietario_posto_admin?: string | null
          proprietario_provincia?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pre_registos: {
        Row: {
          ano: number | null
          chassi: string
          cor: string | null
          created_at: string
          estado: Database["public"]["Enums"]["pre_registo_estado"]
          id: string
          marca: string
          modelo: string
          notas: string | null
          origem_busca: string | null
          proprietario_contacto: string | null
          proprietario_nome: string
          proprietario_provincia: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          chassi: string
          cor?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["pre_registo_estado"]
          id?: string
          marca: string
          modelo: string
          notas?: string | null
          origem_busca?: string | null
          proprietario_contacto?: string | null
          proprietario_nome: string
          proprietario_provincia?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          chassi?: string
          cor?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["pre_registo_estado"]
          id?: string
          marca?: string
          modelo?: string
          notas?: string | null
          origem_busca?: string | null
          proprietario_contacto?: string | null
          proprietario_nome?: string
          proprietario_provincia?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transferencias: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          moto_id: string
          operador: string
          proprietario_anterior: Json
          proprietario_novo: Json
          valor_transaccao: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          moto_id: string
          operador?: string
          proprietario_anterior: Json
          proprietario_novo: Json
          valor_transaccao?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          moto_id?: string
          operador?: string
          proprietario_anterior?: Json
          proprietario_novo?: Json
          valor_transaccao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      historico_tipo:
        | "registo"
        | "transferencia"
        | "actualizacao"
        | "mudanca_estado"
      moto_estado: "activa" | "a_venda" | "roubada" | "transferida"
      pre_registo_estado: "pendente" | "aprovado" | "rejeitado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      historico_tipo: [
        "registo",
        "transferencia",
        "actualizacao",
        "mudanca_estado",
      ],
      moto_estado: ["activa", "a_venda", "roubada", "transferida"],
      pre_registo_estado: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
