import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Users,
  Puzzle,
  Database,
  LayoutDashboard,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useSessao } from "@/hooks/use-sessao";

export const Route = createFileRoute("/_authenticated/ubuntu")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    // Verificado no _authenticated/route.tsx — aqui apenas garantimos super_admin
    const user = (context as { user?: { id: string } }).user;
    if (!user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Ubuntu Service — MotoGest Plataforma Nacional" },
      { name: "description", content: "Painel de administração nacional da plataforma MotoGest." },
    ],
  }),
  component: UbuntuLayout,
});

const NAV_ITEMS = [
  { to: "/ubuntu", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/ubuntu/municipios", label: "Municípios", icon: Building2 },
  { to: "/ubuntu/utilizadores", label: "Utilizadores", icon: Users },
  { to: "/ubuntu/modulos", label: "Módulos", icon: Puzzle },
  { to: "/ubuntu/backups", label: "Backups", icon: Database },
];

function UbuntuLayout() {
  const { sessao } = useSessao();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        {/* Logo Ubuntu Service */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold">Ubuntu Service</span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Administração Nacional
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                  (isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer da sidebar */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2">
            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-xs font-bold uppercase">
              {sessao?.nome?.[0] ?? "U"}
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-xs font-semibold truncate">{sessao?.nome ?? "—"}</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate">
                {sessao?.email ?? ""}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-sidebar px-4 py-3 md:hidden">
          <Shield className="h-5 w-5 text-sidebar-primary" />
          <span className="text-sm font-bold text-sidebar-foreground">Ubuntu Service</span>
          <div className="ml-auto flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? path === item.to : path.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={
                    "flex items-center justify-center rounded-md p-2 text-sidebar-foreground/70 " +
                    (isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "")
                  }
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
