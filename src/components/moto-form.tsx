import { useMemo, useState } from "react";
import {
  Bike,
  CalendarDays,
  FileText,
  Gauge,
  Hash,
  MapPin,
  Palette,
  Pencil,
  Phone,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  User,
  Loader2,
} from "lucide-react";
import { type MotoInput } from "@/lib/motos.functions";
import { createDocUploadUrl, createDocReadUrl, removeDoc } from "@/lib/documentos.functions";
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
import {
  CampoSelect,
  CampoTexto,
  CampoTextarea,
  CartaoSeccao,
  GrelhaCampos,
} from "@/components/ui/form-fields";
import { MultiStepFormWrapper, type StepItem } from "@/components/ui/multi-step-form-wrapper";
import { notificar } from "@/components/ui/notify";

interface Props {
  initial?: Partial<Moto>;
  submitting: boolean;
  onSubmit: (data: MotoInput) => void;
  submitLabel?: string;
}

const BUCKET = "moto-documentos";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

const STEPS: StepItem[] = [
  { id: "moto", title: "Motociclo" },
  { id: "prop", title: "Proprietário" },
  { id: "seg", title: "Segurança" },
  { id: "docs", title: "Documentos" },
  { id: "mercado", title: "Estado" },
  { id: "rev", title: "Revisão" },
];

