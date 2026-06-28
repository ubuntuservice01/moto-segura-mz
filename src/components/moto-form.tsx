import { useState } from "react";
import { type MotoInput } from "@/lib/motos.functions";
import { PROVINCIAS_MZ, type EstadoMoto, type Moto, ESTADOS_LABEL } from "@/lib/moto-types";

interface Props {
  initial?: Partial<Moto>;
  submitting: boolean;
  onSubmit: (data: MotoInput) => void;
  submitLabel?: string;
}

export function MotoForm({ initial, submitting, onSubmit, submitLabel = "Guardar" }: Props) {
  const [form, setForm] = useState({
    chassi: initial?.chassi ?? "",
    matricula: initial?.matricula ?? "",
    marca: initial?.marca ?? "",
    modelo: initial?.modelo ?? "",
    ano: initial?.ano?.toString() ?? "",
    cilindrada: initial?.cilindrada?.toString() ?? "",
    cor: initial?.cor ?? "",
    km: initial?.km?.toString() ?? "0",
    proprietario_nome: initial?.proprietario_nome ?? "",
    proprietario_bi: initial?.proprietario_bi ?? "",
    proprietario_contacto: initial?.proprietario_contacto ?? "",
    proprietario_localidade: initial?.proprietario_localidade ?? "",
    proprietario_provincia: initial?.proprietario_provincia ?? "",
    estado: (initial?.estado ?? "activa") as EstadoMoto,
    preco_venda: initial?.preco_venda?.toString() ?? "",
    notas_internas: initial?.notas_internas ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      chassi: form.chassi.trim().toUpperCase(),
      matricula: form.matricula || null,
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      ano: form.ano ? Number(form.ano) : null,
      cilindrada: form.cilindrada ? Number(form.cilindrada) : null,
      cor: form.cor || null,
      km: form.km ? Number(form.km) : null,
      proprietario_nome: form.proprietario_nome.trim(),
      proprietario_bi: form.proprietario_bi || null,
      proprietario_contacto: form.proprietario_contacto || null,
      proprietario_localidade: form.proprietario_localidade || null,
      proprietario_provincia: form.proprietario_provincia || null,
      estado: form.estado,
      preco_venda: form.preco_venda ? Number(form.preco_venda) : null,
      notas_internas: form.notas_internas || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Identificação da viatura">
        <Grid>
          <Field label="Chassi *" required>
            <input value={form.chassi} onChange={(e) => set("chassi", e.target.value.toUpperCase())} required minLength={6} className={input + " font-mono"} />
          </Field>
          <Field label="Matrícula">
            <input value={form.matricula} onChange={(e) => set("matricula", e.target.value)} className={input + " font-mono"} />
          </Field>
          <Field label="Marca *" required>
            <input value={form.marca} onChange={(e) => set("marca", e.target.value)} required className={input} />
          </Field>
          <Field label="Modelo *" required>
            <input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} required className={input} />
          </Field>
          <Field label="Ano">
            <input type="number" value={form.ano} onChange={(e) => set("ano", e.target.value)} min={1950} max={2100} className={input} />
          </Field>
          <Field label="Cilindrada (cc)">
            <input type="number" value={form.cilindrada} onChange={(e) => set("cilindrada", e.target.value)} className={input} />
          </Field>
          <Field label="Cor">
            <input value={form.cor} onChange={(e) => set("cor", e.target.value)} className={input} />
          </Field>
          <Field label="Quilometragem">
            <input type="number" value={form.km} onChange={(e) => set("km", e.target.value)} min={0} className={input} />
          </Field>
        </Grid>
      </Section>

      <Section title="Proprietário">
        <Grid>
          <Field label="Nome completo *" required>
            <input value={form.proprietario_nome} onChange={(e) => set("proprietario_nome", e.target.value)} required className={input} />
          </Field>
          <Field label="BI / Identificação">
            <input value={form.proprietario_bi} onChange={(e) => set("proprietario_bi", e.target.value)} className={input + " font-mono"} />
          </Field>
          <Field label="Contacto">
            <input value={form.proprietario_contacto} onChange={(e) => set("proprietario_contacto", e.target.value)} placeholder="+258 ..." className={input} />
          </Field>
          <Field label="Localidade / Bairro">
            <input value={form.proprietario_localidade} onChange={(e) => set("proprietario_localidade", e.target.value)} className={input} />
          </Field>
          <Field label="Província">
            <select value={form.proprietario_provincia} onChange={(e) => set("proprietario_provincia", e.target.value)} className={input}>
              <option value="">—</option>
              {PROVINCIAS_MZ.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="Estado e mercado">
        <Grid>
          <Field label="Estado *" required>
            <select value={form.estado} onChange={(e) => set("estado", e.target.value as EstadoMoto)} className={input}>
              {(Object.keys(ESTADOS_LABEL) as EstadoMoto[]).map((s) => (
                <option key={s} value={s}>{ESTADOS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Preço de venda (MT)">
            <input type="number" value={form.preco_venda} onChange={(e) => set("preco_venda", e.target.value)} disabled={form.estado !== "a_venda"} className={input + " disabled:opacity-50"} />
          </Field>
        </Grid>
        <Field label="Notas internas (não públicas)">
          <textarea value={form.notas_internas} onChange={(e) => set("notas_internas", e.target.value)} rows={3} className={input + " resize-none"} />
        </Field>
      </Section>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "A guardar…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

const input =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
