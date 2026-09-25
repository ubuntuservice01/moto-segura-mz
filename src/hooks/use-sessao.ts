import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SessaoActual = {
  user: { id: string; email?: string };
  perfil: { id: string; full_name: string; phone: string | null; role: string; is_active: boolean; municipality_id: string | null };
  papel: string;
  superAdmin: boolean;
  municipio: any | null;
};

export function useSessao() {
  const [temSessao, setTemSessao] = useState<boolean | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => { if (vivo) setTemSessao(!!data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "TOKEN_REFRESHED"].includes(event)) return;
      setTemSessao(!!session);
      qc.invalidateQueries({ queryKey: ["sessao"] });
    });
    return () => { vivo = false; sub.subscription.unsubscribe(); };
  }, [qc]);

  const q = useQuery<SessaoActual | null>({
    queryKey: ["sessao"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) return null;
      const { data: perfil, error: perfilError } = await (supabase as any).from("profiles")
        .select("id, full_name, phone, role, is_active, municipality_id").eq("id", auth.user.id).maybeSingle();
      if (perfilError) throw perfilError;
      if (!perfil || !perfil.is_active) return null;
      let municipio = null;
      if (perfil.municipality_id) {
        const { data, error } = await (supabase as any).from("municipalities")
          .select("id, name, code, province, district, address, phone, email, logo_url, is_active")
          .eq("id", perfil.municipality_id).maybeSingle();
        if (error) throw error;
        if (data) municipio = {
          ...data, nome: data.name, codigo: data.code, provincia: data.province, distrito: data.district,
          endereco: data.address, contacto: data.phone, nome_plataforma: null,
          cor_principal: "#0f766e", cor_secundaria: "#eab308",
        };
      }
      return { user: { id: auth.user.id, email: auth.user.email }, perfil, papel: perfil.role, superAdmin: perfil.role === "super_admin", municipio };
    },
    enabled: temSessao === true, staleTime: 60_000, retry: false,
  });

  return {
    sessao: temSessao ? (q.data ?? null) : null,
    autenticado: temSessao === true,
    aCarregar: temSessao === null || (temSessao && q.isLoading),
    erro: q.error as Error | null,
  };
}
