import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  X,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";
import { useSessao } from "@/hooks/use-sessao";
import {
  listOcorrencias,
  registarOcorrencia,
  confirmarRecuperacao,
  type Ocorrencia as Reporte,
} from "@/lib/ocorrencias.functions";

export const Route = createFileRoute("/_authenticated/policia/ocorrencias")({
  ssr: false,
  head: () => ({ meta: [{ title: "Ocorrências — Polícia MotoGest" }] }),
  component: OcorrenciasPage,
});

function OcorrenciasPage() {
  const qc = useQueryClient();
  const { sessao } = useSessao();
  const [modalNovo, setModalNovo] = useState(false);

  const { data: reportes, isLoading } = useQuery({
    queryKey: ["reportes-policia", sessao?.municipioId],
    queryFn: () => listOcorrencias(),
    enabled: !!sessao,
  });

  const marcarRecuperada = useMutation({
    mutationFn: ({ reporteId }: { reporteId: string; motoId: string | null }) =>
      confirmarRecuperacao({ data: { reporteId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportes-policia"] });
      toast.success("Ocorrência actualizada — Veículo marcado como Recuperado!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ocorrências Policiais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registo e acompanhamento de roubos e recuperações no{" "}
            {sessao?.municipio?.nome || "Município"}.
          </p>
        </div>
        <button
          onClick={() => setModalNovo(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Registar Ocorrência
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-4 py-3">Identificador</th>
                <th className="px-4 py-3">Descrição / Detalhes</th>
                <th className="hidden px-4 py-3 sm:table-cell">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 md:table-cell">Data</th>
                <th className="px-4 py-3 text-right">Acção</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(reportes ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhuma ocorrência registrada no município.
                  </td>
                </tr>
              )}
              {(reportes ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{r.identificador}</td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-2 text-xs">{r.descricao || "Sem descrição."}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-xs sm:table-cell">{r.contacto || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        r.sucesso
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive animate-pulse"
                      }`}
                    >
                      {r.sucesso ? (
                        <>
                          <ShieldCheck className="h-3 w-3" /> Recuperada
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3 w-3" /> Em Investigação
                        </>
                      )}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {new Date(r.created_at).toLocaleDateString("pt-MZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!r.sucesso && (
                      <button
                        onClick={() =>
                          marcarRecuperada.mutate({ reporteId: r.id, motoId: r.moto_id })
                        }
                        disabled={marcarRecuperada.isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-success/10 border border-success/30 px-2.5 py-1 text-xs font-bold text-success hover:bg-success hover:text-white transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Confirmar Recuperação
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registar Ocorrência */}
      {modalNovo && (
        <ModalNovaOcorrencia
          onClose={() => setModalNovo(false)}
          onSucesso={() => {
            setModalNovo(false);
            qc.invalidateQueries({ queryKey: ["reportes-policia"] });
          }}
        />
      )}
    </div>
  );
}

function ModalNovaOcorrencia({
  onClose,
  onSucesso,
}: {
  onClose: () => void;
  onSucesso: () => void;
}) {
  const [identificador, setIdentificador] = useState("");
  const [tipo, setTipo] = useState<"chassi" | "matricula" | "motor">("chassi");
  const [descricao, setDescricao] = useState("");
  const [contacto, setContacto] = useState("");

  const criar = useMutation({
    mutationFn: () =>
      registarOcorrencia({
        data: {
          identificador: identificador.trim().toUpperCase(),
          tipo,
          descricao,
          contacto: contacto || null,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        r.motoEncontrada
          ? "Ocorrência registada — motorizada marcada como roubada."
          : "Ocorrência registada com sucesso.",
      );
      onSucesso();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Registar Ocorrência / Roubo</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
          className="space-y-3 text-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold">Tipo de Identificador *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "chassi" | "matricula" | "motor")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            >
              <option value="chassi">Número do Chassi</option>
              <option value="matricula">Matrícula</option>
              <option value="motor">Número do Motor</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Identificador *</label>
            <input
              required
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-600 font-mono uppercase"
              placeholder="Digite o chassi ou matrícula..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Contacto do Denunciante</label>
            <input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-600"
              placeholder="+258 8x xxx xxxx"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Descrição / Circunstâncias do Roubo
            </label>
            <textarea
              required
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm outline-none focus:border-amber-600"
              placeholder="Detalhes do local, hora e suspeitos..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criar.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {criar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Submeter Ocorrência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
