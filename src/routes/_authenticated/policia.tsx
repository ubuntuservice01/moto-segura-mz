import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Shield, Search, FileText, ChevronRight } from "lucide-react";
import { useSessao } from "@/hooks/use-sessao";

export const Route = createFileRoute("/_authenticated/policia")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Painel Polícia — MotoGest Nacional" },
      { name: "description", content: "Painel de operações policiais e fiscalização de motorizadas." },
    ],
  }),
  component: PoliciaLayout,
});

const NAV_ITEMS = [
  { to: "/policia", label: "Consultar & Fiscalizar", icon: Search, exact: true },
  { to: "/policia/ocorrencias", label: "Ocorrências", icon: FileText },
  { to: "/pesquisa-nacional", label: "Pesquisa Nacional", icon: Shield },
];

function PoliciaLayout() {
  const { sessao } = useSessao();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header do Painel Polícia */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Painel da Polícia</h1>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Operações Locais
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sessao?.municipio?.nome || "Município"} • Fiscalização & Registo de Ocorrências
            </p>
          </div>
        </div>

        {/* Links Rápidos */}
        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-amber-600 text-white"
                    : "border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