export function MotoForm({ initial, submitting, onSubmit, submitLabel = "Guardar" }: Props) {
  const [step, setStep] = useState(0);
  const [erros, setErros] = useState<Record<string, string>>({});
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
    proprietario_distrito: initial?.proprietario_distrito ?? "",
    proprietario_posto_admin: initial?.proprietario_posto_admin ?? "",
    numero_motor: initial?.numero_motor ?? "",
    proprietario_data_nascimento: initial?.proprietario_data_nascimento ?? "",
    proprietario_contacto_alt: initial?.proprietario_contacto_alt ?? "",
    proprietario_familiar_nome: initial?.proprietario_familiar_nome ?? "",
    proprietario_familiar_contacto: initial?.proprietario_familiar_contacto ?? "",
    proprietario_endereco: initial?.proprietario_endereco ?? "",
    data_compra: initial?.data_compra ?? "",
    local_compra: initial?.local_compra ?? "",
    estado: (initial?.estado ?? "activa") as EstadoMoto,
    preco_venda: initial?.preco_venda?.toString() ?? "",
    notas_internas: initial?.notas_internas ?? "",
  });
  const [documentos, setDocumentos] = useState<Documento[]>(initial?.documentos ?? []);
  const [uploadingTipo, setUploadingTipo] = useState<TipoDocumento | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErros((e) => (e[k] ? { ...e, [k]: "" } : e));
  }

  function validarEtapa(idx: number): boolean {
    const e: Record<string, string> = {};
    if (idx === 0) {
      if (form.chassi.trim().length < 6) e.chassi = "Indique um chassi com pelo menos 6 caracteres.";
      if (!form.marca.trim()) e.marca = "Indique a marca do motociclo.";
      if (!form.modelo.trim()) e.modelo = "Indique o modelo do motociclo.";
      if (form.ano && (Number(form.ano) < 1950 || Number(form.ano) > 2100))
        e.ano = "Ano inválido.";
    }
    if (idx === 1 && !form.proprietario_nome.trim())
      e.proprietario_nome = "Indique o nome completo do proprietário.";
    if (idx === 4 && form.estado === "a_venda" && !form.preco_venda)
      e.preco_venda = "Defina o preço para colocar à venda.";
    setErros(e);
    if (Object.keys(e).length > 0) {
      notificar.aviso("Existem campos por corrigir", {
        descricao: "Reveja os campos assinalados nesta etapa antes de continuar.",
      });
      return false;
    }
    return true;
  }

  async function handleUpload(tipo: TipoDocumento, file: File) {
    if (file.size > MAX_SIZE) {
      notificar.erro("Ficheiro demasiado grande", {
        descricao: `O limite é ${Math.round(MAX_SIZE / 1024 / 1024)} MB por documento.`,
      });
      return;
    }
    setUploadingTipo(tipo);
    const id = notificar.aCarregar(`A carregar ${TIPOS_DOCUMENTO_LABEL[tipo]}…`);
    try {
      const chassiSafe = (form.chassi || "novo").replace(/[^A-Za-z0-9_-]/g, "_");
      const { path, token } = await createDocUploadUrl({
        data: { chassi: chassiSafe, tipo, filename: file.name },
      });
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, file, {
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
      notificar.fechar(id);
      notificar.sucesso("Documento carregado", { descricao: file.name });
    } catch (err) {
      notificar.fechar(id);
      notificar.erro("Falha no carregamento", {
        descricao: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setUploadingTipo(null);
    }
  }

  async function handleRemove(doc: Documento) {
    try {
      await removeDoc({ data: { path: doc.path } });
    } catch {
      // remoção best-effort
    }
    setDocumentos((d) => d.filter((x) => x.path !== doc.path));
    notificar.info("Documento removido", { descricao: doc.nome });
  }

  async function openDoc(doc: Documento) {
    try {
      const { signedUrl } = await createDocReadUrl({ data: { path: doc.path } });
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      notificar.erro("Não foi possível abrir o documento", {
        descricao: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function submeter() {
    for (const idx of [0, 1, 4]) {
      if (!validarEtapa(idx)) {
        setStep(idx);
        return;
      }
    }
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
      proprietario_distrito: form.proprietario_distrito || null,
      proprietario_posto_admin: form.proprietario_posto_admin || null,
      numero_motor: form.numero_motor || null,
      proprietario_data_nascimento: form.proprietario_data_nascimento || null,
      proprietario_contacto_alt: form.proprietario_contacto_alt || null,
      proprietario_familiar_nome: form.proprietario_familiar_nome || null,
      proprietario_familiar_contacto: form.proprietario_familiar_contacto || null,
      proprietario_endereco: form.proprietario_endereco || null,
      data_compra: form.data_compra || null,
      local_compra: form.local_compra || null,
      estado: form.estado,
      preco_venda: form.preco_venda ? Number(form.preco_venda) : null,
      notas_internas: form.notas_internas || null,
      documentos,
    });
  }

  const postos = useMemo(
    () => getPostos(form.proprietario_provincia, form.proprietario_distrito),
    [form.proprietario_provincia, form.proprietario_distrito],
  );

  return (
    <MultiStepFormWrapper
      steps={STEPS}
      currentStep={step}
      onStepChange={setStep}
      onNextStep={() => validarEtapa(step)}
      onSubmit={submeter}
      isSubmitting={submitting || uploadingTipo !== null}
      submitLabel={submitLabel}
    >
      {step === 0 && (
        <CartaoSeccao
          titulo="Dados do motociclo"
          descricao="Identifique a viatura. O chassi é o identificador único e não pode repetir-se."
          icone={<Bike className="h-4.5 w-4.5" />}
        >
          <GrelhaCampos>
            <CampoTexto
              label="Chassi"
              obrigatorio
              icone={<Hash className="h-4 w-4" />}
              value={form.chassi}
              erro={erros.chassi}
              onChange={(e) => set("chassi", e.target.value.toUpperCase())}
              placeholder="LXYPCKL0XXXXXXXXX"
              className="font-mono sm:col-span-2"
            />
            <CampoTexto
              label="Matrícula"
              value={form.matricula}
              onChange={(e) => set("matricula", e.target.value.toUpperCase())}
              placeholder="AAA-123-MC"
            />
            <CampoTexto
              label="Número do motor"
              value={form.numero_motor}
              onChange={(e) => set("numero_motor", e.target.value.toUpperCase())}
            />
            <CampoTexto
              label="Marca"
              obrigatorio
              erro={erros.marca}
              value={form.marca}
              onChange={(e) => set("marca", e.target.value)}
              placeholder="Ex.: Haojue"
            />
            <CampoTexto
              label="Modelo"
              obrigatorio
              erro={erros.modelo}
              value={form.modelo}
              onChange={(e) => set("modelo", e.target.value)}
              placeholder="Ex.: HJ125-8"
            />
            <CampoTexto
              label="Ano"
              type="number"
              min={1950}
              max={2100}
              erro={erros.ano}
              value={form.ano}
              onChange={(e) => set("ano", e.target.value)}
              icone={<CalendarDays className="h-4 w-4" />}
            />
            <CampoTexto
              label="Cilindrada (cc)"
              type="number"
              value={form.cilindrada}
              onChange={(e) => set("cilindrada", e.target.value)}
              icone={<Gauge className="h-4 w-4" />}
            />
            <CampoTexto
              label="Cor"
              value={form.cor}
              onChange={(e) => set("cor", e.target.value)}
              icone={<Palette className="h-4 w-4" />}
            />
            <CampoTexto
              label="Quilometragem"
              type="number"
              min={0}
              value={form.km}
              onChange={(e) => set("km", e.target.value)}
            />
          </GrelhaCampos>
        </CartaoSeccao>
      )}

      {step === 1 && (
        <CartaoSeccao
          titulo="Dados do proprietário"
          descricao="Introduza os dados da pessoa responsável pelo motociclo."
          icone={<User className="h-4.5 w-4.5" />}
        >
          <GrelhaCampos>
            <CampoTexto
              label="Nome completo"
              obrigatorio
              erro={erros.proprietario_nome}
              value={form.proprietario_nome}
              onChange={(e) => set("proprietario_nome", e.target.value)}
              className="sm:col-span-2"
            />
            <CampoTexto
              label="BI / Identificação"
              value={form.proprietario_bi}
              onChange={(e) => set("proprietario_bi", e.target.value)}
            />
            <CampoTexto
              label="Contacto"
              value={form.proprietario_contacto}
              onChange={(e) => set("proprietario_contacto", e.target.value)}
              placeholder="+258 …"
              icone={<Phone className="h-4 w-4" />}
            />
            <CampoSelect
              label="Província"
              value={form.proprietario_provincia}
              icone={<MapPin className="h-4 w-4" />}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  proprietario_provincia: e.target.value,
                  proprietario_distrito: "",
                  proprietario_posto_admin: "",
                }))
              }
            >
              <option value="">—</option>
              {PROVINCIAS_MZ.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </CampoSelect>
            <CampoSelect
              label="Distrito / Município"
              value={form.proprietario_distrito}
              disabled={!form.proprietario_provincia}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  proprietario_distrito: e.target.value,
                  proprietario_posto_admin: "",
                }))
              }
            >
              <option value="">
                {form.proprietario_provincia ? "—" : "Escolha a província primeiro"}
              </option>
              {getDistritos(form.proprietario_provincia).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </CampoSelect>
            <CampoTexto
              label="Posto administrativo"
              value={form.proprietario_posto_admin}
              onChange={(e) => set("proprietario_posto_admin", e.target.value.slice(0, 100))}
              list="postos-admin-list"
              maxLength={100}
              hint="Escreva livremente ou escolha uma sugestão da lista oficial."
              placeholder={
                form.proprietario_distrito ? "Escreva ou escolha da lista" : "Escolha o distrito"
              }
            />
            <CampoTexto
              label="Localidade / Bairro"
              value={form.proprietario_localidade}
              onChange={(e) => set("proprietario_localidade", e.target.value)}
            />
          </GrelhaCampos>
          <datalist id="postos-admin-list">
            {postos.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </CartaoSeccao>
      )}

      {step === 2 && (
        <CartaoSeccao
          titulo="Segurança e aquisição"
          descricao="Estes dados permitem ao proprietário reportar a mota como roubada pelo telemóvel, sem criar conta. O código de recuperação é gerado automaticamente no fim do registo."
          icone={<ShieldCheck className="h-4.5 w-4.5" />}
        >
          <GrelhaCampos>
            <CampoTexto
              label="Data de nascimento"
              type="date"
              value={form.proprietario_data_nascimento}
              onChange={(e) => set("proprietario_data_nascimento", e.target.value)}
            />
            <CampoTexto
              label="Telefone alternativo"
              value={form.proprietario_contacto_alt}
              onChange={(e) => set("proprietario_contacto_alt", e.target.value)}
              placeholder="+258 …"
              icone={<Phone className="h-4 w-4" />}
            />
            <CampoTexto
              label="Familiar de referência"
              value={form.proprietario_familiar_nome}
              onChange={(e) => set("proprietario_familiar_nome", e.target.value)}
            />
            <CampoTexto
              label="Telefone do familiar"
              value={form.proprietario_familiar_contacto}
              onChange={(e) => set("proprietario_familiar_contacto", e.target.value)}
              placeholder="+258 …"
              icone={<Phone className="h-4 w-4" />}
            />
            <CampoTexto
              label="Data da compra"
              type="date"
              value={form.data_compra}
              onChange={(e) => set("data_compra", e.target.value)}
            />
            <CampoTexto
              label="Local da compra"
              value={form.local_compra}
              onChange={(e) => set("local_compra", e.target.value)}
              placeholder="Loja, feira, particular…"
            />
            <CampoTextarea
              label="Endereço completo"
              rows={3}
              value={form.proprietario_endereco}
              onChange={(e) => set("proprietario_endereco", e.target.value)}
              className="sm:col-span-2"
            />
          </GrelhaCampos>
        </CartaoSeccao>
      )}

      {step === 3 && (
        <CartaoSeccao
          titulo="Documentos"
          descricao="Carregue cópias do BI, carta de condução, livrete e outros documentos (PDF ou imagem, até 8 MB)."
          icone={<FileText className="h-4.5 w-4.5" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(TIPOS_DOCUMENTO_LABEL) as TipoDocumento[]).map((tipo) => (
              <label
                key={tipo}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-input bg-background px-3.5 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/4"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                  {uploadingTipo === tipo ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{TIPOS_DOCUMENTO_LABEL[tipo]}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {uploadingTipo === tipo ? "A carregar…" : "Escolher"}
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

          {documentos.length > 0 && (
            <ul className="mt-4 divide-y divide-border rounded-md border border-border">
              {documentos.map((doc) => (
                <li key={doc.path} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {TIPOS_DOCUMENTO_LABEL[doc.tipo]}
                      </span>
                      <span className="truncate text-sm font-medium">{doc.nome}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {(doc.tamanho / 1024).toFixed(0)} KB ·{" "}
                      {new Date(doc.carregado_em).toLocaleString("pt-PT")}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => void openDoc(doc)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(doc)}
                      aria-label="Remover documento"
                      className="rounded-md border border-destructive/30 px-2 py-1 text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CartaoSeccao>
      )}

      {step === 4 && (
        <CartaoSeccao
          titulo="Estado e mercado"
          descricao="Defina a situação actual do motociclo e, se aplicável, o preço de venda."
          icone={<Tag className="h-4.5 w-4.5" />}
        >
          <GrelhaCampos>
            <CampoSelect
              label="Estado"
              obrigatorio
              value={form.estado}
              onChange={(e) => set("estado", e.target.value as EstadoMoto)}
            >
              {(Object.keys(ESTADOS_LABEL) as EstadoMoto[]).map((s) => (
                <option key={s} value={s}>
                  {ESTADOS_LABEL[s]}
                </option>
              ))}
            </CampoSelect>
            <CampoTexto
              label="Preço de venda (MT)"
              type="number"
              obrigatorio={form.estado === "a_venda"}
              erro={erros.preco_venda}
              disabled={form.estado !== "a_venda"}
              value={form.preco_venda}
              onChange={(e) => set("preco_venda", e.target.value)}
              hint={
                form.estado === "a_venda" ? undefined : "Disponível apenas no estado “À venda”."
              }
            />
            <CampoTextarea
              label="Notas internas (não públicas)"
              rows={3}
              value={form.notas_internas}
              onChange={(e) => set("notas_internas", e.target.value)}
              className="sm:col-span-2"
            />
          </GrelhaCampos>
        </CartaoSeccao>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Revisao
            titulo="Dados do motociclo"
            icone={<Bike className="h-4.5 w-4.5" />}
            onEditar={() => setStep(0)}
            itens={[
              ["Chassi", form.chassi],
              ["Matrícula", form.matricula],
              ["Nº do motor", form.numero_motor],
              ["Marca", form.marca],
              ["Modelo", form.modelo],
              ["Ano", form.ano],
              ["Cilindrada", form.cilindrada ? `${form.cilindrada} cc` : ""],
              ["Cor", form.cor],
              ["Quilometragem", form.km ? `${form.km} km` : ""],
            ]}
          />
          <Revisao
            titulo="Proprietário"
            icone={<User className="h-4.5 w-4.5" />}
            onEditar={() => setStep(1)}
            itens={[
              ["Nome", form.proprietario_nome],
              ["BI", form.proprietario_bi],
              ["Contacto", form.proprietario_contacto],
              ["Província", form.proprietario_provincia],
              ["Distrito", form.proprietario_distrito],
              ["Posto administrativo", form.proprietario_posto_admin],
              ["Localidade", form.proprietario_localidade],
            ]}
          />
          <Revisao
            titulo="Segurança e aquisição"
            icone={<ShieldCheck className="h-4.5 w-4.5" />}
            onEditar={() => setStep(2)}
            itens={[
              ["Data de nascimento", form.proprietario_data_nascimento],
              ["Telefone alternativo", form.proprietario_contacto_alt],
              ["Familiar", form.proprietario_familiar_nome],
              ["Telefone do familiar", form.proprietario_familiar_contacto],
              ["Data da compra", form.data_compra],
              ["Local da compra", form.local_compra],
              ["Endereço", form.proprietario_endereco],
            ]}
          />
          <Revisao
            titulo="Documentos e estado"
            icone={<FileText className="h-4.5 w-4.5" />}
            onEditar={() => setStep(3)}
            itens={[
              ["Documentos carregados", documentos.length ? `${documentos.length}` : "0"],
              ["Estado", ESTADOS_LABEL[form.estado]],
              [
                "Preço de venda",
                form.preco_venda ? `${Number(form.preco_venda).toLocaleString("pt-PT")} MT` : "",
              ],
            ]}
          />
        </div>
      )}
    </MultiStepFormWrapper>
  );
}

function Revisao({
  titulo,
  icone,
  itens,
  onEditar,
}: {
  titulo: string;
  icone: React.ReactNode;
  itens: [string, string][];
  onEditar: () => void;
}) {
  return (
    <CartaoSeccao
      titulo={titulo}
      icone={icone}
      accao={
        <button
          type="button"
          onClick={onEditar}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
      }
    >
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {itens.map(([k, v]) => (
          <div key={k} className="min-w-0 border-b border-border/60 pb-2 last:border-b-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {k}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
              {v?.toString().trim() ? v : <span className="text-muted-foreground/60">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </CartaoSeccao>
  );
}
