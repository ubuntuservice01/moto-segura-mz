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
      avistamentos: {
        Row: {
          contacto_informante: string | null
          created_at: string
          foto_path: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          ip: string | null
          moto_id: string
          municipio_id: string | null
          observacoes: string | null
          user_agent: string | null
        }
        Insert: {
          contacto_informante?: string | null
          created_at?: string
          foto_path?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          ip?: string | null
          moto_id: string
          municipio_id?: string | null
          observacoes?: string | null
          user_agent?: string | null
        }
        Update: {
          contacto_informante?: string | null
          created_at?: string
          foto_path?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          ip?: string | null
          moto_id?: string
          municipio_id?: string | null
          observacoes?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avistamentos_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avistamentos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      esquadras: {
        Row: {
          activa: boolean
          contacto: string | null
          created_at: string
          endereco: string | null
          id: string
          municipio_id: string
          nome: string
          responsavel: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          contacto?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          municipio_id: string
          nome: string
          responsavel?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          contacto?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          municipio_id?: string
          nome?: string
          responsavel?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esquadras_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_motos: {
        Row: {
          created_at: string
          descricao: string
          diff: Json | null
          id: string
          motivo: string | null
          moto_id: string
          municipio_id: string
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
          municipio_id: string
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
          municipio_id?: string
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
          {
            foreignKeyName: "historico_motos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          disponivel: boolean
          icone: string | null
          id: string
          nome: string
          ordem: number
          rota: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          disponivel?: boolean
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          rota?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          disponivel?: boolean
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          rota?: string | null
        }
        Relationships: []
      }
      motos: {
        Row: {
          ano: number | null
          chassi: string
          cilindrada: number | null
          codigo_recuperacao_hash: string | null
          codigo_recuperacao_prefixo: string | null
          cor: string | null
          created_at: string
          data_compra: string | null
          data_reporte_roubo: string | null
          documentos: Json
          estado: Database["public"]["Enums"]["moto_estado"]
          foto_path: string | null
          id: string
          km: number | null
          local_compra: string | null
          marca: string
          matricula: string | null
          modelo: string
          municipio_id: string
          notas_internas: string | null
          numero_motor: string | null
          preco_venda: number | null
          proprietario_bi: string | null
          proprietario_contacto: string | null
          proprietario_contacto_alt: string | null
          proprietario_data_nascimento: string | null
          proprietario_distrito: string | null
          proprietario_endereco: string | null
          proprietario_familiar_contacto: string | null
          proprietario_familiar_nome: string | null
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
          codigo_recuperacao_hash?: string | null
          codigo_recuperacao_prefixo?: string | null
          cor?: string | null
          created_at?: string
          data_compra?: string | null
          data_reporte_roubo?: string | null
          documentos?: Json
          estado?: Database["public"]["Enums"]["moto_estado"]
          foto_path?: string | null
          id?: string
          km?: number | null
          local_compra?: string | null
          marca: string
          matricula?: string | null
          modelo: string
          municipio_id: string
          notas_internas?: string | null
          numero_motor?: string | null
          preco_venda?: number | null
          proprietario_bi?: string | null
          proprietario_contacto?: string | null
          proprietario_contacto_alt?: string | null
          proprietario_data_nascimento?: string | null
          proprietario_distrito?: string | null
          proprietario_endereco?: string | null
          proprietario_familiar_contacto?: string | null
          proprietario_familiar_nome?: string | null
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
          codigo_recuperacao_hash?: string | null
          codigo_recuperacao_prefixo?: string | null
          cor?: string | null
          created_at?: string
          data_compra?: string | null
          data_reporte_roubo?: string | null
          documentos?: Json
          estado?: Database["public"]["Enums"]["moto_estado"]
          foto_path?: string | null
          id?: string
          km?: number | null
          local_compra?: string | null
          marca?: string
          matricula?: string | null
          modelo?: string
          municipio_id?: string
          notas_internas?: string | null
          numero_motor?: string | null
          preco_venda?: number | null
          proprietario_bi?: string | null
          proprietario_contacto?: string | null
          proprietario_contacto_alt?: string | null
          proprietario_data_nascimento?: string | null
          proprietario_distrito?: string | null
          proprietario_endereco?: string | null
          proprietario_familiar_contacto?: string | null
          proprietario_familiar_nome?: string | null
          proprietario_localidade?: string | null
          proprietario_nome?: string
          proprietario_posto_admin?: string | null
          proprietario_provincia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      municipio_modulos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          modulo_id: string
          municipio_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          modulo_id: string
          municipio_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          modulo_id?: string
          municipio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipio_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "municipio_modulos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          brasao_url: string | null
          contacto: string | null
          contacto_alt: string | null
          cor_principal: string
          cor_secundaria: string
          created_at: string
          distrito: string | null
          email: string | null
          endereco: string | null
          estado: Database["public"]["Enums"]["municipio_estado"]
          favicon_url: string | null
          id: string
          licenca_plano: string
          licenca_validade: string | null
          logo_url: string | null
          nome: string
          nome_plataforma: string | null
          notas: string | null
          provincia: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          brasao_url?: string | null
          contacto?: string | null
          contacto_alt?: string | null
          cor_principal?: string
          cor_secundaria?: string
          created_at?: string
          distrito?: string | null
          email?: string | null
          endereco?: string | null
          estado?: Database["public"]["Enums"]["municipio_estado"]
          favicon_url?: string | null
          id?: string
          licenca_plano?: string
          licenca_validade?: string | null
          logo_url?: string | null
          nome: string
          nome_plataforma?: string | null
          notas?: string | null
          provincia: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          brasao_url?: string | null
          contacto?: string | null
          contacto_alt?: string | null
          cor_principal?: string
          cor_secundaria?: string
          created_at?: string
          distrito?: string | null
          email?: string | null
          endereco?: string | null
          estado?: Database["public"]["Enums"]["municipio_estado"]
          favicon_url?: string | null
          id?: string
          licenca_plano?: string
          licenca_validade?: string | null
          logo_url?: string | null
          nome?: string
          nome_plataforma?: string | null
          notas?: string | null
          provincia?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          canal: string
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          moto_id: string | null
          municipio_id: string | null
          payload: Json
          tipo: string
          titulo: string
        }
        Insert: {
          canal?: string
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          moto_id?: string | null
          municipio_id?: string | null
          payload?: Json
          tipo: string
          titulo: string
        }
        Update: {
          canal?: string
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          moto_id?: string | null
          municipio_id?: string | null
          payload?: Json
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          activo: boolean
          created_at: string
          email: string | null
          esquadra_id: string | null
          id: string
          municipio_id: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email?: string | null
          esquadra_id?: string | null
          id: string
          municipio_id?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string | null
          esquadra_id?: string | null
          id?: string
          municipio_id?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_esquadra_id_fkey"
            columns: ["esquadra_id"]
            isOneToOne: false
            referencedRelation: "esquadras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
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
          municipio_id: string
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
          municipio_id: string
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
          municipio_id?: string
          notas?: string | null
          origem_busca?: string | null
          proprietario_contacto?: string | null
          proprietario_nome?: string
          proprietario_provincia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_registos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_roubo: {
        Row: {
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          identificador: string
          ip: string | null
          motivo_falha: string | null
          moto_id: string | null
          municipio_id: string | null
          sucesso: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          identificador: string
          ip?: string | null
          motivo_falha?: string | null
          moto_id?: string | null
          municipio_id?: string | null
          sucesso?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          identificador?: string
          ip?: string | null
          motivo_falha?: string | null
          moto_id?: string | null
          municipio_id?: string | null
          sucesso?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reportes_roubo_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_roubo_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          moto_id: string
          municipio_id: string
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
          municipio_id: string
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
          municipio_id?: string
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
          {
            foreignKeyName: "transferencias_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      utilizador_papeis: {
        Row: {
          created_at: string
          id: string
          municipio_id: string | null
          papel: Database["public"]["Enums"]["app_papel"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipio_id?: string | null
          papel: Database["public"]["Enums"]["app_papel"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          municipio_id?: string | null
          papel?: Database["public"]["Enums"]["app_papel"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilizador_papeis_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      e_super_admin: { Args: { _user_id: string }; Returns: boolean }
      meu_municipio: { Args: { _user_id: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      tem_papel: {
        Args: {
          _papel: Database["public"]["Enums"]["app_papel"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_papel:
        | "super_admin"
        | "admin_municipal"
        | "tecnico_municipal"
        | "policia"
      historico_tipo:
        | "registo"
        | "transferencia"
        | "actualizacao"
        | "mudanca_estado"
        | "reporte_roubo"
        | "avistamento"
      moto_estado:
        | "activa"
        | "a_venda"
        | "roubada"
        | "transferida"
        | "recuperada"
        | "vendida"
        | "abatida"
      municipio_estado: "activo" | "suspenso"
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
      app_papel: [
        "super_admin",
        "admin_municipal",
        "tecnico_municipal",
        "policia",
      ],
      historico_tipo: [
        "registo",
        "transferencia",
        "actualizacao",
        "mudanca_estado",
        "reporte_roubo",
        "avistamento",
      ],
      moto_estado: [
        "activa",
        "a_venda",
        "roubada",
        "transferida",
        "recuperada",
        "vendida",
        "abatida",
      ],
      municipio_estado: ["activo", "suspenso"],
      pre_registo_estado: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
