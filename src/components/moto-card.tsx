import { Link } from "@tanstack/react-router";
import { Bike, MapPin, Gauge, Calendar, ChevronRight, Phone, User } from "lucide-react";
import { EstadoBadge, VerificadaBadge } from "./estado-badge";
import { formatKm, formatMTN, maskChassi, type Moto, type MotoPublica } from "@/lib/moto-types";
import { cn } from "@/lib/utils";

type Variant = "marketplace" | "gestao" | "resultado";

export function MotoCard({ moto, variant }: { moto: Moto | MotoPublica; variant: Variant }) {
  const linkProps =
    variant === "marketplace"
      ? { to: "/comprar/$id", params: { id: moto.id } }
      : variant === "gestao"
        ? { to: "/gestao/$id", params: { id: moto.id } }
        : { to: "/verificar/$chassi", params: { chassi: moto.chassi } };

  const chassiDisplay = variant === "marketplace" ? maskChassi(moto.chassi) : moto.chassi;

  return (
    <Link
      {...linkProps}
      className="group relative block overflow-hidden rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-secondary/60 hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5 text-primary">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {moto.marca} {moto.modelo}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">{chassiDisplay}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <EstadoBadge estado={moto.estado} />
        <VerificadaBadge />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Field icon={<Calendar className="h-3.5 w-3.5" />} label="Ano" value={moto.ano ?? "—"} />
        <Field icon={<Gauge className="h-3.5 w-3.5" />} label="Km" value={formatKm(moto.km)} />
        <Field
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Província"
          value={moto.proprietario_provincia ?? "—"}
          colSpan
        />
      </dl>

      {variant === "marketplace" && moto.preco_venda != null && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-accent/15 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">
            Preço
          </span>
          <span className="text-lg font-bold text-foreground">{formatMTN(moto.preco_venda)}</span>
        </div>
      )}

      {variant === "gestao" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Proprietário:{" "}
          <span className="font-medium text-foreground">{moto.proprietario_nome}</span>
        </p>
      )}

      {variant === "resultado" && moto.estado === "roubada" && (
        <div
          className={cn(
            "mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Informação de contacto
          </p>
          <p className="mt-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{moto.proprietario_nome}</span>
          </p>
          {moto.proprietario_contacto && (
            <p className="mt-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <a
                href={`tel:${moto.proprietario_contacto}`}
                className="font-semibold text-secondary hover:underline"
              >
                {moto.proprietario_contacto}
              </a>
            </p>
          )}
        </div>
      )}
    </Link>
  );
}

function Field({
  icon,
  label,
  value,
  colSpan,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
    </div>
  );
}
