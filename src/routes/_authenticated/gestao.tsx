import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  Plus,
  History,
  Inbox,
  ShieldAlert,
  Shield,
  Globe,
  Building2,
} from "lucide-react";
import { countPreRegistosPendentes } from "@/lib/pre-registos.functions";
import { countNotificacoesNaoLidas } from "@/lib/seguranca.functions";
import { useSessao } from "@/hooks/use-sessao";

export const Route = createFileRoute("/_authenticated/gestao")({
  head: () => ({
    meta: [
      { title: "Painel de Gestão Municipal — MotoGest" },
      { name: "description", content: "Painel de gestão de motorizadas do município." },
    ],
  }),
  component: GestaoLayout,
});

function GestaoLayout() {
  const { sessao } = useSessao();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const { data: pendentes } = useQuery({
    queryKey: ["pre-registos-pendentes"],
    queryFn: () => countPreRegistosPendentes(),
    refetchInterval: 60_000,
  });

  const { data: alertas } = useQuery({
    queryKey: ["notificacoes-nao-lidas"],
    queryFn: () => countNotificacoesNaoLidas(),
    refetchInterval: 60_000,
  });

  const nomePlataforma =
    sessao?.municipio?.nome_plataforma ||
    (sessao?.municipio?.nome ? `MotoGest ${sessao.municipio.nome}` : "MotoGest");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com branding do Município */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white shadow-sm"
            style={{ backgroundColor: sessao?.municipio?.cor_principal || "#006633" }}
          >
            {sessao?.municipio?.nome?.[0] || "M"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{nomePlataforma}</h1>
              {sessao?.superAdmin && (
                <Link
                  to="/ubuntu"
                  className="rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
                >
                  Voltar ao Painel Ubuntu
                </Link>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sessao?.municipio?.nome || "Moçambique"} • Painel de Gestão Municipal
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO DE TABS */}
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
            badge={pendentes ?? 0}
          >
            Pré-registos
          </TabLink>
          <TabLink
            to="/gestao/seguranca"
            icon={<ShieldAlert className="h-4 w-4" />}
            active={path === "/gestao/seguranca"}
            badge={alertas ?? 0}
          >
            Segurança
          </TabLink>
          <TabLink
            to="/gestao/historico"
            icon={<History className="h-4 w-4" />}
            active={path === "/gestao/historico"}
          >
            Histórico
          </TabLink>
          <TabLink
            to="/gestao/esquadras"
            icon={<Shield className="h-4 w-4" />}
            active={path === "/gestao/esquadras"}
          >
            Esquadras
          </TabLink>
          <TabLink
            to="/pesquisa-nacional"
            icon={<Globe className="h-4 w-4 text-primary" />}
            active={path === "/pesquisa-nacional"}
          >
            Pesquisa Nacional
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
  to,
  icon,
  children,
  active,
  badge,
  exact: _exact,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  badge?: number;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors " +
        (active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "border bg-card hover:bg-muted text-muted-foreground")
      }
    >
      {icon}
      {children}
      {badge ? (
        <span
          className={
            "ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
            (active ? "bg-primary-foreground text-primary" : "bg-warning text-warning-foreground")
          }
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
