import { useId, type ReactNode } from "react";
import { AlertCircle, Check } from "lucide-react";

interface BaseProps {
  label: string;
  hint?: string;
  erro?: string | null;
  obrigatorio?: boolean;
  icone?: ReactNode;
  className?: string;
}

function estadoCls(preenchido: boolean, erro?: string | null) {
  if (erro) return "border-destructive/60 focus-within:border-destructive focus-within:ring-destructive/20";
  if (preenchido)
    return "border-border focus-within:border-ring focus-within:ring-ring/20 bg-input-bg";
  return "border-input focus-within:border-ring focus-within:ring-ring/20";
}

function Rotulo({
  htmlFor,
  label,
  obrigatorio,
  preenchido,
  erro,
}: {
  htmlFor: string;
  label: string;
  obrigatorio?: boolean;
  preenchido: boolean;
  erro?: string | null;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-foreground">
        {label}
        {obrigatorio ? <span className="ml-0.5 text-destructive">*</span> : null}
      </label>
      {!erro && preenchido ? (
        <Check className="h-3.5 w-3.5 text-success" aria-hidden />
      ) : !obrigatorio ? (
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Opcional
        </span>
      ) : null}
    </div>
  );
}

function Ajuda({ hint, erro }: { hint?: string; erro?: string | null }) {
  if (erro)
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-destructive">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {erro}
      </p>
    );
  if (hint) return <p className="mt-1.5 text-[11.5px] text-muted-foreground">{hint}</p>;
  return null;
}

const CAMPO =
  "flex items-center gap-2 rounded-md border bg-input-bg px-3 transition-[border-color,box-shadow] duration-150 focus-within:ring-2";

export function CampoTexto({
  label,
  hint,
  erro,
  obrigatorio,
  icone,
  className = "",
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const preenchido = String(props.value ?? "").trim() !== "";
  return (
    <div className={className}>
      <Rotulo
        htmlFor={id}
        label={label}
        obrigatorio={obrigatorio}
        preenchido={preenchido}
        erro={erro}
      />
      <div className={`${CAMPO} ${estadoCls(preenchido, erro)}`}>
        {icone ? <span className="shrink-0 text-muted-foreground">{icone}</span> : null}
        <input
          id={id}
          {...props}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
      <Ajuda hint={hint} erro={erro} />
    </div>
  );
}

export function CampoSelect({
  label,
  hint,
  erro,
  obrigatorio,
  icone,
  className = "",
  children,
  ...props
}: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  const preenchido = String(props.value ?? "").trim() !== "";
  return (
    <div className={className}>
      <Rotulo
        htmlFor={id}
        label={label}
        obrigatorio={obrigatorio}
        preenchido={preenchido}
        erro={erro}
      />
      <div className={`${CAMPO} ${estadoCls(preenchido, erro)}`}>
        {icone ? <span className="shrink-0 text-muted-foreground">{icone}</span> : null}
        <select
          id={id}
          {...props}
          className="min-w-0 flex-1 appearance-none bg-transparent py-2 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {children}
        </select>
      </div>
      <Ajuda hint={hint} erro={erro} />
    </div>
  );
}

export function CampoTextarea({
  label,
  hint,
  erro,
  obrigatorio,
  className = "",
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const preenchido = String(props.value ?? "").trim() !== "";
  return (
    <div className={className}>
      <Rotulo
        htmlFor={id}
        label={label}
        obrigatorio={obrigatorio}
        preenchido={preenchido}
        erro={erro}
      />
      <div className={`${CAMPO} items-start ${estadoCls(preenchido, erro)}`}>
        <textarea
          id={id}
          {...props}
          className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      <Ajuda hint={hint} erro={erro} />
    </div>
  );
}

/** Cartão de secção usado dentro das etapas dos formulários. */
export function CartaoSeccao({
  titulo,
  descricao,
  icone,
  children,
  accao,
}: {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  children: ReactNode;
  accao?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {icone ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/8 text-primary">
              {icone}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight text-foreground">{titulo}</h3>
            {descricao ? (
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{descricao}</p>
            ) : null}
          </div>
        </div>
        {accao}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function GrelhaCampos({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
