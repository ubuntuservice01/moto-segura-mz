import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Settings, ShieldAlert } from "lucide-react";
import logoUrl from "@/assets/motocheck-logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoUrl} alt="MotoCheck MZ" className="h-10 w-10 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">
              Moto<span className="text-secondary">Check</span> MZ
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Verifique. Confirme. Compre.
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/verificar" icon={<Search className="h-4 w-4" />} label="Verificar" />
          <NavLink to="/reportar-roubo" icon={<ShieldAlert className="h-4 w-4" />} label="Reportar roubo" />
          <NavLink to="/comprar" icon={<ShoppingBag className="h-4 w-4" />} label="Comprar" />
          <NavLink to="/gestao" icon={<Settings className="h-4 w-4" />} label="Gestão" />
        </nav>
      </div>
    </header>
  );
}


function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      activeProps={{ className: "bg-primary/10 text-primary" }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card mt-16">
      <div className="container mx-auto px-4 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            <span>MotoCheck MZ — Verifique. Confirme. Compre com segurança.</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} MotoCheck MZ</p>

        </div>
      </div>
    </footer>
  );
}
