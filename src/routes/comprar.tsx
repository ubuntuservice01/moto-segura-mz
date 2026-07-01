import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, Filter } from "lucide-react";
import { listMarketplace } from "@/lib/motos.functions";
import { MotoCard } from "@/components/moto-card";
import { PROVINCIAS_MZ } from "@/lib/moto-types";

export const Route = createFileRoute("/comprar")({
  head: () => ({
    meta: [
      { title: "Comprar Moto — Marketplace MotoVerify MZ" },
      { name: "description", content: "Motas verificadas à venda em Moçambique. Compre com confiança." },
      { property: "og:title", content: "Marketplace MotoVerify MZ" },
    ],
  }),
  component: ComprarPage,
});

function ComprarPage() {
  const [marca, setMarca] = useState("");
  const [provincia, setProvincia] = useState("");
  const [precoMax, setPrecoMax] = useState("");

  const { data: motos = [], isLoading } = useQuery({
    queryKey: ["marketplace", marca, provincia, precoMax],
    queryFn: () =>
      listMarketplace({
        data: {
          marca: marca || undefined,
          provincia: provincia || undefined,
          precoMax: precoMax ? Number(precoMax) : undefined,
        },
      }),
  });

  const marcasUnicas = Array.from(new Set(motos.map((m) => m.marca))).sort();

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
            <ShoppingBag className="h-7 w-7 text-accent-foreground" />
            Marketplace
          </h1>
          <p className="mt-2 text-muted-foreground">
            Motas verificadas pela Ubuntu Service, à venda em Moçambique.
          </p>
        </div>
        <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
          {motos.length} disponíveis
        </span>
      </header>

      {/* Filters */}
      <div className="mt-8 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
        <div className="flex items-center gap-2 md:col-span-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Filtros</span>
        </div>
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas as marcas</option>
          {marcasUnicas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas as províncias</option>
          {PROVINCIAS_MZ.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Preço máx. (MT)"
          value={precoMax}
          onChange={(e) => setPrecoMax(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="mt-10 text-center text-muted-foreground">A carregar…</p>
      ) : motos.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="text-base font-semibold">Nenhuma mota encontrada com estes filtros.</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente alargar a pesquisa.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {motos.map((m) => (
            <MotoCard key={m.id} moto={m} variant="marketplace" />
          ))}
        </div>
      )}
    </div>
  );
}
