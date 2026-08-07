import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessao, type SessaoActual } from "@/lib/sessao.functions";

/** Sessão actual (perfil, papel e município). Null quando não autenticado. */
export function useSessao() {
  const [temSessao, setTemSessao] = useState<boolean | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (vivo) setTemSessao(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setTemSessao(!!session);
      qc.invalidateQueries({ queryKey: ["sessao"] });
    });
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  const q = useQuery<SessaoActual>({
    queryKey: ["sessao"],
    queryFn: () => getSessao(),
    enabled: temSessao === true,
    staleTime: 60_000,
    retry: false,
  });

  return {
    sessao: temSessao ? (q.data ?? null) : null,
    autenticado: temSessao === true,
    aCarregar: temSessao === null || (temSessao && q.isLoading),
    erro: q.error as Error | null,
  };
}
