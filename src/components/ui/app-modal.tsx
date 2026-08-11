import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

type Tom = "neutro" | "perigo" | "sucesso" | "info";

const TOM: Record<Tom, { Icon: typeof Info; icon: string; botao: string }> = {
  neutro: {
    Icon: Info,
    icon: "bg-muted text-muted-foreground",
    botao:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/30",
  },
  perigo: {
    Icon: AlertTriangle,
    icon: "bg-destructive/12 text-destructive",
    botao:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30",
  },
  sucesso: {
    Icon: CheckCircle2,
    icon: "bg-success/12 text-success",
    botao: "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/30",
  },
  info: {
    Icon: Info,
    icon: "bg-accent/12 text-accent",
    botao: "bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent/30",
  },
};

export interface AppModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: ReactNode;
  tom?: Tom;
  children?: ReactNode;
  rodape?: ReactNode;
  larguraMax?: string;
  bloquear?: boolean;
}

/** Modal base do MotoGest — centrado, animado e consistente. */
export function AppModal({
  aberto,
  onFechar,
  titulo,
  descricao,
  tom = "neutro",
  children,
  rodape,
  larguraMax = "max-w-lg",
  bloquear = false,
}: AppModalProps) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !bloquear) onFechar();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [aberto, bloquear, onFechar]);

  if (!aberto || !montado) return null;
  const { Icon, icon } = TOM[tom];

  return createPortal(
    <div
      className="modal-overlay fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-foreground/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={() => !bloquear && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className={`modal-panel w-full ${larguraMax} rounded-t-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-modal)] sm:rounded-xl`}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${icon}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold leading-tight text-foreground">{titulo}</h2>
            {descricao ? (
              <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {descricao}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Fechar"
            disabled={bloquear}
            onClick={onFechar}
            className="-mr-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children ? <div className="px-5 py-4">{children}</div> : null}

        {rodape ? (
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-5 py-3.5 sm:flex-row sm:justify-end">
            {rodape}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ModalBotaoSecundario({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** Diálogo de confirmação para acções importantes ou destrutivas. */
export function ConfirmDialog({
  aberto,
  onFechar,
  onConfirmar,
  titulo,
  descricao,
  labelConfirmar = "Confirmar",
  labelCancelar = "Cancelar",
  tom = "perigo",
  aProcessar = false,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
  titulo: string;
  descricao?: ReactNode;
  labelConfirmar?: string;
  labelCancelar?: string;
  tom?: Tom;
  aProcessar?: boolean;
  children?: ReactNode;
}) {
  const { botao } = TOM[tom];
  return (
    <AppModal
      aberto={aberto}
      onFechar={onFechar}
      titulo={titulo}
      descricao={descricao}
      tom={tom}
      bloquear={aProcessar}
      larguraMax="max-w-md"
      rodape={
        <>
          <ModalBotaoSecundario onClick={onFechar} disabled={aProcessar}>
            {labelCancelar}
          </ModalBotaoSecundario>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={aProcessar}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-[0.985] disabled:opacity-60 ${botao}`}
          >
            {aProcessar ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {labelConfirmar}
          </button>
        </>
      }
    >
      {children}
    </AppModal>
  );
}
