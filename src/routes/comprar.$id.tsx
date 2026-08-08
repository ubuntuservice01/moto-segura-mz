import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Phone, Calendar, Gauge, Palette, Hash, MapPin } from "lucide-react";
import { getMotoMarketplaceById } from "@/lib/motos.functions";
import { EstadoBadge, VerificadaBadge } from "@/components/estado-badge";
import { ChassisFingerprint } from "@/components/chassis-fingerprint";
import { formatKm, formatMTN, maskChassi } from "@/lib/moto-types";

export const Route = createFileRoute("/comprar/$id")({
  loader: async ({ params }) => {
    const m = await getMotoMarketplaceById({ data: { id: params.id } });
    if (!m || m.estado !== "a_venda") throw notFound();
    return m;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.marca} ${loaderData.modelo} — ${formatMTN(loaderData.preco_venda)}`,
          },
          {
            name: "description",
            content: `${loaderData.marca} ${loaderData.modelo} (${loaderData.ano ?? "?"}) à venda em ${loaderData.proprietario_provincia ?? "Moçambique"}.`,
          },
        ]
      : [],
  }),
  errorComponent: ({ error }) => <p className="p-8 text-destructive">{error.message}</p>,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <p>Esta mota já não está disponível.</p>
      <Link to="/comprar" className="text-secondary hover:underline">
        Voltar ao marketplace
      </Link>
    </div>
  ),
  component: MotoDetalhe,
});

function MotoDetalhe() {
  const m = Route.useLoaderData();
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Link
        to="/comprar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao marketplace
      </Link>

      <article className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b bg-gradient-to-br from-accent/5 to-secondary/5 p-6 md:p-8">
          <div className="flex items-center gap-5">
            <ChassisFingerprint chassi={m.chassi} size={96} />
            <div>
              <div className="flex flex-wrap gap-2">
                <EstadoBadge estado={m.estado} />
                <VerificadaBadge />
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {m.marca} {m.modelo}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                Chassi: <span className="text-foreground">{maskChassi(m.chassi)}</span>
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-accent/15 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">
              Preço
            </p>
            <p className="text-3xl font-bold">{formatMTN(m.preco_venda)}</p>
          </div>
        </header>

        <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
          <Spec icon={<Calendar />} label="Ano" value={m.ano ?? "—"} />
          <Spec
            icon={<Hash />}
            label="Cilindrada"
            value={m.cilindrada ? `${m.cilindrada} cc` : "—"}
          />
          <Spec icon={<Palette />} label="Cor" value={m.cor ?? "—"} />
          <Spec icon={<Gauge />} label="Quilometragem" value={formatKm(m.km)} />
          <Spec
            icon={<MapPin />}
            label="Localização"
            value={
              m.proprietario_localidade
                ? `${m.proprietario_localidade}, ${m.proprietario_provincia ?? ""}`
                : (m.proprietario_provincia ?? "—")
            }
          />
          <Spec label="Proprietário" value={m.proprietario_nome} />
        </div>

        <div className="border-t bg-secondary/[0.04] p-6 md:p-8">
          <h3 className="text-base font-semibold">Interessado?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirme a verificação completa do chassi antes de qualquer pagamento.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {m.proprietario_contacto && (
              <a
                href={`tel:${m.proprietario_contacto}`}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                <Phone className="h-4 w-4" /> Contactar via Ubuntu Service
              </a>
            )}
            <Link
              to="/verificar/$chassi"
              params={{ chassi: m.chassi }}
              className="inline-flex items-center gap-2 rounded-md border border-secondary bg-secondary/10 px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/20"
            >
              Ver verificação completa
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      )}
      <div>
        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}
