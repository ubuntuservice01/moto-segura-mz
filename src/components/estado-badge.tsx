import { cn } from "@/lib/utils";
import { ESTADOS_LABEL, type EstadoMoto } from "@/lib/moto-types";
import { AlertTriangle, CheckCircle2, Tag, ArrowRightLeft, ShieldCheck, Banknote, Ban } from "lucide-react";

const STYLES: Record<EstadoMoto, string> = {
  activa: "bg-secondary/10 text-secondary border-secondary/30",
  a_venda: "bg-accent/15 text-accent-foreground border-accent/40",
  roubada: "bg-destructive/10 text-destructive border-destructive/40",
  transferida: "bg-muted text-muted-foreground border-border",
  recuperada: "bg-secondary/15 text-secondary border-secondary/40",
  vendida: "bg-muted text-muted-foreground border-border",
  abatida: "bg-muted text-muted-foreground border-border line-through",
};

const ICONS: Record<EstadoMoto, React.ReactNode> = {
  activa: <CheckCircle2 className="h-3.5 w-3.5" />,
  a_venda: <Tag className="h-3.5 w-3.5" />,
  roubada: <AlertTriangle className="h-3.5 w-3.5" />,
  transferida: <ArrowRightLeft className="h-3.5 w-3.5" />,
  recuperada: <ShieldCheck className="h-3.5 w-3.5" />,
  vendida: <Banknote className="h-3.5 w-3.5" />,
  abatida: <Ban className="h-3.5 w-3.5" />,
};

export function EstadoBadge({ estado, className }: { estado: EstadoMoto; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        STYLES[estado],
        className,
      )}
    >
      {ICONS[estado]}
      {ESTADOS_LABEL[estado]}
    </span>
  );
}

export function VerificadaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground",
        className,
      )}
    >
      <ShieldDot /> Verificada
    </span>
  );
}

function ShieldDot() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
      <circle cx="6" cy="6" r="3" />
    </svg>
  );
}
