import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Globe,
  Search,
  Bike,
  Building2,
  ShieldCheck,
  ShieldAlert,
  User,
  Phone,
  MapPin,
  Loader2,
  Info,
  Lock,
} from "lucide-react";
import { pesquisaNacional, type TipoPesquisa } from "@/lib/pesquisa.functions";
import { useSessao } from "@/hooks/use-sessao";

export const Route = createFileRoute("/_authenticated/pesquisa-nacional")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pesquisa Nacional — MotoGest" }] }),
  component: PesquisaNacionalPage,
});

function PesquisaNacionalPage() {
  const { sessao } = useSessao();
  const [termo, setTermo] = useState("");
  const [tipo, setTipo] = useState<TipoPesquisa>("chassi");

  const { data, isLoading, isFetched, refetch } = useQuery({
    queryKey: ["pesquisa-nacional", termo, tipo],
    queryFn: () => pesquisaNacional({ data: { termo, tipo } }),
    enabled: false,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
          <Globe className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesquisa Nacional de Veículos</h1>
          <p className="text-xs text-muted-foreground">
            Localizar qualquer motorizada registada em Moçambique independente do município de origem.
          </p>
        </div>
      </div>

      {/* Caixa de Pesquisa */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (termo.trim().length >= 2) refetch();
          }}
          className="space-y-4"
        >
          <div className="flex gap-2">
            {(["chassi", "matricula", "motor"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${
                  tipo === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "motor" ? "Nº Motor" : t}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                required
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder={`Digitar ${tipo === "motor" ? "número do motor" : tipo} completo ou parcial...`}
                className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || termo.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Pesquisar
            </button>
          </div>
        </form>
      </div>

      {/* Resultados */}
      {isFetched && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resultados Nacionais Encontrados ({data?.totalEncontrado ?? 0})
          </p>

          {(data?.resultados ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Info className="mx-auto h-8 w-8 opacity-40 mb-2" />
              Nenhum veículo encontrado no território nacional com este {tipo}.
            </div>
          ) : (
            (data?.resultados ?? []).map((m) => (
              <div key={m.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Bike className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">
                        {m.marca} {m.modelo}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">
                        Chassi: <strong className="text-foreground">{m.chassi}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Building2 className="h-3.5 w-3.5" />
                      {m.municipio_nome}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        m.estado === "roubada"
                          ? "bg-destructive text-white animate-pulse"
                          : m.estado === "activa"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.estado}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground">ESPECIFICAÇÕES DO VEÍCULO</p>
                    <p>
                      <strong>Matrícula:</strong> {m.matricula || "—"}
                    </p>
                    <p>
                      <strong>Nº Motor:</strong> {m.numero_motor || "—"}
                    </p>
                    <p>
                      <strong>Cor:</strong> {m.cor || "—"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground">MUNICÍPIO DE REGISTO</p>
                    <p className="font-semibold text-foreground">{m.municipio_nome}</p>
                    <p className="text-muted-foreground">
                      Registado em: {new Date(m.created_at).toLocaleDateString("pt-MZ")}
                    </p>
                  </div>

                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0">
                    <p className="font-bold text-muted-foreground">PROPRIETÁRIO</p>
                    {m.proprietario_nome ? (
                      <>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {m.proprietario_nome}
                        </p>
                        {m.proprietario_bi && <p><strong>BI:</strong> {m.proprietario_bi}</p>}
                        {m.proprietario_contacto && (
                          <p className="flex items-center gap-1 text-success">
                            <Phone className="h-3.5 w-3.5" />
                            {m.proprietario_contacto}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground/70 py-1">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Dados do proprietário omissos (Isolamento por Município)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
