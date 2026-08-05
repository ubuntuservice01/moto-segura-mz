import { Plus, ArrowRightLeft, Pencil, Activity } from "lucide-react";
import type { HistoricoEvento, TipoEvento } from "@/lib/moto-types";

const ICONS: Record<TipoEvento, React.ReactNode> = {
  registo: <Plus className="h-4 w-4" />,
  transferencia: <ArrowRightLeft className="h-4 w-4" />,
  actualizacao: <Pencil className="h-4 w-4" />,
  mudanca_estado: <Activity className="h-4 w-4" />,
};

const COLORS: Record<TipoEvento, string> = {
  registo: "bg-secondary text-secondary-foreground",
  transferencia: "bg-accent text-accent-foreground",
  actualizacao: "bg-muted text-foreground",
  mudanca_estado: "bg-primary text-primary-foreground",
};

const TIPO_LABEL: Record<TipoEvento, string> = {
  registo: "Registo",
  transferencia: "Transferência",
  actualizacao: "Actualização",
  mudanca_estado: "Mudança de estado",
};

export function Timeline({ eventos }: { eventos: HistoricoEvento[] }) {
  if (!eventos.length) {
    return <p className="text-sm text-muted-foreground">Sem histórico registado.</p>;
  }
  return (
    <ol className="relative space-y-6 border-l-2 border-border pl-6">
      {eventos.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background ${COLORS[e.tipo_evento]}`}
          >
            {ICONS[e.tipo_evento]}
          </span>
          <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {TIPO_LABEL[e.tipo_evento]}
              </span>
              <time className="text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString("pt-PT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
            <p className="mt-1.5 text-sm font-medium text-foreground">{e.descricao}</p>
            {e.diff && Object.keys(e.diff).length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {Object.entries(e.diff).map(([campo, raw]) => {
                  const val = raw as unknown;
                  if (val === null || val === undefined) return null;
                  if (typeof val !== "object") {
                    return (
                      <li key={campo} className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                        <span className="font-mono font-semibold text-foreground">{campo}:</span>
                        <span className="font-semibold text-secondary">{formatVal(val as never)}</span>
                      </li>
                    );
                  }
                  const { antes, depois } = val as { antes?: never; depois?: never };
                  const a = antes === null || antes === undefined || antes === "" ? null : antes;
                  const d = depois === null || depois === undefined || depois === "" ? null : depois;
                  if (a === null && d === null) return null;
                  return (
                    <li key={campo} className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">{campo}:</span>
                      {a !== null && (
                        <>
                          <span className="line-through opacity-70">{formatVal(a)}</span>
                          <span>→</span>
                        </>
                      )}
                      <span className="font-semibold text-secondary">{formatVal(d)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {e.motivo && (
              <p className="mt-2 text-xs italic text-muted-foreground">Motivo: {e.motivo}</p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Operador: {e.operador}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatVal(v: string | number | boolean | null): string {
  if (v === null || v === "") return "—";
  if (typeof v === "number") return new Intl.NumberFormat("pt-PT").format(v);
  return String(v);
}
