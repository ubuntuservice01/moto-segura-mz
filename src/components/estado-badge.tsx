import { cn } from "@/lib/utils";
import { ESTADOS_LABEL, type EstadoMoto } from "@/lib/moto-types";
import {
  AlertTriangle,
  CheckCircle2,
  Tag,
  ArrowRightLeft,
  ShieldCheck,
  Banknote,
  Ban,
} from "lucide-react";

// Contraste garantido (WCAG AA) em modo claro e escuro
const STYLES: Record<EstadoMoto, string> = {
  activa:      "border-emerald-200 bg-emerald-50 text-emerald-800",
  a_venda:     "border-amber-200  bg-amber-50  text-amber-800",
  roubada:     "border-red-200    bg-red-50    text-red-800",
  transferida: "border-blue-200   bg-blue-50   text-blue-800",
  recuperada:  "border-teal-200   bg-teal-50   text-teal-800",
  vendida:     "border-slate-200  bg-slate-50  text-slate-700",
  abatida:     "border-slate-200  bg-slate-50  text-slate-500 line-through",
};

const ICONS: Record<EstadoMoto, React.ReactNode> = {
  activa:      <CheckCircle2  className="h-3.5 w-3.5" />,
  a_venda:     <Tag           className="h-3.5 w-3.5" />,
  roubada:     <AlertTriangle className="h-3.5 w-3.5" />,
  transferida: <ArrowRightLeft className="h-3.5 w-3.5" />,
  recuperada:  <ShieldCheck   className="h-3.5 w-3.5" />,
  vendida:     <Banknote      className="h-3.5 w-3.5" />,
  abatida:     <Ban           className="h-3.5 w-3.5" />,
};

export function EstadoBadge({ estado, className }: { estado: EstadoMoto; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
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
        "inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800",
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
