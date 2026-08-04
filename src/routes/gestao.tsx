import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Plus, History, AlertTriangle, Inbox } from "lucide-react";
import { countPreRegistosPendentes } from "@/lib/pre-registos.functions";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Painel Ubuntu Service — MotoCheck MZ" },
      { name: "description", content: "Painel de gestão Ubuntu Service." },
    ],
  }),
  component: GestaoLayout,
});

function GestaoLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: pendentes } = useQuery({
    queryKey: ["pre-registos-pendentes"],
    queryFn: () => countPreRegistosPendentes(),
    refetchInterval: 60_000,
  });
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
        <div className="flex items-start gap-2 text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Acesso restrito a operadores Ubuntu Service.</strong> Esta área não tem autenticação
            nesta fase do projecto e está aberta para fins de prototipagem.
          </p>
        </div>
      </div>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Ubuntu Service</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registar, gerir e auditar todas as motas no sistema.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <TabLink to="/gestao" exact icon={<LayoutGrid className="h-4 w-4" />} active={path === "/gestao"}>
            Motas
          </TabLink>
          <TabLink to="/gestao/nova" icon={<Plus className="h-4 w-4" />} active={path === "/gestao/nova"}>
            Nova
          </TabLink>
          <TabLink
            to="/gestao/pre-registos"
            icon={<Inbox className="h-4 w-4" />}
            active={path === "/gestao/pre-registos"}
          >
            Pré-registos
          </TabLink>
          <TabLink
            to="/gestao/historico"
            icon={<History className="h-4 w-4" />}
            active={path === "/gestao/historico"}
          >
            Histórico
          </TabLink>
        </nav>
      </header>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}

function TabLink({
  to, icon, children, active, exact: _exact,
}: {
  to: string; icon: React.ReactNode; children: React.ReactNode; active: boolean; exact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "border bg-card hover:bg-muted")
      }
    >
      {icon}
      {children}
    </Link>
  );
}
