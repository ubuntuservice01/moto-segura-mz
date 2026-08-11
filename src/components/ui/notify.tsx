import { toast as sonner } from "sonner";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

type Tone = "success" | "error" | "warning" | "info" | "transferencia";

const TONE: Record<
  Tone,
  { Icon: typeof Info; wrap: string; icon: string; bar: string }
> = {
  success: {
    Icon: CheckCircle2,
    wrap: "border-success/30",
    icon: "bg-success/12 text-success",
    bar: "bg-success",
  },
  error: {
    Icon: XCircle,
    wrap: "border-destructive/30",
    icon: "bg-destructive/12 text-destructive",
    bar: "bg-destructive",
  },
  warning: {
    Icon: AlertTriangle,
    wrap: "border-warning/40",
    icon: "bg-warning/20 text-warning-foreground",
    bar: "bg-warning",
  },
  info: {
    Icon: Info,
    wrap: "border-accent/30",
    icon: "bg-accent/12 text-accent",
    bar: "bg-accent",
  },
  transferencia: {
    Icon: ArrowLeftRight,
    wrap: "border-primary/30",
    icon: "bg-primary/10 text-primary",
    bar: "bg-primary",
  },
};

export interface NotifyOptions {
  descricao?: ReactNode;
  duracao?: number;
  accao?: { label: string; onClick: () => void };
}

function base(tone: Tone, titulo: string, opts: NotifyOptions = {}) {
  const { Icon, wrap, icon, bar } = TONE[tone];
  return sonner.custom(
    (id) => (
      <div
        role="status"
        className={`pointer-events-auto flex w-full max-w-[380px] overflow-hidden rounded-lg border bg-card text-card-foreground shadow-[var(--shadow-elevated)] ${wrap}`}
      >
        <span className={`w-1 shrink-0 ${bar}`} aria-hidden />
        <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${icon}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-foreground">{titulo}</p>
            {opts.descricao ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opts.descricao}</p>
            ) : null}
            {opts.accao ? (
              <button
                type="button"
                onClick={() => {
                  opts.accao?.onClick();
                  sonner.dismiss(id);
                }}
                className="mt-2.5 inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {opts.accao.label}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Fechar notificação"
            onClick={() => sonner.dismiss(id)}
            className="-mr-1 -mt-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    ),
    { duration: opts.duracao ?? (tone === "error" ? 7000 : 4500) },
  );
}

/** Sistema único de notificações do MotoGest. */
export const notificar = {
  sucesso: (titulo: string, opts?: NotifyOptions) => base("success", titulo, opts),
  erro: (titulo: string, opts?: NotifyOptions) => base("error", titulo, opts),
  aviso: (titulo: string, opts?: NotifyOptions) => base("warning", titulo, opts),
  info: (titulo: string, opts?: NotifyOptions) => base("info", titulo, opts),
  transferencia: (titulo: string, opts?: NotifyOptions) => base("transferencia", titulo, opts),
  /** Indicador de processamento; devolve o id para depois fechar. */
  aCarregar: (titulo: string) =>
    sonner.custom(
      () => (
        <div className="pointer-events-auto flex w-full max-w-[380px] items-center gap-3 rounded-lg border border-border bg-card p-3.5 text-card-foreground shadow-[var(--shadow-elevated)]">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          <p className="text-[13px] font-semibold text-foreground">{titulo}</p>
        </div>
      ),
      { duration: 60000 },
    ),
  fechar: (id?: string | number) => sonner.dismiss(id),
};

export const erroDe = (e: unknown, fallback = "Não foi possível concluir a operação.") =>
  e instanceof Error && e.message ? e.message : fallback;
