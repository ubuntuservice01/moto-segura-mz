import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Trash2,
  Check,
  Copy,
  X,
  Loader2,
  Filter,
  Shield,
  Building2,
  Mail,
  Lock,
} from "lucide-react";
import {
  listUtilizadores,
  listMunicipios,
  criarUtilizador,
  eliminarUtilizador,
  type UtilizadorPlataforma,
} from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/ubuntu/utilizadores")({
  ssr: false,
  head: () => ({ meta: [{ title: "Utilizadores — Ubuntu Service" }] }),
  component: UtilizadoresPage,
});

const PAPEL_LABEL: Record<string, string> = {
  super_admin: "Super Admin (Ubuntu Service)",
  admin_municipal: "Administrador Municipal",
  tecnico_municipal: "Técnico Municipal",
  policia: "Polícia",
};

const PAPEL_BADGE: Record<string, string> = {
  super_admin: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  admin_municipal: "bg-primary/10 text-primary border-primary/20",
  tecnico_municipal: "bg-secondary/10 text-secondary border-secondary/20",
  policia: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

function UtilizadoresPage() {
  const qc = useQueryClient();
  const [municipioFiltro, setMunicipioFiltro] = useState<string>("");
  const [modalCriar, setModalCriar] = useState(false);
  const [credencialNova, setCredencialNova] = useState<{ email: string; palavraPasse: string } | null>(null);

  const { data: municipios } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => listMunicipios(),
  });

  const { data: utilizadores, isLoading } = useQuery({
    queryKey: ["utilizadores", municipioFiltro],
    queryFn: () => listUtilizadores({ data: { municipioId: municipioFiltro || undefined } }),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => eliminarUtilizador({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["utilizadores"] });
      toast.success("Utilizador eliminado.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilizadores da Plataforma</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerir administradores, técnicos e agentes da polícia de todos os municípios.
          </p>
        </div>
        <button
          onClick={() => setModalCriar(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Novo Utilizador
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">Filtrar por Município:</span>
        <select
          value={municipioFiltro}
          onChange={(e) => setMunicipioFiltro(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="">Todos os Municípios</option>
          {(municipios ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
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
                <th className="px-4 py-3">Nome / Email</th>
                <th className="px-4 py-3">Papel</th>
                <th className="hidden px-4 py-3 sm:table-cell">Município</th>
                <th className="hidden px-4 py-3 md:table-cell">Data de Registo</th>
                <th className="px-4 py-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(utilizadores ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              )}
              {(utilizadores ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {u.nome[0] || "U"}
                      </div>
                      <div>
                        <p className="font-semibold">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">{u.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        PAPEL_BADGE[u.papel] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {PAPEL_LABEL[u.papel] ?? u.papel}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {u.municipio ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {u.municipio}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground/60">Global (Ubuntu)</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {new Date(u.created_at).toLocaleDateString("pt-MZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Tem a certeza que deseja eliminar o utilizador "${u.nome}"?`)) {
                          eliminar.mutate(u.id);
                        }
                      }}
                      title="Eliminar Utilizador"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar Utilizador */}
      {modalCriar && (
        <ModalCriarUtilizador
          onClose={() => setModalCriar(false)}
          onCriado={(creds) => {
            setModalCriar(false);
            setCredencialNova(creds);
            qc.invalidateQueries({ queryKey: ["utilizadores"] });
          }}
        />
      )}

      {/* Modal Mostrar Credencial */}
      {credencialNova && (
        <ModalCredencialNova
          credencial={credencialNova}
          onClose={() => setCredencialNova(null)}
        />
      )}
    </div>
  );
}

function ModalCriarUtilizador({
  onClose,
  onCriado,
}: {
  onClose: () => void;
  onCriado: (creds: { email: string; palavraPasse: string }) => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    papel: "tecnico_municipal" as "super_admin" | "admin_municipal" | "tecnico_municipal" | "policia",
    municipioId: "",
    palavraPasse: "",
  });

  const { data: municipios } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => listMunicipios(),
  });

  const criar = useMutation({
    mutationFn: () =>
      criarUtilizador({
        data: {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || null,
          papel: form.papel,
          municipioId: form.papel === "super_admin" ? null : form.municipioId || null,
          palavraPasse: form.palavraPasse || undefined,
        },
      }),
    onSuccess: (res) => onCriado(res),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Criar Utilizador</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
          className="space-y-4 text-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold">Nome Completo *</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Ex: João Sitoe"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="nome@dominio.mz"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Telefone</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="+258 8x xxx xxxx"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Papel / Função *</label>
            <select
              value={form.papel}
              onChange={(e) => setForm((p) => ({ ...p, papel: e.target.value as any }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="tecnico_municipal">Técnico Municipal</option>
              <option value="admin_municipal">Administrador Municipal</option>
              <option value="policia">Polícia</option>
              <option value="super_admin">Super Administrador (Ubuntu Service)</option>
            </select>
          </div>

          {form.papel !== "super_admin" && (
            <div>
              <label className="mb-1 block text-xs font-semibold">Município *</label>
              <select
                required
                value={form.municipioId}
                onChange={(e) => setForm((p) => ({ ...p, municipioId: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Seleccione o Município...</option>
                {(municipios ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Palavra-passe (Opcional — gerada automaticamente se vazia)
            </label>
            <input
              type="password"
              minLength={8}
              value={form.palavraPasse}
              onChange={(e) => setForm((p) => ({ ...p, palavraPasse: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Mínimo 8 caracteres"
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
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Criar Utilizador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalCredencialNova({
  credencial,
  onClose,
}: {
  credencial: { email: string; palavraPasse: string };
  onClose: () => void;
}) {
  const copiar = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copiado!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 mb-2">
            <Check className="h-5 w-5 text-success" />
          </div>
          <h2 className="text-lg font-bold">Utilizador Criado!</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Partilhe estas credenciais de forma segura com o utilizador.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-xs font-mono truncate">{credencial.email}</span>
            </div>
            <button onClick={() => copiar(credencial.email)} className="rounded p-1 hover:bg-muted">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-xs font-mono truncate">{credencial.palavraPasse}</span>
            </div>
            <button onClick={() => copiar(credencial.palavraPasse)} className="rounded p-1 hover:bg-muted">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
