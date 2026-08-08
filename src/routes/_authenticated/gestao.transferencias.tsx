import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Loader2,
  Check,
  X,
  FileText,
  AlertTriangle,
  Info,
  Filter,
} from "lucide-react";
import {
  listTransferencias,
  aprovarSolicitacaoOrigem,
  concluirTransferencia,
  rejeitarTransferencia,
  type ItemTransferencia,
} from "@/lib/transferencias.functions";
import { useSessao } from "@/hooks/use-sessao";
import { PROVINCIAS_MZ } from "@/lib/moto-types";

export const Route = createFileRoute("/_authenticated/gestao/transferencias")({
  ssr: false,
  head: () => ({ meta: [{ title: "Transferências — MotoGest" }] }),
  component: TransferenciasPage,
});

type AbaFiltro = "todas" | "recebidas" | "enviadas" | "pendentes" | "concluidas" | "rejeitadas";

const ESTADO_BADGE: Record<string, { label: string; class: string }> = {
  pendente_aceitacao: {
    label: "Pendente de Aceitação",
    class: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  },
  aguardando_origem: {
    label: "Aguardando Aprovação de Origem",
    class: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  },
  concluida: {
    label: "Concluída",
    class: "bg-success/15 text-success border-success/30",
  },
  rejeitada: {
    label: "Rejeitada",
    class: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function TransferenciasPage() {
  const qc = useQueryClient();
  const { sessao } = useSessao();
  const [aba, setAba] = useState<AbaFiltro>("pendentes");
  const [modalConcluir, setModalConcluir] = useState<ItemTransferencia | null>(null);
  const [modalRejeitar, setModalRejeitar] = useState<ItemTransferencia | null>(null);

  const { data: transferencias, isLoading } = useQuery({
    queryKey: ["transferencias-painel", aba],
    queryFn: () => listTransferencias({ data: { aba } }),
  });

  const aprovar = useMutation({
    mutationFn: (id: string) => aprovarSolicitacaoOrigem({ data: { transferenciaId: id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transferencias-painel"] });
      toast.success(
        "Solicitação aprovada! O município de destino pode agora concluir a transferência.",
      );
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Transferências</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhar, aprovar e concluir transferências inter-municipais de motorizadas.
          </p>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm">
        {(
          [
            { id: "pendentes", label: "Pendentes" },
            { id: "recebidas", label: "Recebidas" },
            { id: "enviadas", label: "Enviadas" },
            { id: "concluidas", label: "Concluídas" },
            { id: "rejeitadas", label: "Rejeitadas" },
            { id: "todas", label: "Todas" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
              aba === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {(transferencias ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              <Info className="mx-auto h-8 w-8 opacity-40 mb-2" />
              Nenhuma transferência encontrada nesta categoria.
            </div>
          ) : (
            (transferencias ?? []).map((t) => {
              const eOrigem = sessao?.superAdmin || t.municipio_origem_id === sessao?.municipioId;
              const eDestino = sessao?.superAdmin || t.municipio_destino_id === sessao?.municipioId;
              const badge = ESTADO_BADGE[t.estado] ?? { label: t.estado, class: "bg-muted" };

              return (
                <div key={t.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <ArrowRightLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">
                          {t.moto?.marca} {t.moto?.modelo}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground">
                          Chassi:{" "}
                          <strong className="text-foreground">{t.moto?.chassi || "—"}</strong>
                          {t.moto?.matricula && <span> · Matrícula: {t.moto.matricula}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${badge.class}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Municípios Envolvidos */}
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Origem: {t.municipio_origem_nome}</span>
                    </div>
                    <span className="text-muted-foreground font-bold">➔</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Building2 className="h-4 w-4 text-secondary" />
                      <span>Destino: {t.municipio_destino_nome}</span>
                    </div>
                  </div>

                  {/* Detalhes Proprietários */}
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div className="space-y-1 rounded-lg border p-3 bg-card">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Proprietário Anterior (Origem)
                      </p>
                      <p className="font-bold text-sm">{t.proprietario_anterior?.nome || "—"}</p>
                      <p>
                        <strong>BI:</strong> {t.proprietario_anterior?.bi || "—"}
                      </p>
                      <p>
                        <strong>Contacto:</strong> {t.proprietario_anterior?.contacto || "—"}
                      </p>
                      <p>
                        <strong>Localidade:</strong> {t.proprietario_anterior?.localidade || "—"},{" "}
                        {t.proprietario_anterior?.provincia || "—"}
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border p-3 bg-card">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Novo Proprietário (Destino)
                      </p>
                      <p className="font-bold text-sm text-primary">
                        {t.proprietario_novo?.nome || "—"}
                      </p>
                      <p>
                        <strong>BI:</strong> {t.proprietario_novo?.bi || "—"}
                      </p>
                      <p>
                        <strong>Contacto:</strong> {t.proprietario_novo?.contacto || "—"}
                      </p>
                      <p>
                        <strong>Localidade:</strong> {t.proprietario_novo?.localidade || "—"},{" "}
                        {t.proprietario_novo?.provincia || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Motivo / Transacção */}
                  {(t.motivo || t.valor_transaccao || t.motivo_rejeicao) && (
                    <div className="text-xs space-y-1 bg-muted/20 p-3 rounded-lg border">
                      {t.valor_transaccao != null && (
                        <p>
                          <strong>Valor da Transacção:</strong>{" "}
                          {new Intl.NumberFormat("pt-PT").format(t.valor_transaccao)} MT
                        </p>
                      )}
                      {t.motivo && (
                        <p>
                          <strong>Motivo / Observações:</strong> {t.motivo}
                        </p>
                      )}
                      {t.motivo_rejeicao && (
                        <p className="text-destructive font-semibold">
                          <strong>Motivo da Rejeição:</strong> {t.motivo_rejeicao}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rodapé / Acções */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Iniciada em {new Date(t.created_at).toLocaleDateString("pt-MZ")} por{" "}
                      {t.operador}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Botão APROVAR SOLICITAÇÃO (se aguardando_origem e utilizador for de Origem) */}
                      {t.estado === "aguardando_origem" && eOrigem && (
                        <button
                          onClick={() => aprovar.mutate(t.id)}
                          disabled={aprovar.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {aprovar.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Aprovar Solicitação
                        </button>
                      )}

                      {/* Botão CONCLUIR TRANSFERÊNCIA (se pendente_aceitacao e utilizador for de Destino) */}
                      {t.estado === "pendente_aceitacao" && eDestino && (
                        <button
                          onClick={() => setModalConcluir(t)}
                          className="inline-flex items-center gap-1 rounded-lg bg-success px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Concluir Transferência
                        </button>
                      )}

                      {/* Botão REJEITAR (se em andamento) */}
                      {(t.estado === "pendente_aceitacao" || t.estado === "aguardando_origem") &&
                        (eOrigem || eDestino) && (
                          <button
                            onClick={() => setModalRejeitar(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 text-destructive px-3 py-1.5 text-xs font-bold hover:bg-destructive/10"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rejeitar
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Concluir Transferência */}
      {modalConcluir && (
        <ModalConcluirTransferencia
          transferencia={modalConcluir}
          onClose={() => setModalConcluir(null)}
          onSucesso={() => {
            setModalConcluir(null);
            qc.invalidateQueries({ queryKey: ["transferencias-painel"] });
          }}
        />
      )}

      {/* Modal Rejeitar Transferência */}
      {modalRejeitar && (
        <ModalRejeitarTransferencia
          transferencia={modalRejeitar}
          onClose={() => setModalRejeitar(null)}
          onSucesso={() => {
            setModalRejeitar(null);
            qc.invalidateQueries({ queryKey: ["transferencias-painel"] });
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// MODAL CONCLUIR TRANSFERÊNCIA
// ────────────────────────────────────────────────
function ModalConcluirTransferencia({
  transferencia,
  onClose,
  onSucesso,
}: {
  transferencia: ItemTransferencia;
  onClose: () => void;
  onSucesso: () => void;
}) {
  const p = transferencia.proprietario_novo || {};
  const [form, setForm] = useState({
    nome: p.nome || "",
    bi: p.bi || "",
    contacto: p.contacto || "",
    contacto_alt: p.contacto_alt || "",
    familiar_nome: p.familiar_nome || "",
    familiar_contacto: p.familiar_contacto || "",
    endereco: p.endereco || "",
    localidade: p.localidade || "",
    provincia: p.provincia || "",
    data_nascimento: p.data_nascimento || "",
    valorTransaccao: transferencia.valor_transaccao ? String(transferencia.valor_transaccao) : "",
    observacoes: transferencia.motivo || "",
  });

  const concluir = useMutation({
    mutationFn: () =>
      concluirTransferencia({
        data: {
          transferenciaId: transferencia.id,
          novoProprietario: {
            nome: form.nome.trim(),
            bi: form.bi || null,
            contacto: form.contacto || null,
            contacto_alt: form.contacto_alt || null,
            familiar_nome: form.familiar_nome || null,
            familiar_contacto: form.familiar_contacto || null,
            endereco: form.endereco || null,
            localidade: form.localidade || null,
            provincia: form.provincia || null,
            data_nascimento: form.data_nascimento || null,
          },
          valorTransaccao: form.valorTransaccao ? Number(form.valorTransaccao) : null,
          observacoes: form.observacoes || null,
        },
      }),
    onSuccess: () => {
      toast.success(
        "Transferência concluída! O município e proprietário da motorizada foram atualizados.",
      );
      onSucesso();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-bold">Concluir Transferência</h2>
            <p className="text-xs text-muted-foreground">
              Confirme ou actualize os dados do novo proprietário antes de alterar o município
              responsável.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            concluir.mutate();
          }}
          className="space-y-4 text-sm"
        >
          <div className="rounded-lg bg-muted/40 p-3 text-xs">
            <p>
              <strong>Motorizada:</strong> {transferencia.moto?.marca} {transferencia.moto?.modelo}{" "}
              ({transferencia.moto?.chassi})
            </p>
            <p>
              <strong>Município de Origem:</strong> {transferencia.municipio_origem_nome} ➔{" "}
              <strong>Destino:</strong> {transferencia.municipio_destino_nome}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Nome Completo do Novo Proprietário *
              </label>
              <input
                required
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">BI / NUIT</label>
              <input
                value={form.bi}
                onChange={(e) => setForm((p) => ({ ...p, bi: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Contacto Principal</label>
              <input
                value={form.contacto}
                onChange={(e) => setForm((p) => ({ ...p, contacto: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Contacto Alternativo</label>
              <input
                value={form.contacto_alt}
                onChange={(e) => setForm((p) => ({ ...p, contacto_alt: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Nome de Familiar de Referência
              </label>
              <input
                value={form.familiar_nome}
                onChange={(e) => setForm((p) => ({ ...p, familiar_nome: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Contacto do Familiar</label>
              <input
                value={form.familiar_contacto}
                onChange={(e) => setForm((p) => ({ ...p, familiar_contacto: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Endereço Residencial</label>
              <input
                value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Localidade / Bairro</label>
              <input
                value={form.localidade}
                onChange={(e) => setForm((p) => ({ ...p, localidade: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Província</label>
              <select
                value={form.provincia}
                onChange={(e) => setForm((p) => ({ ...p, provincia: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Seleccione...</option>
                {PROVINCIAS_MZ.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Data de Nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={(e) => setForm((p) => ({ ...p, data_nascimento: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Valor da Transacção (MT)</label>
            <input
              type="number"
              min={0}
              value={form.valorTransaccao}
              onChange={(e) => setForm((p) => ({ ...p, valorTransaccao: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Observações Finais</label>
            <textarea
              rows={2}
              value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              className="w-full rounded-lg border p-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={concluir.isPending || !form.nome.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-success px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {concluir.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Concluir Transferência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// MODAL REJEITAR TRANSFERÊNCIA
// ────────────────────────────────────────────────
function ModalRejeitarTransferencia({
  transferencia,
  onClose,
  onSucesso,
}: {
  transferencia: ItemTransferencia;
  onClose: () => void;
  onSucesso: () => void;
}) {
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const rejeitar = useMutation({
    mutationFn: () =>
      rejeitarTransferencia({
        data: {
          transferenciaId: transferencia.id,
          motivoRejeicao,
        },
      }),
    onSuccess: () => {
      toast.success("Transferência rejeitada com sucesso.");
      onSucesso();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-destructive">Rejeitar Transferência</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Indique o motivo da rejeição da transferência da motorizada{" "}
          <strong>
            {transferencia.moto?.marca} {transferencia.moto?.modelo} ({transferencia.moto?.chassi})
          </strong>
          .
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            rejeitar.mutate();
          }}
          className="space-y-4 text-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold">Motivo da Rejeição *</label>
            <textarea
              required
              rows={3}
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm outline-none focus:border-destructive"
              placeholder="Descreva a razão da rejeição..."
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
              disabled={rejeitar.isPending || motivoRejeicao.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {rejeitar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Confirmar Rejeição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
