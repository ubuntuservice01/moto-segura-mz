import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Phone, MapPin, Calendar, Gauge, Palette, Hash, FileText, ArrowLeft, Tag } from "lucide-react";
import { getMotoByChassi } from "@/lib/motos.functions";
import { EstadoBadge, VerificadaBadge } from "@/components/estado-badge";
import { ChassisFingerprint } from "@/components/chassis-fingerprint";
import { AlertaRoubada } from "@/components/alerta-roubada";
import { Timeline } from "@/components/timeline";
import { formatKm, formatMTN } from "@/lib/moto-types";

export const Route = createFileRoute("/verificar/$chassi")({
  loader: async ({ params }) => {
    const data = await getMotoByChassi({ data: { chassi: params.chassi } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.moto.marca} ${loaderData.moto.modelo} — MotoVerify MZ`,
          },
          {
            name: "description",
            content: `Ficha pública: ${loaderData.moto.marca} ${loaderData.moto.modelo} (${loaderData.moto.chassi}). Estado: ${loaderData.moto.estado}.`,
          },
          {
            property: "og:title",
            content: `${loaderData.moto.marca} ${loaderData.moto.modelo} — MotoVerify MZ`,
          },
        ]
      : [],
  }),
  errorComponent: ({ error }) => (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-destructive">Erro: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Mota não encontrada</h1>
      <Link to="/verificar" className="mt-4 inline-block text-secondary hover:underline">
        ← Nova pesquisa
      </Link>
    </div>
  ),
  component: VerificarChassi,
});

function VerificarChassi() {
  const { moto, historico } = Route.useLoaderData();
  const isRoubada = moto.estado === "roubada";
  const isAVenda = moto.estado === "a_venda";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Link to="/verificar" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Nova pesquisa
      </Link>

      {isRoubada && (
        <div className="mt-6">
          <AlertaRoubada />
        </div>
      )}

      {/* Main card */}
      <article className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] p-6 md:p-8">
          <div className="flex items-center gap-5">
            <ChassisFingerprint chassi={moto.chassi} size={96} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <EstadoBadge estado={moto.estado} />
                <VerificadaBadge />
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {moto.marca} {moto.modelo}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                Chassi: <span className="text-foreground">{moto.chassi}</span>
              </p>
              {moto.matricula && (
                <p className="font-mono text-sm text-muted-foreground">
                  Matrícula: <span className="text-foreground">{moto.matricula}</span>
                </p>
              )}
            </div>
          </div>

          {isAVenda && moto.preco_venda != null && (
            <div className="rounded-lg bg-accent/15 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">
                Preço pedido
              </p>
              <p className="text-2xl font-bold">{formatMTN(moto.preco_venda)}</p>
            </div>
          )}
        </header>

        <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Identificação
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row icon={<Calendar />} label="Ano" value={moto.ano ?? "—"} />
              <Row icon={<Hash />} label="Cilindrada" value={moto.cilindrada ? `${moto.cilindrada} cc` : "—"} />
              <Row icon={<Palette />} label="Cor" value={moto.cor ?? "—"} />
              <Row icon={<Gauge />} label="Quilometragem" value={formatKm(moto.km)} />
            </dl>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Proprietário registado
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row icon={<FileText />} label="Nome" value={moto.proprietario_nome} />
              <Row
                icon={<MapPin />}
                label="Localidade"
                value={
                  moto.proprietario_localidade
                    ? `${moto.proprietario_localidade}, ${moto.proprietario_provincia ?? ""}`
                    : moto.proprietario_provincia ?? "—"
                }
              />
              <Row
                icon={<Phone />}
                label="Contacto"
                value={
                  isAVenda && moto.proprietario_contacto ? (
                    <a href={`tel:${moto.proprietario_contacto}`} className="font-semibold text-secondary hover:underline">
                      {moto.proprietario_contacto}
                    </a>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">
                      Protegido — disponível apenas para motas à venda
                    </span>
                  )
                }
              />
            </dl>
          </section>
        </div>

        {isAVenda && moto.proprietario_contacto && (
          <div className="border-t bg-accent/5 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">Esta mota está à venda</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Contacto mediado pela Ubuntu Link.
                </p>
              </div>
              <a
                href={`tel:${moto.proprietario_contacto}`}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                <Phone className="h-4 w-4" />
                <Tag className="h-4 w-4" />
                Contactar via Ubuntu Link
              </a>
            </div>
          </div>
        )}
      </article>

      {/* Timeline */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Histórico desta mota</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos os eventos registados desde a entrada no sistema Ubuntu Link.
        </p>
        <div className="mt-6">
          <Timeline eventos={historico} />
        </div>
      </section>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="flex-1">
        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}
