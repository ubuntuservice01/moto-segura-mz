import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ArrowRightLeft, Pencil, Activity } from "lucide-react";
import { listHistorico } from "@/lib/motos.functions";
import type { TipoEvento } from "@/lib/moto-types";

export const Route = createFileRoute("/gestao/historico")({
  component: HistoricoGlobal,
});

const ICONS: Record<TipoEvento, React.ReactNode> = {
  registo: <Plus className="h-3.5 w-3.5" />,
  transferencia: <ArrowRightLeft className="h-3.5 w-3.5" />,
  actualizacao: <Pencil className="h-3.5 w-3.5" />,
  mudanca_estado: <Activity className="h-3.5 w-3.5" />,
};
const LABELS: Record<TipoEvento, string> = {
  registo: "Registo",
  transferencia: "Transferência",
  actualizacao: "Actualização",
  mudanca_estado: "Mudança de estado",
};
const COLORS: Record<TipoEvento, string> = {
  registo: "bg-secondary/10 text-secondary border-secondary/30",
  transferencia: "bg-accent/15 text-accent-foreground border-accent/40",
  actualizacao: "bg-muted text-muted-foreground border-border",
  mudanca_estado: "bg-primary/10 text-primary border-primary/30",
};

function HistoricoGlobal() {
  const [tipo, setTipo] = useState("todos");
  const { data: eventos = [] } = useQuery({
    queryKey: ["historico-global", tipo],
    queryFn: () => listHistorico({ data: { tipo } }),
  });

  return (
    <div>
      <h2 className="text-xl font-bold">Histórico global</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Registo auditável de todas as operações executadas no sistema Ubuntu Link.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterBtn label="Todos" active={tipo === "todos"} onClick={() => setTipo("todos")} />
        {(Object.keys(LABELS) as TipoEvento[]).map((t) => (
          <FilterBtn key={t} label={LABELS[t]} active={tipo === t} onClick={() => setTipo(t)} />
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Mota</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Operador</th>
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Nenhum evento.
                </td>
              </tr>
            )}
            {eventos.map((e) => (
              <tr key={e.id} className="border-b last:border-0 align-top hover:bg-muted/30">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${COLORS[e.tipo_evento]}`}>
                    {ICONS[e.tipo_evento]}
                    {LABELS[e.tipo_evento]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.motos ? (
                    <Link
                      to="/verificar/$chassi"
                      params={{ chassi: e.motos.chassi }}
                      className="font-medium text-secondary hover:underline"
                    >
                      {e.motos.marca} {e.motos.modelo}
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                        {e.motos.chassi.slice(0, 8)}…
                      </span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-md">
                  <p>{e.descricao}</p>
                  {e.diff && Object.keys(e.diff).length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                      {Object.entries(e.diff).slice(0, 3).map(([k, v]) => (
                        <li key={k} className="truncate">
                          <span className="font-mono">{k}:</span>{" "}
                          <span className="line-through opacity-70">{String(v.antes ?? "—")}</span>{" "}
                          → <span className="text-secondary">{String(v.depois ?? "—")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{e.operador}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
        (active ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-muted")
      }
    >
      {label}
    </button>
  );
}
