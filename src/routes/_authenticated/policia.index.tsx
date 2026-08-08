import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  Bike,
  ShieldAlert,
  ShieldCheck,
  Phone,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/use-sessao";

export const Route = createFileRoute("/_authenticated/policia/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Consulta & Fiscalização — Polícia MotoGest" }] }),
  component: PoliciaIndexPage,
});

type MotoDetalhe = {
  id: string;
  chassi: string;
  matricula: string | null;
  numero_motor: string | null;
  marca: string;
  modelo: string;
  cor: string | null;
  ano: number | null;
  cilindrada: number | null;
  estado: string;
  proprietario_nome: string;
  proprietario_bi: string | null;
  proprietario_contacto: string | null;
  proprietario_endereco: string | null;
  created_at: string;
};

function PoliciaIndexPage() {
  const { sessao } = useSessao();
  const [termo, setTermo] = useState("");
  const [tipo, setTipo] = useState<"chassi" | "matricula" | "motor">("chassi");

  const { data: motas, isLoading, refetch } = useQuery({
    queryKey: ["policia-pesquisa-local", termo, tipo, sessao?.municipioId],
    queryFn: async () => {
      if (!termo || !sessao?.municipioId) return [];
      const campo = tipo === "chassi" ? "chassi" : tipo === "matricula" ? "matricula" : "numero_motor";
      const { data, error } = await supabase
        .from("motos")
        .select("*")
        .eq("municipio_id", sessao.municipioId)
        .ilike(campo, `%${termo.toUpperCase()}%`)
        .limit(10);

      if (error) throw new Error(error.message);
      return (data ?? []) as MotoDetalhe[];
    },
    enabled: false,
  });

  return (
    <div className="space-y-6">
      {/* Barra de Pesquisa */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-base font-bold mb-1">Fiscalização de Veículo no Município</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Insira o Chassi, Matrícula ou Número do Motor para visualizar a ficha completa do veículo e proprietário.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (termo.trim()) refetch();
          }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            {(["chassi", "matricula", "motor"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                  tipo === t
                    ? "bg-amber-600 text-white"
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
                placeholder={`Digitar ${tipo === "motor" ? "número do motor" : tipo}...`}
                className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-600 font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Pesquisar
            </button>
          </div>
        </form>
      </div>

      {/* Resultados */}
      {motas && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resultados Encontrados ({motas.length})
          </p>

          {motas.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Nenhuma motorizada encontrada no município com estes dados.
            </div>
          ) : (
            motas.map((m) => (
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

                  <span
                    className={`self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      m.estado === "roubada"
                        ? "bg-destructive text-white animate-pulse"
                        : m.estado === "activa"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.estado === "roubada" ? "⚠️ VEÍCULO ROUBADO" : m.estado}
                  </span>
                </div>

                {/* Grelha de Informações */}
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
                    <p>
                      <strong>Cilindrada / Ano:</strong> {m.cilindrada || "—"} ({m.ano || "—"})
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground">DADOS DO PROPRIETÁRIO</p>
                    <p className="flex items-center gap-1 font-semibold text-foreground">
                      <User className="h-3.5 w-3.5" />
                      {m.proprietario_nome}
                    </p>
                    <p>
                      <strong>BI / NUIT:</strong> {m.proprietario_bi}
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-success" />
                      <strong>Contacto:</strong> {m.proprietario_contacto}
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {m.proprietario_endereco || "Sem morada"}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between gap-2 border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0">
                    <div>
                      <p className="font-bold text-muted-foreground">REGISTO MUNICIPAL</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Registado em: {new Date(m.created_at).toLocaleDateString("pt-MZ")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Link
                        to="/policia/ocorrencias"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Registar Ocorrência
                      </Link>
                    </div>
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
