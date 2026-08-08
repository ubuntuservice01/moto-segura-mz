import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, Settings, ShieldCheck, ArrowRight, Activity } from "lucide-react";
import { getStats } from "@/lib/motos.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotoCheck MZ — Verifique qualquer mota em Moçambique" },
      {
        name: "description",
        content:
          "Verifique a propriedade de qualquer mota pelo chassi, descubra motas reportadas como roubadas e compre com confiança.",
      },
      { property: "og:title", content: "MotoCheck MZ — Verifique. Confirme. Compre." },
    ],
  }),

  component: Index,
});

function Index() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => getStats() });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 -z-10 opacity-[0.07]" aria-hidden>
          <svg viewBox="0 0 600 600" className="h-full w-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Registo público — MotoCheck MZ
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              Verifique qualquer mota antes de comprar.
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/80 md:text-xl">
              Pesquise pelo chassi e veja o histórico completo da viatura, estado actual, e se foi
              reportada como roubada em Moçambique.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/verificar"
                className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-105"
              >
                <Search className="h-5 w-5" />
                Verificar chassi
              </Link>
              <Link
                to="/comprar"
                className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/5 px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ShoppingBag className="h-5 w-5" />
                Comprar moto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      {stats && (
        <section className="border-b bg-card">
          <div className="container mx-auto grid grid-cols-2 gap-px overflow-hidden px-4 py-6 md:grid-cols-4 md:py-8">
            <Stat label="Motas registadas" value={stats.total} />
            <Stat
              label="À venda"
              value={stats.aVenda}
              accent="text-accent-foreground bg-accent/10"
            />
            <Stat
              label="Reportadas como roubadas"
              value={stats.roubadas}
              accent="text-destructive bg-destructive/5"
            />
            <Stat label="Eventos no histórico" value={stats.eventos} />
          </div>
        </section>
      )}

      {/* 3 ACTIONS */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <ActionCard
            to="/verificar"
            icon={<Search className="h-6 w-6" />}
            title="Verificar Chassi"
            desc="Pesquise qualquer mota pelo número do chassi. Veja o histórico completo, estado e alerta de roubo."
            color="bg-secondary/10 text-secondary"
          />
          <ActionCard
            to="/comprar"
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Comprar Moto"
            desc="Marketplace de motas verificadas. Filtre por marca, província e preço. Todas com certificado Ubuntu Service."
            color="bg-accent/15 text-accent-foreground"
          />
          <ActionCard
            to="/gestao"
            icon={<Settings className="h-6 w-6" />}
            title="Painel de Gestão"
            desc="Registar motas, gerir transferências de propriedade e consultar o histórico global de operações."
            color="bg-primary/10 text-primary"
          />
        </div>
      </section>

      {/* WHY */}
      <section className="bg-card border-y">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-3 md:py-20">
          <Feature
            icon={<ShieldCheck className="h-6 w-6 text-secondary" />}
            title="Identificação única por chassi"
            desc="Cada mota tem uma impressão digital de chassi que liga toda a sua história ao verdadeiro proprietário."
          />
          <Feature
            icon={<Activity className="h-6 w-6 text-accent-foreground" />}
            title="Histórico imutável"
            desc="Cada registo, transferência ou actualização gera um evento auditável com data, operador e diff campo a campo."
          />
          <Feature
            icon={<ArrowRight className="h-6 w-6 text-primary" />}
            title="Compra segura"
            desc="Antes de transferir dinheiro, confirme aqui se a mota não consta no registo de viaturas roubadas."
          />
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${accent ?? ""}`}>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  desc,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary group-hover:gap-2 transition-all">
        Entrar <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-background">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
