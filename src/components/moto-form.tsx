import { useState } from "react";
import { type MotoInput } from "@/lib/motos.functions";
import {
  createDocUploadUrl,
  createDocReadUrl,
  removeDoc,
} from "@/lib/documentos.functions";
import {
  PROVINCIAS_MZ,
  type EstadoMoto,
  type Moto,
  ESTADOS_LABEL,
  type Documento,
  type TipoDocumento,
  TIPOS_DOCUMENTO_LABEL,
} from "@/lib/moto-types";
import { getDistritos, getPostos } from "@/lib/mz-localidades";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  initial?: Partial<Moto>;
  submitting: boolean;
  onSubmit: (data: MotoInput) => void;
  submitLabel?: string;
}

const BUCKET = "moto-documentos";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

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
  const [documentos, setDocumentos] = useState<Documento[]>(initial?.documentos ?? []);
  const [uploadingTipo, setUploadingTipo] = useState<TipoDocumento | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleUpload(tipo: TipoDocumento, file: File) {
    setUploadError(null);
    if (file.size > MAX_SIZE) {
      setUploadError(`Ficheiro maior que ${Math.round(MAX_SIZE / 1024 / 1024)} MB`);
      return;
    }
    setUploadingTipo(tipo);
    try {
      const chassiSafe = (form.chassi || "novo").replace(/[^A-Za-z0-9_-]/g, "_");
      const { path, token } = await createDocUploadUrl({
        data: { chassi: chassiSafe, tipo, filename: file.name },
      });
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (error) throw error;
      setDocumentos((d) => [
        ...d,
        {
          tipo,
          nome: file.name,
          path,
          mime: file.type || "application/octet-stream",
          tamanho: file.size,
          carregado_em: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Falha no carregamento");
    } finally {
      setUploadingTipo(null);
    }
  }

  async function handleRemove(doc: Documento) {
    try {
      await removeDoc({ data: { path: doc.path } });
    } catch {
      // best-effort remove
    }
    setDocumentos((d) => d.filter((x) => x.path !== doc.path));
  }

  async function openDoc(doc: Documento) {
    try {
      const { signedUrl } = await createDocReadUrl({ data: { path: doc.path } });
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Não foi possível abrir o documento");
    }
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
      documentos,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Identificação da viatura">
        <Grid>
          <Field label="Chassi" required value={form.chassi}>
            <input value={form.chassi} onChange={(e) => set("chassi", e.target.value.toUpperCase())} required minLength={6} className={inputCls(form.chassi, true) + " font-mono"} />
          </Field>
          <Field label="Matrícula" value={form.matricula}>
            <input value={form.matricula} onChange={(e) => set("matricula", e.target.value)} className={inputCls(form.matricula, false) + " font-mono"} />
          </Field>
          <Field label="Marca" required value={form.marca}>
            <input value={form.marca} onChange={(e) => set("marca", e.target.value)} required className={inputCls(form.marca, true)} />
          </Field>
          <Field label="Modelo" required value={form.modelo}>
            <input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} required className={inputCls(form.modelo, true)} />
          </Field>
          <Field label="Ano" value={form.ano}>
            <input type="number" value={form.ano} onChange={(e) => set("ano", e.target.value)} min={1950} max={2100} className={inputCls(form.ano, false)} />
          </Field>
          <Field label="Cilindrada (cc)" value={form.cilindrada}>
            <input type="number" value={form.cilindrada} onChange={(e) => set("cilindrada", e.target.value)} className={inputCls(form.cilindrada, false)} />
          </Field>
          <Field label="Cor" value={form.cor}>
            <input value={form.cor} onChange={(e) => set("cor", e.target.value)} className={inputCls(form.cor, false)} />
          </Field>
          <Field label="Quilometragem" value={form.km}>
            <input type="number" value={form.km} onChange={(e) => set("km", e.target.value)} min={0} className={inputCls(form.km, false)} />
          </Field>
        </Grid>
      </Section>

      <Section title="Proprietário">
        <Grid>
          <Field label="Nome completo" required value={form.proprietario_nome}>
            <input value={form.proprietario_nome} onChange={(e) => set("proprietario_nome", e.target.value)} required className={inputCls(form.proprietario_nome, true)} />
          </Field>
          <Field label="BI / Identificação" value={form.proprietario_bi}>
            <input value={form.proprietario_bi} onChange={(e) => set("proprietario_bi", e.target.value)} className={inputCls(form.proprietario_bi, false) + " font-mono"} />
          </Field>
          <Field label="Contacto" value={form.proprietario_contacto}>
            <input value={form.proprietario_contacto} onChange={(e) => set("proprietario_contacto", e.target.value)} placeholder="+258 ..." className={inputCls(form.proprietario_contacto, false)} />
          </Field>
          <Field label="Localidade / Bairro" value={form.proprietario_localidade}>
            <input value={form.proprietario_localidade} onChange={(e) => set("proprietario_localidade", e.target.value)} className={inputCls(form.proprietario_localidade, false)} />
          </Field>
          <Field label="Província" value={form.proprietario_provincia}>
            <select value={form.proprietario_provincia} onChange={(e) => set("proprietario_provincia", e.target.value)} className={inputCls(form.proprietario_provincia, false)}>
              <option value="">—</option>
              {PROVINCIAS_MZ.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </Grid>
      </Section>


      <Section title="Documentos">
        <p className="text-xs text-muted-foreground -mt-2">
          Carregue cópias do BI, carta de condução, livrete da moto e outros documentos relevantes (PDF ou imagem, até 8 MB).
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(TIPOS_DOCUMENTO_LABEL) as TipoDocumento[]).map((tipo) => (
            <label
              key={tipo}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed bg-background px-3 py-2.5 text-sm hover:border-secondary hover:bg-secondary/5"
            >
              <span className="flex items-center gap-2 font-medium">
                <UploadIcon />
                {TIPOS_DOCUMENTO_LABEL[tipo]}
              </span>
              <span className="text-xs text-muted-foreground">
                {uploadingTipo === tipo ? "A carregar…" : "Escolher ficheiro"}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploadingTipo !== null}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(tipo, f);
                  e.target.value = "";
                }}
              />
            </label>
          ))}
        </div>

        {uploadError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {uploadError}
          </div>
        )}

        {documentos.length > 0 && (
          <ul className="divide-y rounded-md border bg-background">
            {documentos.map((doc) => (
              <li key={doc.path} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      {TIPOS_DOCUMENTO_LABEL[doc.tipo]}
                    </span>
                    <span className="truncate font-medium">{doc.nome}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(doc.tamanho / 1024).toFixed(0)} KB · {new Date(doc.carregado_em).toLocaleString("pt-PT")}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => void openDoc(doc)} className="rounded border px-2 py-1 text-xs hover:bg-muted">
                    Ver
                  </button>
                  <button type="button" onClick={() => void handleRemove(doc)} className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Estado e mercado">
        <Grid>
          <Field label="Estado" required value={form.estado}>
            <select value={form.estado} onChange={(e) => set("estado", e.target.value as EstadoMoto)} className={inputCls(form.estado, true)}>
              {(Object.keys(ESTADOS_LABEL) as EstadoMoto[]).map((s) => (
                <option key={s} value={s}>{ESTADOS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Preço de venda (MT)" required={form.estado === "a_venda"} value={form.preco_venda}>
            <input type="number" value={form.preco_venda} onChange={(e) => set("preco_venda", e.target.value)} disabled={form.estado !== "a_venda"} className={inputCls(form.preco_venda, form.estado === "a_venda") + " disabled:opacity-50 disabled:bg-muted"} />
          </Field>
        </Grid>
        <Field label="Notas internas (não públicas)" value={form.notas_internas}>
          <textarea value={form.notas_internas} onChange={(e) => set("notas_internas", e.target.value)} rows={3} className={inputCls(form.notas_internas, false) + " resize-none"} />
        </Field>
      </Section>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting || uploadingTipo !== null}
          className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "A guardar…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Colour-coded input:
 *  - required + empty → âmbar (precisa preencher)
 *  - required + preenchido → verde (ok)
 *  - opcional + vazio → cinza neutro
 *  - opcional + preenchido → verde suave
 */
function inputCls(value: string, required: boolean) {
  const base =
    "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2";
  const filled = value != null && String(value).trim() !== "";
  if (required && !filled) {
    return `${base} border-accent/70 bg-accent/10 focus:border-accent focus:ring-accent/30`;
  }
  if (filled) {
    return `${base} border-secondary/50 bg-secondary/5 focus:border-secondary focus:ring-secondary/30`;
  }
  return `${base} border-input focus:border-secondary focus:ring-secondary/20`;
}

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
function Field({
  label,
  required,
  value,
  children,
}: {
  label: string;
  required?: boolean;
  value?: string;
  children: React.ReactNode;
}) {
  const filled = value != null && String(value).trim() !== "";
  const status = required
    ? filled
      ? { text: "Preenchido", cls: "bg-secondary/15 text-secondary" }
      : { text: "Obrigatório", cls: "bg-accent/25 text-accent-foreground" }
    : filled
      ? { text: "Preenchido", cls: "bg-secondary/10 text-secondary" }
      : { text: "Opcional", cls: "bg-muted text-muted-foreground" };
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {label} {required && <span className="text-accent-foreground">*</span>}
        </span>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${status.cls}`}>
          {status.text}
        </span>
      </span>
      {children}
    </label>
  );
}


function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
