import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Bike,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRightLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { estatisticasNacionais } from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/ubuntu/")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Dashboard Nacional — Ubuntu Service" }],
  }),
  component: UbuntuDashboard,
});

const ESTADO_CONFIG: Record<string, { label: string; cor: string }> = {
  activa: { label: "Activas", cor: "#22c55e" },
  roubada: { label: "Roubadas", cor: "#ef4444" },
  recuperada: { label: "Recuperadas", cor: "#3b82f6" },
  transferida: { label: "Transferidas", cor: "#a855f7" },
  abatida: { label: "Abatidas", cor: "#6b7280" },
};

const PAPEL_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_municipal: "Administradores",
  tecnico_municipal: "Técnicos",
  policia: "Polícia",
};

function UbuntuDashboard() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ubuntu-stats"],
    queryFn: () => estatisticasNacionais(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-2 text-sm font-medium text-destructive">Erro ao carregar estatísticas</p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-md bg-destructive px-4 py-1.5 text-xs font-bold text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const estadoData = Object.entries(stats.motos.porEstado).map(([estado, count]) => ({
    name: ESTADO_CONFIG[estado]?.label ?? estado,
    value: count,
    fill: ESTADO_CONFIG[estado]?.cor ?? "#6b7280",
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Nacional</h1>
        <p className="page-subtitle">
          Visão em tempo real de toda a plataforma MotoGest.
        </p>
      </div>

      {/* KPIs — Municípios */}
      <section>
        <p className="section-label mb-3">Municípios</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <KpiCard
            icon={<Building2 className="h-5 w-5" />}
            label="Total"
            value={stats.municipios.total}
            cor="bg-primary/10 text-primary"
          />
          <KpiCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Activos"
            value={stats.municipios.activos}
            cor="bg-success/10 text-success"
          />
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Suspensos"
            value={stats.municipios.suspensos}
            cor="bg-destructive/10 text-destructive"
          />
        </div>
      </section>

      {/* KPIs — Motorizadas */}
      <section>
        <p className="section-label mb-3">Motorizadas</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCard
            icon={<Bike className="h-5 w-5" />}
            label="Total"
            value={stats.motos.total}
            cor="bg-primary/10 text-primary"
          />
          {Object.entries(stats.motos.porEstado).map(([estado, count]) => (
            <KpiCard
              key={estado}
              icon={<Bike className="h-5 w-5" />}
              label={ESTADO_CONFIG[estado]?.label ?? estado}
              value={count}
              cor="bg-muted text-foreground"
            />
          ))}
        </div>
      </section>

      {/* Utilizadores & Infraestrutura */}
      <section>
        <p className="section-label mb-3">Utilizadores &amp; Infraestrutura</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5" />}
            label="Total utilizadores"
            value={stats.utilizadores.total}
            cor="bg-primary/10 text-primary"
          />
          {Object.entries(stats.utilizadores.porPapel).map(([papel, count]) => (
            <KpiCard
              key={papel}
              icon={<Users className="h-5 w-5" />}
              label={PAPEL_LABEL[papel] ?? papel}
              value={count}
              cor="bg-muted text-foreground"
            />
          ))}
          <KpiCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Esquadras"
            value={stats.esquadras}
            cor="bg-secondary/10 text-secondary"
          />
          <KpiCard
            icon={<ArrowRightLeft className="h-5 w-5" />}
            label="Transferências"
            value={stats.transferencias}
            cor="bg-muted text-foreground"
          />
        </div>
      </section>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Motorizadas por município */}
        <div className="mg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Motorizadas por Município</h3>
          </div>
          {stats.porMunicipio.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={stats.porMunicipio}
                margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
              >
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 12) + "…" : v)}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, "Motorizadas"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sem dados disponíveis.
            </p>
          )}
        </div>

        {/* Distribuição por estado */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bike className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Distribuição por Estado</h3>
          </div>
          {estadoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={estadoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {estadoData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sem dados disponíveis.
            </p>
          )}
        </div>
      </div>

      {/* Feeds de actividade */}
      <div className="grid gap-6 lg:grid-cols-3">
        <FeedCard
          title="Últimos Registos"
          icon={<Bike className="h-4 w-4 text-primary" />}
          items={stats.ultimosRegistos.map((r) => ({
            id: r.id,
            titulo: `${r.marca} ${r.modelo}`,
            subtitulo: r.chassi,
            nota: r.municipio,
            data: r.created_at,
          }))}
        />
        <FeedCard
          title="Últimas Transferências"
          icon={<ArrowRightLeft className="h-4 w-4 text-primary" />}
          items={stats.ultimasTransferencias.map((t) => ({
            id: t.id,
            titulo: "Transferência",
            subtitulo: t.moto_id.slice(0, 8) + "…",
            nota: t.municipio,
            data: t.created_at,
          }))}
        />
        <FeedCard
          title="Últimos Reportes de Roubo"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          items={stats.ultimosReportes.map((r) => ({
            id: r.id,
            titulo: r.sucesso ? "Recuperada" : "Em investigação",
            subtitulo: r.identificador,
            nota: r.sucesso ? "Recuperada" : "Roubada",
            data: r.created_at,
          }))}
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  cor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  cor: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${cor}`}>{icon}</div>
      <p className="text-2xl font-bold tracking-tight">{value.toLocaleString("pt-MZ")}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FeedCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; titulo: string; subtitulo: string; nota: string; data: string }[];
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {icon}
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <ul className="divide-y">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground">Sem registos.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{item.subtitulo}</p>
                <p className="text-[10px] text-muted-foreground/70">{item.nota}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(item.data).toLocaleDateString("pt-MZ", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
