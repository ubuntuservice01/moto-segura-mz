import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2, PlusCircle } from "lucide-react";
import { searchMotosByChassi } from "@/lib/motos.functions";
import { MotoCard } from "@/components/moto-card";
import { PreRegistoForm } from "@/components/pre-registo-form";
import type { MotoPublica } from "@/lib/moto-types";

export const Route = createFileRoute("/verificar/")({
  head: () => ({
    meta: [
      { title: "Verificar Chassi — MotoCheck MZ" },
      { name: "description", content: "Pesquise o chassi de qualquer mota registada em Moçambique." },
      { property: "og:title", content: "Verificar Chassi — MotoCheck MZ" },
      { property: "og:description", content: "Consulte o estado e histórico de qualquer mota registada em Moçambique." },
    ],
  }),
  component: VerificarPage,
});

function VerificarPage() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const [results, setResults] = useState<MotoPublica[] | null>(null);
  const [mostrarPreRegisto, setMostrarPreRegisto] = useState(false);

  const mut = useMutation({
    mutationFn: (query: string) => searchMotosByChassi({ data: { q: query } }),
    onSuccess: (data) => {
      setResults(data);
      setMostrarPreRegisto(false);
      if (data.length === 1) {
        navigate({ to: "/verificar/$chassi", params: { chassi: data[0]!.chassi } });
      }
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length >= 2) mut.mutate(q.trim());
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Verificar chassi</h1>
        <p className="mt-3 text-muted-foreground">
          Introduza qualquer parte do chassi (mínimo 2 caracteres) para encontrar a mota.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mt-8">
        <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-card p-2 shadow-[var(--shadow-card)] focus-within:border-secondary">
          <Search className="ml-3 h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value.toUpperCase())}
            placeholder="Ex: LBPKE1408 ou MD2A21BZ"
            className="flex-1 bg-transparent px-2 py-3 font-mono text-base outline-none placeholder:text-muted-foreground/60"
            autoFocus
          />
          <button
            type="submit"
            disabled={mut.isPending || q.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Verificar
          </button>
        </div>
      </form>

      {mut.isError && (
        <div className="mt-6 rounded-lg border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao pesquisar. Tente novamente.
        </div>
      )}

      {results && results.length === 0 && (
        <div className="mt-10 space-y-4">
          <div className="rounded-xl border border-dashed bg-card p-8 text-center">
            <p className="text-base font-semibold">Nenhuma mota encontrada com "{q}".</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirme o número do chassi e tente novamente. Se a mota ainda não está no
              sistema, pode fazer um pré-registo para revisão pelo operador Ubuntu Service.
            </p>
            {!mostrarPreRegisto && (
              <button
                onClick={() => setMostrarPreRegisto(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4" />
                Fazer pré-registo
              </button>
            )}
          </div>

          {mostrarPreRegisto && (
            <PreRegistoForm
              chassiInicial={q}
              onSuccess={() => {
                /* keeps the confirmation card visible */
              }}
            />
          )}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {results.length} resultado{results.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((m) => (
              <MotoCard key={m.id} moto={m} variant="resultado" />
            ))}
          </div>
        </div>
      )}

      {!results && !mut.isPending && (
        <div className="mt-12 rounded-xl bg-card p-8 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Como funciona
          </h2>
          <ol className="mx-auto mt-4 grid max-w-xl gap-3 text-left text-sm">
            <li>1. Localize o chassi na sua mota (geralmente no quadro, sob o assento).</li>
            <li>2. Introduza pelo menos 2 caracteres consecutivos.</li>
            <li>3. Veja a ficha completa, histórico e estado actual.</li>
          </ol>
          <Link to="/" className="mt-6 inline-block text-sm font-semibold text-secondary hover:underline">
            ← Voltar ao início
          </Link>
        </div>
      )}
    </div>
  );
}
