import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRightLeft, AlertTriangle, Building2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { getMotoById } from "@/lib/motos.functions";
import { listMunicipios } from "@/lib/plataforma.functions";
import { iniciarTransferenciaOrigem, obterTransferenciaAtivaMoto } from "@/lib/transferencias.functions";
import { useSessao } from "@/hooks/use-sessao";
import { PROVINCIAS_MZ } from "@/lib/moto-types";

export const Route = createFileRoute("/_authenticated/gestao/$id/transferir")({
  loader: async ({ params }) => {
    const moto = await getMotoById({ data: { id: params.id } });
    if (!moto) throw notFound();
    return moto;
  },
  errorComponent: ({ error }) => <p className="text-destructive">{error.message}</p>,
  notFoundComponent: () => <p>Mota não encontrada.</p>,
  component: TransferirMota,
});

function TransferirMota() {
  const moto = Route.useLoaderData();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { sessao } = useSessao();

  const [municipioDestinoId, setMunicipioDestinoId] = useState("");
  const [form, setForm] = useState({
    nome: "",
    bi: "",
    contacto: "",
    localidade: "",
    provincia: "",
    valor: "",
    motivo: "",
  });

  const { data: municipios } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => listMunicipios(),
  });

  const { data: transferenciaAtiva, isLoading: aCarregarAtiva } = useQuery({
    queryKey: ["transferencia-ativa", moto.id],
    queryFn: () => obterTransferenciaAtivaMoto({ data: { motoId: moto.id } }),
  });

  const mut = useMutation({
    mutationFn: () =>
      iniciarTransferenciaOrigem({
        data: {
          motoId: moto.id,
          municipioDestinoId: municipioDestinoId || sessao?.municipioId!,
          novoProprietario: {
            nome: form.nome.trim(),
            bi: form.bi || null,
            contacto: form.contacto || null,
            localidade: form.localidade || null,
            provincia: form.provincia || null,
          },
          valor: form.valor ? Number(form.valor) : null,
          motivo: form.motivo || null,
        },
      }),
    onSuccess: () => {
      toast.success("Processo de transferência iniciado. O município de destino receberá a notificação.");
      qc.invalidateQueries();
      navigate({ to: "/gestao/transferencias" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        to="/gestao/$id"
        params={{ id: moto.id }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à mota
      </Link>

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
          Transferir Propriedade de Motorizada
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {moto.marca} {moto.modelo} — <span className="font-mono font-bold">{moto.chassi}</span>
        </p>
      </div>

      {/* BLOQUEIO DE DUPLICADOS */}
      {transferenciaAtiva ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-warning-foreground text-sm">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            Esta motorizada possui uma transferência em andamento.
          </div>
          <p className="text-xs text-muted-foreground">
            Existe um processo de transferência activo com o estado{" "}
            <strong>"{transferenciaAtiva.estado}"</strong> iniciado para o Município de{" "}
            <strong>{transferenciaAtiva.municipio_destino_nome}</strong>.
          </p>
          <div className="pt-2">
            <Link
              to="/gestao/transferencias"
              className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-4 py-2 text-xs font-bold text-warning-foreground hover:opacity-90"
            >
              Ver Painel de Transferências
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Proprietário Actual (Origem)
            </p>
            <p className="font-bold text-base">{moto.proprietario_nome}</p>
            <p className="text-xs text-muted-foreground">
              {moto.proprietario_localidade ?? "—"}, {moto.proprietario_provincia ?? "—"} ·{" "}
              {moto.proprietario_contacto ?? "sem contacto"}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
            className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Município de Destino *
              </label>
              <select
                required
                value={municipioDestinoId}
                onChange={(e) => setMunicipioDestinoId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Seleccione o Município de Destino...</option>
                {(municipios ?? [])
                  .filter((m) => m.id !== moto.municipio_id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.provincia})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dados do Novo Proprietário
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome Completo *">
                  <input
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={input}
                    placeholder="Ex: António Ernesto"
                  />
                </Field>
                <Field label="BI / Identificação">
                  <input
                    value={form.bi}
                    onChange={(e) => setForm({ ...form, bi: e.target.value })}
                    className={input + " font-mono"}
                  />
                </Field>
                <Field label="Contacto">
                  <input
                    value={form.contacto}
                    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="Localidade / Bairro">
                  <input
                    value={form.localidade}
                    onChange={(e) => setForm({ ...form, localidade: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="Província">
                  <select
                    value={form.provincia}
                    onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                    className={input}
                  >
                    <option value="">—</option>
                    {PROVINCIAS_MZ.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Valor da Transacção (MT)">
                  <input
                    type="number"
                    min={0}
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className={input}
                  />
                </Field>
              </div>
              <Field label="Motivo / Observações">
                <textarea
                  rows={3}
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className={input + " resize-none"}
                  placeholder="Justificação ou observações sobre a transferência..."
                />
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={mut.isPending || !form.nome.trim() || !municipioDestinoId}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Iniciar Transferência
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

const input =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
