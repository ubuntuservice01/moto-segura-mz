import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Shield,
  History,
  Globe,
  Users,
  Box,
  Database,
  ArrowRightLeft,
  ShieldAlert,
  Inbox,
  LogOut,
  ChevronLeft,
  Bike,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/use-sessao";
import { countPreRegistosPendentes } from "@/lib/pre-registos.functions";
import { countNotificacoesNaoLidas } from "@/lib/seguranca.functions";
import { listTransferencias } from "@/lib/transferencias.functions";
import { useQuery } from "@tanstack/react-query";

export function Sidebar() {
  const { sessao } = useSessao();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [expandido, setExpandido] = useState(true);

  // Queries apenas se for perfil Gestão
  const isGestao = !!sessao?.municipio;
  const { data: pendentes } = useQuery({
    queryKey: ["pre-registos-pendentes"],
    queryFn: () => countPreRegistosPendentes(),
    enabled: isGestao,
    refetchInterval: 60_000,
  });

  const { data: alertas } = useQuery({
    queryKey: ["notificacoes-nao-lidas"],
    queryFn: () => countNotificacoesNaoLidas(),
    enabled: isGestao,
    refetchInterval: 60_000,
  });

  const { data: transferenciasPendentes } = useQuery({
    queryKey: ["transferencias-pendentes-count"],
    queryFn: () => listTransferencias({ data: { aba: "pendentes" } }),
    enabled: isGestao,
    refetchInterval: 60_000,
  });

  const totalPendentesTransf = transferenciasPendentes?.length ?? 0;

  // Definição das secções consoante o perfil
  const sections: Array<{
    title: string;
    items: Array<{
      label: string;
      icon: React.ElementType;
      href: string;
      exact?: boolean;
      badge?: number;
    }>;
  }> = [];

  if (sessao?.superAdmin) {
    sections.push({
      title: "Ubuntu Service",
      items: [
        { label: "Municípios", icon: LayoutGrid, href: "/ubuntu", exact: true },
        { label: "Utilizadores", icon: Users, href: "/ubuntu/utilizadores" },
        { label: "Módulos", icon: Box, href: "/ubuntu/modulos" },
        { label: "Backups", icon: Database, href: "/ubuntu/backups" },
      ],
    });
  }

  if (sessao?.papel === "policia" || sessao?.superAdmin) {
    sections.push({
      title: "Polícia",
      items: [
        { label: "Pesquisa Operacional", icon: Globe, href: "/policia", exact: true },
        { label: "Ocorrências & Roubos", icon: ShieldAlert, href: "/policia/ocorrencias" },
      ],
    });
  }

  if (sessao?.municipio) {
    sections.push(
      {
        title: "Gestão",
        items: [
          { label: "Dashboard", icon: LayoutGrid, href: "/gestao", exact: true },
          { label: "Pré-registos", icon: Inbox, href: "/gestao/pre-registos", badge: pendentes ?? 0 },
          { label: "Transferências", icon: ArrowRightLeft, href: "/gestao/transferencias", badge: totalPendentesTransf },
        ],
      },
      {
        title: "Segurança",
        items: [
          { label: "Ocorrências", icon: ShieldAlert, href: "/gestao/seguranca", badge: alertas ?? 0 },
          { label: "Histórico Global", icon: History, href: "/gestao/historico" },
        ],
      },
      {
        title: "Consultas",
        items: [{ label: "Pesquisa Nacional", icon: Globe, href: "/pesquisa-nacional" }],
      },
      {
        title: "Administração",
        items: [
          { label: "Esquadras", icon: Shield, href: "/gestao/esquadras" },
        ],
      }
    );
  }

  const handleSair = () => {
    supabase.auth.signOut().then(() => (window.location.href = "/auth"));
  };

  const bgColor = sessao?.municipio?.cor_principal || "var(--color-secondary)";
  const logoText = sessao?.municipio?.nome?.[0]?.toUpperCase() || (sessao?.superAdmin ? "U" : "P");
  const nomeExibido = sessao?.municipio?.nome || (sessao?.superAdmin ? "Ubuntu Service" : "MotoGest Polícia");
  const papelExibido = sessao?.papel === "admin" ? "Admin Municipal" : (sessao?.papel || "");

  return (
    <aside
      className={`relative z-20 flex flex-col transition-all duration-300 ${
        expandido ? "w-64" : "w-[68px]"
      }`}
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      {/* Botão de Colapsar */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="absolute -right-3 top-[22px] z-30 flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-colors"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
          color: "var(--color-muted-foreground)",
        }}
        title={expandido ? "Recolher menu" : "Expandir menu"}
      >
        <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${expandido ? "" : "rotate-180"}`} />
      </button>

      {/* Cabeçalho / Logo */}
      <div
        className="flex h-[64px] items-center shrink-0 overflow-hidden"
        style={{
          borderBottom: "1px solid var(--color-sidebar-border)",
          padding: expandido ? "0 14px" : "0 14px",
        }}
      >
        {/* Ícone/Avatar do município */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: bgColor }}
        >
          {logoText}
        </div>

        {expandido && (
          <div className="ml-3 min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--color-sidebar-foreground)" }}>
              {nomeExibido}
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider" style={{ color: "var(--color-sidebar-muted)" }}>
              {papelExibido}
            </p>
          </div>
        )}
      </div>

      {/* Nome do sistema quando expandido */}
      {expandido && (
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}>
          <Bike className="h-4 w-4 shrink-0" style={{ color: "var(--color-sidebar-primary)" }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--color-sidebar-muted)" }}>
            MotoGest
          </span>
        </div>
      )}

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3">
        {sections.map((section, i) => (
          <div key={i} className="mb-1 px-2">
            {expandido && (
              <p
                className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--color-sidebar-muted)" }}
              >
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item, j) => {
                const isActive = item.exact
                  ? path === item.href
                  : path.startsWith(item.href);

                return (
                  <li key={j}>
                    <Link
                      to={item.href}
                      className={`group relative flex items-center rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                        !expandido ? "justify-center" : ""
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: "var(--color-sidebar-primary)",
                              color: "var(--color-sidebar-primary-foreground)",
                            }
                          : {
                              color: "var(--color-sidebar-foreground)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "var(--color-sidebar-accent)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "transparent";
                        }
                      }}
                      title={!expandido ? item.label : undefined}
                    >
                      <item.icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          !expandido ? "mx-auto" : "mr-2.5"
                        }`}
                        style={{
                          color: isActive
                            ? "var(--color-sidebar-primary-foreground)"
                            : "var(--color-sidebar-foreground)",
                          opacity: isActive ? 1 : 0.75,
                        }}
                      />
                      {expandido && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {expandido && (item.badge ?? 0) > 0 && (
                        <span
                          className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                          style={{
                            backgroundColor: isActive
                              ? "rgba(255,255,255,0.25)"
                              : "var(--color-destructive)",
                            color: "white",
                          }}
                        >
                          {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                        </span>
                      )}
                      {/* Badge compacto quando recolhido */}
                      {!expandido && (item.badge ?? 0) > 0 && (
                        <span
                          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                          style={{ backgroundColor: "var(--color-destructive)" }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Separador entre secções */}
            {i < sections.length - 1 && (
              <div
                className="mx-3 my-2 h-px"
                style={{ backgroundColor: "var(--color-sidebar-border)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div
        className="shrink-0 p-2"
        style={{ borderTop: "1px solid var(--color-sidebar-border)" }}
      >
        <button
          onClick={handleSair}
          className={`flex w-full items-center rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
            !expandido ? "justify-center" : ""
          }`}
          style={{ color: "var(--color-sidebar-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.15)";
            (e.currentTarget as HTMLElement).style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--color-sidebar-muted)";
          }}
          title={!expandido ? "Terminar Sessão" : undefined}
        >
          <LogOut
            className={`h-[18px] w-[18px] shrink-0 ${!expandido ? "mx-auto" : "mr-2.5"}`}
          />
          {expandido && <span>Terminar Sessão</span>}
        </button>
      </div>
    </aside>
  );
}
