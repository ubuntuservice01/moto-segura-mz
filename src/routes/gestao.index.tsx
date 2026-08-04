import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { listAllMotos, getStats } from "@/lib/motos.functions";
import { MotoCard } from "@/components/moto-card";
import { MarcarRoubadaButton } from "@/components/marcar-roubada-button";
import { ESTADOS_LABEL, type EstadoMoto } from "@/lib/moto-types";

export const Route = createFileRoute("/gestao/")({
  component: GestaoIndex,
});

function GestaoIndex() {
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState<string>("todos");

  const { data: motos = [], isLoading } = useQuery({
    queryKey: ["motos", busca, estado],
    queryFn: () => listAllMotos({ data: { busca, estado } }),
  });
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => getStats() });

  return (
    <div className="space-y-8">
      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Activas" value={stats.activas} tone="secondary" />
          <StatCard label="À venda" value={stats.aVenda} tone="accent" />
          <StatCard label="Roubadas" value={stats.roubadas} tone="destructive" />
          <StatCard label="Eventos" value={stats.eventos} />
        </div>
      )}

      {stats && stats.porMarca.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Distribuição por marca
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.porMarca}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="marca" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-3 min-w-60">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar por chassi, matrícula, proprietário…"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos os estados</option>
          {(Object.keys(ESTADOS_LABEL) as EstadoMoto[]).map((s) => (
            <option key={s} value={s}>{ESTADOS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-center text-muted-foreground">A carregar…</p>
      ) : motos.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm">
          Nenhuma mota corresponde aos filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {motos.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <MotoCard moto={m} variant="gestao" />
              <MarcarRoubadaButton
                motoId={m.id}
                chassi={m.chassi}
                disabled={m.estado === "roubada"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, tone,
}: { label: string; value: number; tone?: "secondary" | "accent" | "destructive" }) {
  const colors =
    tone === "secondary" ? "border-secondary/30 bg-secondary/5 text-secondary"
    : tone === "accent" ? "border-accent/40 bg-accent/10 text-accent-foreground"
    : tone === "destructive" ? "border-destructive/30 bg-destructive/5 text-destructive"
    : "bg-card";
  return (
    <div className={`rounded-xl border p-4 ${colors}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
