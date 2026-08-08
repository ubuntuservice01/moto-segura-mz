import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { createPreRegisto, type PreRegistoInput } from "@/lib/pre-registos.functions";
import { PROVINCIAS_MZ } from "@/lib/moto-types";

interface Props {
  chassiInicial: string;
  onSuccess?: () => void;
}

export function PreRegistoForm({ chassiInicial, onSuccess }: Props) {
  const [form, setForm] = useState({
    chassi: chassiInicial,
    marca: "",
    modelo: "",
    ano: "",
    cor: "",
    proprietario_nome: "",
    proprietario_contacto: "",
    proprietario_provincia: "",
    notas: "",
  });
  const [enviado, setEnviado] = useState(false);

  const mut = useMutation({
    mutationFn: (data: PreRegistoInput) => createPreRegisto({ data }),
    onSuccess: () => {
      toast.success("Pré-registo enviado. Um operador Ubuntu Service vai analisar.");
      setEnviado(true);
      onSuccess?.();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mut.mutate({
      chassi: form.chassi.trim().toUpperCase(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      ano: form.ano ? Number(form.ano) : null,
      cor: form.cor || null,
      proprietario_nome: form.proprietario_nome.trim(),
      proprietario_contacto: form.proprietario_contacto || null,
      proprietario_provincia: form.proprietario_provincia || null,
      notas: form.notas || null,
      origem_busca: chassiInicial || null,
    });
  }

  if (enviado) {
    return (
      <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-6 text-center">
        <p className="text-base font-semibold text-secondary">Pré-registo enviado com sucesso!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Um operador Ubuntu Service vai analisar os dados e validar o registo. Obrigado por
          contribuir para a segurança do sistema.
        </p>
      </div>
    );
  }

  const input =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold">Fazer pré-registo</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Preencha os dados básicos. Um operador Ubuntu Service vai validar antes de a mota aparecer
          no sistema.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Chassi *</span>
          <input
            required
            minLength={4}
            value={form.chassi}
            onChange={(e) => setForm({ ...form, chassi: e.target.value.toUpperCase() })}
            className={input + " font-mono"}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Marca *</span>
          <input
            required
            value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
            className={input}
            placeholder="Ex: Honda"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Modelo *</span>
          <input
            required
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            className={input}
            placeholder="Ex: CG 125"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Ano</span>
          <input
            type="number"
            min={1950}
            max={2100}
            value={form.ano}
            onChange={(e) => setForm({ ...form, ano: e.target.value })}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Cor</span>
          <input
            value={form.cor}
            onChange={(e) => setForm({ ...form, cor: e.target.value })}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Província</span>
          <select
            value={form.proprietario_provincia}
            onChange={(e) => setForm({ ...form, proprietario_provincia: e.target.value })}
            className={input}
          >
            <option value="">—</option>
            {PROVINCIAS_MZ.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Nome do proprietário *</span>
          <input
            required
            value={form.proprietario_nome}
            onChange={(e) => setForm({ ...form, proprietario_nome: e.target.value })}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Contacto</span>
          <input
            value={form.proprietario_contacto}
            onChange={(e) => setForm({ ...form, proprietario_contacto: e.target.value })}
            className={input}
            placeholder="+258 ..."
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium">Notas (opcional)</span>
        <textarea
          rows={2}
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          className={input + " resize-none"}
        />
      </label>

      <button
        type="submit"
        disabled={mut.isPending}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {mut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Enviar pré-registo
      </button>
    </form>
  );
}
