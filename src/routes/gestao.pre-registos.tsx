import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Check, X, Trash2, Zap } from "lucide-react";
import {
  listPreRegistos,
  updatePreRegistoEstado,
  aprovarPreRegistoEConverter,
  deletePreRegisto,
  type PreRegistoEstado,
} from "@/lib/pre-registos.functions";

export const Route = createFileRoute("/gestao/pre-registos")({
  component: PreRegistosPage,
});

const FILTROS: { key: "todos" | PreRegistoEstado; label: string }[] = [
  { key: "pendente", label: "Pendentes" },
  { key: "aprovado", label: "Aprovados" },
  { key: "rejeitado", label: "Rejeitados" },
  { key: "todos", label: "Todos" },
];

function PreRegistosPage() {
  const [estado, setEstado] = useState<"todos" | PreRegistoEstado>("pendente");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["pre-registos", estado],
    queryFn: () => listPreRegistos({ data: { estado } }),
  });

  const setEst = useMutation({
    mutationFn: (v: { id: string; estado: PreRegistoEstado }) =>
      updatePreRegistoEstado({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pre-registos"] });
      qc.invalidateQueries({ queryKey: ["pre-registos-pendentes"] });
      toast.success("Estado actualizado");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const converter = useMutation({
    mutationFn: (id: string) => aprovarPreRegistoEConverter({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["pre-registos"] });
      qc.invalidateQueries({ queryKey: ["pre-registos-pendentes"] });
      qc.invalidateQueries({ queryKey: ["motos"] });
      toast.success("Mota criada a partir do pré-registo");
      navigate({ to: "/gestao/$id", params: { id: r.motoId } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePreRegisto({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pre-registos"] });
      qc.invalidateQueries({ queryKey: ["pre-registos-pendentes"] });
      toast.success("Removido");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Pré-registos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submissões públicas de motas não encontradas. Analise, aprove ou rejeite.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border bg-card p-1">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setEstado(f.key)}
              className={
                "rounded px-3 py-1.5 text-xs font-semibold transition " +
                (estado === f.key ? "bg-primary text-primary-foreground" : "hover:bg-muted")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhum pré-registo {estado !== "todos" ? `com estado "${estado}"` : ""}.
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((p) => (
              <li key={p.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{p.chassi}</span>
                      <EstadoBadge estado={p.estado} />
                      {p.origem_busca && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          buscou: {p.origem_busca}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm">
                      <strong>{p.marca} {p.modelo}</strong>
                      {p.ano && <span className="text-muted-foreground"> · {p.ano}</span>}
                      {p.cor && <span className="text-muted-foreground"> · {p.cor}</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Proprietário: <strong className="text-foreground">{p.proprietario_nome}</strong>
                      {p.proprietario_contacto && <> · {p.proprietario_contacto}</>}
                      {p.proprietario_provincia && <> · {p.proprietario_provincia}</>}
                    </div>
                    {p.notas && (
                      <p className="mt-2 rounded bg-muted/50 p-2 text-xs">{p.notas}</p>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Submetido em {new Date(p.created_at).toLocaleString("pt-PT")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {p.estado !== "aprovado" && (
                      <button
                        onClick={() => converter.mutate(p.id)}
                        disabled={converter.isPending}
                        className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {converter.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        Aprovar e criar mota
                      </button>
                    )}
                    {p.estado !== "aprovado" && (
                      <button
                        onClick={() => setEst.mutate({ id: p.id, estado: "aprovado" })}
                        disabled={setEst.isPending}
                        className="inline-flex items-center gap-1 rounded border border-secondary/40 bg-secondary/10 px-2.5 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/20"
                      >
                        <Check className="h-3.5 w-3.5" /> Aprovar
                      </button>
                    )}
                    {p.estado !== "rejeitado" && (
                      <button
                        onClick={() => setEst.mutate({ id: p.id, estado: "rejeitado" })}
                        disabled={setEst.isPending}
                        className="inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" /> Rejeitar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("Remover este pré-registo?")) del.mutate(p.id);
                      }}
                      disabled={del.isPending}
                      className="inline-flex items-center gap-1 rounded border border-destructive/40 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: PreRegistoEstado }) {
  const map: Record<PreRegistoEstado, string> = {
    pendente: "bg-warning/20 text-warning-foreground",
    aprovado: "bg-secondary/20 text-secondary",
    rejeitado: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[estado]}`}>
      {estado}
    </span>
  );
}
