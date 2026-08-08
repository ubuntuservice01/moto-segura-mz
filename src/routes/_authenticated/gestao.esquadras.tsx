import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Building2,
  Phone,
  UserCheck,
  Check,
  X,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/use-sessao";
import { criarUtilizador } from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/gestao/esquadras")({
  ssr: false,
  head: () => ({ meta: [{ title: "Esquadras da Polícia — MotoGest" }] }),
  component: EsquadrasPage,
});

type Esquadra = {
  id: string;
  municipio_id: string;
  nome: string;
  endereco: string | null;
  contacto: string | null;
  responsavel: string | null;
  activa: boolean;
  created_at: string;
};

function EsquadrasPage() {
  const qc = useQueryClient();
  const { sessao } = useSessao();
  const [modalEsquadra, setModalEsquadra] = useState(false);
  const [modalPolicia, setModalPolicia] = useState<Esquadra | null>(null);

  const { data: esquadras, isLoading } = useQuery({
    queryKey: ["esquadras", sessao?.municipioId],
    queryFn: async () => {
      if (!sessao?.municipioId) return [];
      const { data, error } = await supabase
        .from("esquadras")
        .select("*")
        .eq("municipio_id", sessao.municipioId)
        .order("nome");
      if (error) throw new Error(error.message);
      return (data ?? []) as Esquadra[];
    },
    enabled: !!sessao?.municipioId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Esquadras da Polícia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerir esquadras e agentes da Polícia de Moçambique no{" "}
            {sessao?.municipio?.nome || "Município"}.
          </p>
        </div>
        <button
          onClick={() => setModalEsquadra(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nova Esquadra
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(esquadras ?? []).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Nenhuma esquadra registada neste município.
            </div>
          )}
          {(esquadras ?? []).map((eq) => (
            <div key={eq.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{eq.nome}</h3>
                    <span className="text-[10px] text-muted-foreground">
                      {eq.endereco || "Sem endereço"}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    eq.activa ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {eq.activa ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {eq.contacto && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {eq.contacto}
                  </p>
                )}
                {eq.responsavel && (
                  <p className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    Responsável: {eq.responsavel}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  onClick={() => setModalPolicia(eq)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <UserPlus className="h-3.5 w-3.5 text-amber-600" />
                  Criar Utilizador Polícia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Esquadra */}
      {modalEsquadra && (
        <ModalNovaEsquadra
          municipioId={sessao?.municipioId!}
          onClose={() => setModalEsquadra(false)}
          onSucesso={() => {
            setModalEsquadra(false);
            qc.invalidateQueries({ queryKey: ["esquadras"] });
          }}
        />
      )}

      {/* Modal Criar Utilizador Policia */}
      {modalPolicia && (
        <ModalCriarPolicia
          esquadra={modalPolicia}
          municipioId={sessao?.municipioId!}
          onClose={() => setModalPolicia(null)}
        />
      )}
    </div>
  );
}

function ModalNovaEsquadra({
  municipioId,
  onClose,
  onSucesso,
}: {
  municipioId: string;
  onClose: () => void;
  onSucesso: () => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    endereco: "",
    contacto: "",
    responsavel: "",
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("esquadras").insert({
        municipio_id: municipioId,
        nome: form.nome,
        endereco: form.endereco || null,
        contacto: form.contacto || null,
        responsavel: form.responsavel || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Esquadra criada com sucesso.");
      onSucesso();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Nova Esquadra</h2>
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
            <label className="mb-1 block text-xs font-semibold">Nome da Esquadra *</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Ex: Esquadra Central"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Endereço</label>
            <input
              value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Ex: Bairro Central, Av. Eduardo Mondlane"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Contacto</label>
            <input
              value={form.contacto}
              onChange={(e) => setForm((p) => ({ ...p, contacto: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Responsável / Comandante</label>
            <input
              value={form.responsavel}
              onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
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
              {criar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Criar Esquadra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalCriarPolicia({
  esquadra,
  municipioId,
  onClose,
}: {
  esquadra: Esquadra;
  municipioId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    palavraPasse: "",
  });
  const [credencial, setCredencial] = useState<{ email: string; palavraPasse: string } | null>(
    null,
  );

  const criar = useMutation({
    mutationFn: () =>
      criarUtilizador({
        data: {
          nome: form.nome,
          email: form.email,
          papel: "policia",
          municipioId,
          esquadraId: esquadra.id,
          palavraPasse: form.palavraPasse || undefined,
        },
      }),
    onSuccess: (res) => {
      setCredencial(res);
      toast.success("Agente da Polícia criado com sucesso!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Criar Utilizador Polícia</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Associado à <strong>{esquadra.nome}</strong>.
        </p>

        {credencial ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-bold text-success mb-2 font-mono">
                Credenciais de Acesso:
              </p>
              <p className="text-xs font-mono">Email: {credencial.email}</p>
              <p className="text-xs font-mono">Palavra-passe: {credencial.palavraPasse}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              Concluído
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              criar.mutate();
            }}
            className="space-y-3 text-sm"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Nome do Agente / Operador *
              </label>
              <input
                required
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Ex: Agente Armando Macamo"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email de Acesso *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="policia.esquadra@motogest.mz"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Palavra-passe (opcional)</label>
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
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {criar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Criar Acesso Polícia
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
