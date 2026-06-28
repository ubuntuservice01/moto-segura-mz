import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { getMotoById, transferOwner } from "@/lib/motos.functions";
import { PROVINCIAS_MZ } from "@/lib/moto-types";

export const Route = createFileRoute("/gestao/$id/transferir")({
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

  const [form, setForm] = useState({
    nome: "",
    bi: "",
    contacto: "",
    localidade: "",
    provincia: "",
    valor: "",
    motivo: "",
  });

  const mut = useMutation({
    mutationFn: () =>
      transferOwner({
        data: {
          motoId: moto.id,
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
      toast.success("Transferência concluída e registada.");
      qc.invalidateQueries();
      navigate({ to: "/gestao/$id", params: { id: moto.id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="max-w-3xl">
      <Link to="/gestao/$id" params={{ id: moto.id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à mota
      </Link>

      <h2 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <ArrowRightLeft className="h-6 w-6 text-accent-foreground" />
        Transferir propriedade
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {moto.marca} {moto.modelo} — <span className="font-mono">{moto.chassi}</span>
      </p>

      <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Proprietário actual
        </p>
        <p className="mt-1 font-medium">{moto.proprietario_nome}</p>
        <p className="text-xs text-muted-foreground">
          {moto.proprietario_localidade ?? "—"}, {moto.proprietario_provincia ?? "—"} ·{" "}
          {moto.proprietario_contacto ?? "sem contacto"}
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="mt-6 space-y-5 rounded-xl border bg-card p-5"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Novo proprietário
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo *">
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={input} />
          </Field>
          <Field label="BI / Identificação">
            <input value={form.bi} onChange={(e) => setForm({ ...form, bi: e.target.value })} className={input + " font-mono"} />
          </Field>
          <Field label="Contacto">
            <input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className={input} />
          </Field>
          <Field label="Localidade">
            <input value={form.localidade} onChange={(e) => setForm({ ...form, localidade: e.target.value })} className={input} />
          </Field>
          <Field label="Província">
            <select value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className={input}>
              <option value="">—</option>
              {PROVINCIAS_MZ.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Valor da transacção (MT)">
            <input type="number" min={0} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={input} />
          </Field>
        </div>
        <Field label="Motivo / Observações">
          <textarea rows={3} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} className={input + " resize-none"} />
        </Field>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mut.isPending || !form.nome.trim()}
            className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {mut.isPending ? "A transferir…" : "Confirmar transferência"}
          </button>
        </div>
      </form>
    </div>
  );
}

const input = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
