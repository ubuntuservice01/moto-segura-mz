import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Check,
  Copy,
  X,
  Loader2,
  ChevronDown,
  Globe,
  Phone,
  Mail,
} from "lucide-react";
import {
  listMunicipios,
  criarMunicipio,
  actualizarMunicipio,
  alterarEstadoMunicipio,
  eliminarMunicipio,
  type Municipio,
} from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/ubuntu/municipios")({
  ssr: false,
  head: () => ({ meta: [{ title: "Municípios — Ubuntu Service" }] }),
  component: MunicipiosPage,
});

const PROVINCIAS_MZ = [
  "Cabo Delgado",
  "Gaza",
  "Inhambane",
  "Manica",
  "Maputo",
  "Nampula",
  "Niassa",
  "Sofala",
  "Tete",
  "Zambézia",
  "Cidade de Maputo",
];

const PLANO_COR: Record<string, string> = {
  base: "bg-muted text-muted-foreground",
  standard: "bg-primary/10 text-primary",
  premium: "bg-secondary/10 text-secondary",
};

function MunicipiosPage() {
  const qc = useQueryClient();
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<Municipio | null>(null);
  const [credenciais, setCredenciais] = useState<
    { papel: string; email: string; palavraPasse: string }[] | null
  >(null);

  const { data: municipios, isLoading } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => listMunicipios(),
    staleTime: 30_000,
  });

  const mudarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: "activo" | "suspenso" }) =>
      alterarEstadoMunicipio({ data: { id, estado } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["municipios"] });
      toast.success("Estado actualizado.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => eliminarMunicipio({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["municipios"] });
      toast.success("Município eliminado.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="page-header flex-row items-center justify-between">
        <div>
          <h1 className="page-title">Municípios</h1>
          <p className="page-subtitle">
            Gestão de municípios e subscrições da plataforma.
          </p>
        </div>
        <button
          onClick={() => setModalCriar(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
        >
          <Plus className="h-4 w-4" />
          Novo Município
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mg-table-wrapper">
          <table className="mg-table">
            <thead>
              <tr>
                <th>Município</th>
                <th className="hidden sm:table-cell">Província</th>
                <th className="hidden md:table-cell">Plano</th>
                <th>Estado</th>
                <th className="text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {(municipios ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Nenhum município criado ainda.
                  </td>
                </tr>
              )}
              {(municipios ?? []).map((m) => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: m.cor_principal }}
                      >
                        {m.nome[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{m.nome}</p>
                        <p className="text-xs text-muted-foreground">{m.nome_plataforma ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {m.provincia}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PLANO_COR[m.licenca_plano] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {m.licenca_plano}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        m.estado === "activo"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {m.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModalEditar(m)}
                        title="Editar"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          mudarEstado.mutate({
                            id: m.id,
                            estado: m.estado === "activo" ? "suspenso" : "activo",
                          })
                        }
                        title={m.estado === "activo" ? "Suspender" : "Activar"}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {m.estado === "activo" ? (
                          <ToggleRight className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Eliminar "${m.nome}"? Esta acção é irreversível e só funciona se não existirem motorizadas.`,
                            )
                          )
                            eliminar.mutate(m.id);
                        }}
                        title="Eliminar"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar */}
      {modalCriar && (
        <ModalCriarMunicipio
          onClose={() => setModalCriar(false)}
          onCriado={(creds) => {
            setModalCriar(false);
            setCredenciais(creds);
            qc.invalidateQueries({ queryKey: ["municipios"] });
          }}
        />
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <ModalEditarMunicipio
          municipio={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={() => {
            setModalEditar(null);
            qc.invalidateQueries({ queryKey: ["municipios"] });
          }}
        />
      )}

      {/* Modal Credenciais */}
      {credenciais && (
        <ModalCredenciais credenciais={credenciais} onClose={() => setCredenciais(null)} />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Modal Criar Município
// ────────────────────────────────────────────────
function ModalCriarMunicipio({
  onClose,
  onCriado,
}: {
  onClose: () => void;
  onCriado: (creds: { papel: string; email: string; palavraPasse: string }[]) => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    provincia: "Niassa",
    distrito: "",
    endereco: "",
    contacto: "",
    contacto_alt: "",
    email: "",
    website: "",
    logo_url: "",
    brasao_url: "",
    cor_principal: "#006633",
    cor_secundaria: "#FAF92A",
    nome_plataforma: "",
    licenca_plano: "base",
    licenca_validade: "",
    notas: "",
  });
  const [secao, setSecao] = useState<"institucional" | "visual">("institucional");

  const criar = useMutation({
    mutationFn: () =>
      criarMunicipio({
        data: {
          ...form,
          email: form.email || null,
          distrito: form.distrito || null,
          endereco: form.endereco || null,
          contacto: form.contacto || null,
          contacto_alt: form.contacto_alt || null,
          website: form.website || null,
          logo_url: form.logo_url || null,
          brasao_url: form.brasao_url || null,
          nome_plataforma: form.nome_plataforma || null,
          licenca_validade: form.licenca_validade || null,
          notas: form.notas || null,
        },
      }),
    onSuccess: (r) => onCriado(r.credenciais),
    onError: (e) => toast.error((e as Error).message),
  });

  const f =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Novo Município</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Serão criados automaticamente um Administrador e um Técnico Municipal.
          </p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 mb-5">
        {(["institucional", "visual"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSecao(s)}
            className={`flex-1 rounded-md py-1.5 text-xs font-bold capitalize transition-colors ${
              secao === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {s === "institucional" ? "Dados Institucionais" : "Identidade Visual"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          criar.mutate();
        }}
        className="space-y-3"
      >
        {secao === "institucional" ? (
          <>
            <Campo label="Nome do Município *" required>
              <input
                required
                value={form.nome}
                onChange={f("nome")}
                className={INPUT}
                placeholder="Município de Lichinga"
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Província *" required>
                <select required value={form.provincia} onChange={f("provincia")} className={INPUT}>
                  {PROVINCIAS_MZ.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Campo>
              <Campo label="Distrito">
                <input value={form.distrito} onChange={f("distrito")} className={INPUT} />
              </Campo>
            </div>
            <Campo label="Endereço">
              <input value={form.endereco} onChange={f("endereco")} className={INPUT} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Contacto principal">
                <input
                  value={form.contacto}
                  onChange={f("contacto")}
                  className={INPUT}
                  placeholder="+258 8x xxx xxxx"
                />
              </Campo>
              <Campo label="Contacto alternativo">
                <input value={form.contacto_alt} onChange={f("contacto_alt")} className={INPUT} />
              </Campo>
            </div>
            <Campo label="Email institucional">
              <input
                type="email"
                value={form.email}
                onChange={f("email")}
                className={INPUT}
                placeholder="geral@municipio.gov.mz"
              />
            </Campo>
            <Campo label="Website">
              <input
                type="url"
                value={form.website}
                onChange={f("website")}
                className={INPUT}
                placeholder="https://municipio.gov.mz"
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Plano de licença">
                <select value={form.licenca_plano} onChange={f("licenca_plano")} className={INPUT}>
                  <option value="base">Base</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </Campo>
              <Campo label="Validade da licença">
                <input
                  type="date"
                  value={form.licenca_validade}
                  onChange={f("licenca_validade")}
                  className={INPUT}
                />
              </Campo>
            </div>
            <Campo label="Notas internas">
              <textarea value={form.notas} onChange={f("notas")} rows={2} className={INPUT} />
            </Campo>
          </>
        ) : (
          <>
            <Campo label="Nome da plataforma">
              <input
                value={form.nome_plataforma}
                onChange={f("nome_plataforma")}
                className={INPUT}
                placeholder={`MotoGest ${form.nome || "Município"}`}
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Cor principal">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.cor_principal}
                    onChange={f("cor_principal")}
                    className="h-9 w-12 cursor-pointer rounded-md border p-0.5"
                  />
                  <input
                    value={form.cor_principal}
                    onChange={f("cor_principal")}
                    className={`${INPUT} flex-1`}
                  />
                </div>
              </Campo>
              <Campo label="Cor secundária">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.cor_secundaria}
                    onChange={f("cor_secundaria")}
                    className="h-9 w-12 cursor-pointer rounded-md border p-0.5"
                  />
                  <input
                    value={form.cor_secundaria}
                    onChange={f("cor_secundaria")}
                    className={`${INPUT} flex-1`}
                  />
                </div>
              </Campo>
            </div>
            <Campo label="URL do Logótipo">
              <input
                value={form.logo_url}
                onChange={f("logo_url")}
                className={INPUT}
                placeholder="https://..."
              />
            </Campo>
            <Campo label="URL do Brasão (opcional)">
              <input
                value={form.brasao_url}
                onChange={f("brasao_url")}
                className={INPUT}
                placeholder="https://..."
              />
            </Campo>
            {/* Preview */}
            <div
              className="mt-2 rounded-xl border p-4 text-center"
              style={{ borderColor: form.cor_principal }}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Pré-visualização
              </p>
              <div
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold text-white"
                style={{ backgroundColor: form.cor_principal }}
              >
                {form.nome_plataforma || `MotoGest ${form.nome || "Município"}`}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>
            Cancelar
          </button>
          {secao === "institucional" ? (
            <button type="button" onClick={() => setSecao("visual")} className={BTN_PRIMARY}>
              Seguinte <ChevronDown className="h-3 w-3 -rotate-90" />
            </button>
          ) : (
            <button type="submit" disabled={criar.isPending} className={BTN_PRIMARY}>
              {criar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Criar Município
            </button>
          )}
        </div>
      </form>
    </Overlay>
  );
}

// ────────────────────────────────────────────────
// Modal Editar Município
// ────────────────────────────────────────────────
function ModalEditarMunicipio({
  municipio,
  onClose,
  onGuardado,
}: {
  municipio: Municipio;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState({
    nome: municipio.nome,
    provincia: municipio.provincia,
    distrito: municipio.distrito ?? "",
    endereco: municipio.endereco ?? "",
    contacto: municipio.contacto ?? "",
    email: municipio.email ?? "",
    website: municipio.website ?? "",
    logo_url: municipio.logo_url ?? "",
    cor_principal: municipio.cor_principal,
    cor_secundaria: municipio.cor_secundaria,
    nome_plataforma: municipio.nome_plataforma ?? "",
    licenca_plano: municipio.licenca_plano,
    licenca_validade: municipio.licenca_validade ?? "",
    notas: municipio.notas ?? "",
  });

  const guardar = useMutation({
    mutationFn: () =>
      actualizarMunicipio({
        data: {
          id: municipio.id,
          patch: {
            ...form,
            email: form.email || null,
            distrito: form.distrito || null,
            endereco: form.endereco || null,
            contacto: form.contacto || null,
            website: form.website || null,
            logo_url: form.logo_url || null,
            nome_plataforma: form.nome_plataforma || null,
            licenca_validade: form.licenca_validade || null,
            notas: form.notas || null,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Município actualizado.");
      onGuardado();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const f =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">Editar — {municipio.nome}</h2>
        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="space-y-3"
      >
        <Campo label="Nome do Município">
          <input value={form.nome} onChange={f("nome")} className={INPUT} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Província">
            <select value={form.provincia} onChange={f("provincia")} className={INPUT}>
              {PROVINCIAS_MZ.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Distrito">
            <input value={form.distrito} onChange={f("distrito")} className={INPUT} />
          </Campo>
        </div>
        <Campo label="Endereço">
          <input value={form.endereco} onChange={f("endereco")} className={INPUT} />
        </Campo>
        <Campo label="Contacto">
          <input value={form.contacto} onChange={f("contacto")} className={INPUT} />
        </Campo>
        <Campo label="Email">
          <input type="email" value={form.email} onChange={f("email")} className={INPUT} />
        </Campo>
        <Campo label="Website">
          <input value={form.website} onChange={f("website")} className={INPUT} />
        </Campo>
        <Campo label="URL do Logótipo">
          <input value={form.logo_url} onChange={f("logo_url")} className={INPUT} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cor principal">
            <div className="flex gap-2">
              <input
                type="color"
                value={form.cor_principal}
                onChange={f("cor_principal")}
                className="h-9 w-12 cursor-pointer rounded-md border p-0.5"
              />
              <input
                value={form.cor_principal}
                onChange={f("cor_principal")}
                className={`${INPUT} flex-1`}
              />
            </div>
          </Campo>
          <Campo label="Cor secundária">
            <div className="flex gap-2">
              <input
                type="color"
                value={form.cor_secundaria}
                onChange={f("cor_secundaria")}
                className="h-9 w-12 cursor-pointer rounded-md border p-0.5"
              />
              <input
                value={form.cor_secundaria}
                onChange={f("cor_secundaria")}
                className={`${INPUT} flex-1`}
              />
            </div>
          </Campo>
        </div>
        <Campo label="Nome da plataforma">
          <input value={form.nome_plataforma} onChange={f("nome_plataforma")} className={INPUT} />
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>
            Cancelar
          </button>
          <button type="submit" disabled={guardar.isPending} className={BTN_PRIMARY}>
            {guardar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Guardar
          </button>
        </div>
      </form>
    </Overlay>
  );
}

// ────────────────────────────────────────────────
// Modal Credenciais
// ────────────────────────────────────────────────
function ModalCredenciais({
  credenciais,
  onClose,
}: {
  credenciais: { papel: string; email: string; palavraPasse: string }[];
  onClose: () => void;
}) {
  const copiar = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copiado!");
  };

  return (
    <Overlay onClose={onClose}>
      <div className="mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 mb-3">
          <Check className="h-5 w-5 text-success" />
        </div>
        <h2 className="text-lg font-bold">Município criado com sucesso!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Guarde as credenciais abaixo. A palavra-passe <strong>não será mostrada novamente</strong>
          .
        </p>
      </div>
      <div className="space-y-4">
        {credenciais.map((c) => (
          <div key={c.papel} className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {c.papel}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm font-mono truncate">{c.email}</span>
                </div>
                <button
                  onClick={() => copiar(c.email)}
                  className="flex-shrink-0 rounded p-1 hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm font-mono truncate">{c.palavraPasse}</span>
                </div>
                <button
                  onClick={() => copiar(c.palavraPasse)}
                  className="flex-shrink-0 rounded p-1 hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClose} className={`${BTN_PRIMARY} w-full mt-5`}>
        Fechar
      </button>
    </Overlay>
  );
}

// ────────────────────────────────────────────────
// Utilitários UI
// ────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

const INPUT =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity";
const BTN_GHOST =
  "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors";
