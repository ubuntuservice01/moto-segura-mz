import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Puzzle, Building2, Check, X, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listMunicipios } from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/ubuntu/modulos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Módulos — Ubuntu Service" }] }),
  component: ModulosPage,
});

type Modulo = {
  id: string;
  chave: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  rota: string | null;
  disponivel: boolean;
  ordem: number;
};

type MunicipioModulo = {
  id: string;
  municipio_id: string;
  modulo_id: string;
  activo: boolean;
};

function ModulosPage() {
  const qc = useQueryClient();
  const [municipioSel, setMunicipioSel] = useState<string>("");

  const { data: municipios } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => listMunicipios(),
  });

  const { data: modulos, isLoading: aCarregarModulos } = useQuery({
    queryKey: ["modulos-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modulos").select("*").order("ordem");
      if (error) throw new Error(error.message);
      return (data ?? []) as Modulo[];
    },
  });

  const { data: vinculos, isLoading: aCarregarVinculos } = useQuery({
    queryKey: ["municipio-modulos", municipioSel],
    queryFn: async () => {
      if (!municipioSel) return [];
      const { data, error } = await supabase
        .from("municipio_modulos")
        .select("*")
        .eq("municipio_id", municipioSel);
      if (error) throw new Error(error.message);
      return (data ?? []) as MunicipioModulo[];
    },
    enabled: !!municipioSel,
  });

  const toggleModulo = useMutation({
    mutationFn: async ({ moduloId, activo }: { moduloId: string; activo: boolean }) => {
      if (!municipioSel) throw new Error("Seleccione um município.");
      const vinculoExistente = (vinculos ?? []).find((v) => v.modulo_id === moduloId);

      if (vinculoExistente) {
        const { error } = await supabase
          .from("municipio_modulos")
          .update({ activo })
          .eq("id", vinculoExistente.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("municipio_modulos").insert({
          municipio_id: municipioSel,
          modulo_id: moduloId,
          activo,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["municipio-modulos", municipioSel] });
      toast.success("Módulo actualizado.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const estaActivo = (moduloId: string) => {
    const v = (vinculos ?? []).find((x) => x.modulo_id === moduloId);
    return v ? v.activo : false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Módulos da Plataforma</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerir módulos disponíveis para cada município (Arquitectura Escalável MotoGest).
        </p>
      </div>

      {/* Selector de Município */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Building2 className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Seleccionar Município para Activação de Módulos
          </label>
          <select
            value={municipioSel}
            onChange={(e) => setMunicipioSel(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Escolha um município...</option>
            {(municipios ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!municipioSel ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <Info className="mx-auto h-8 w-8 opacity-40 mb-2" />
          <p className="text-sm">Seleccione um município acima para activar ou desactivar os seus módulos.</p>
        </div>
      ) : aCarregarModulos || aCarregarVinculos ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(modulos ?? []).map((m) => {
            const activo = estaActivo(m.id);
            return (
              <div
                key={m.id}
                className={`rounded-xl border bg-card p-5 transition-all shadow-sm ${
                  activo ? "border-primary/40 ring-1 ring-primary/20" : "opacity-85"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${
                        activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Puzzle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{m.nome}</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{m.chave}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleModulo.mutate({ moduloId: m.id, activo: !activo })}
                    disabled={toggleModulo.isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      activo ? "bg-success" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        activo ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                  {m.descricao || "Sem descrição disponível."}
                </p>

                <div className="mt-4 flex items-center justify-between pt-3 border-t text-[11px]">
                  <span className="text-muted-foreground">Estado:</span>
                  <span
                    className={`font-semibold ${
                      activo ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
