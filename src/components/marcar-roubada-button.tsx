import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { marcarComoRoubada } from "@/lib/motos.functions";

export function MarcarRoubadaButton({
  motoId,
  chassi,
  disabled,
}: {
  motoId: string;
  chassi: string;
  disabled?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => marcarComoRoubada({ data: { id: motoId, motivo } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["historico"] });
      toast.success("Mota marcada como ROUBADA");
      setAberto(false);
      setMotivo("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (disabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/15"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Marcar como roubada
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !mut.isPending && setAberto(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h3 className="text-base font-bold">Declarar mota roubada</h3>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{chassi}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Motivo / circunstâncias <span className="text-destructive">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              maxLength={500}
              autoFocus
              placeholder="Ex.: Furto declarado na esquadra da Matola em 04/08/2026, nº de ocorrência 1234…"
              className="mt-1.5 w-full rounded-md border bg-background p-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {motivo.trim().length}/500 — este motivo fica gravado no histórico da mota.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={mut.isPending}
                className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => mut.mutate()}
                disabled={mut.isPending || motivo.trim().length < 5}
                className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Confirmar roubo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
