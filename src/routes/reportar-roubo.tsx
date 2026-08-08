import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldAlert, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { reportarRoubo } from "@/lib/seguranca.functions";

export const Route = createFileRoute("/reportar-roubo")({
  head: () => ({
    meta: [
      { title: "Reportar Motorizada Roubada — MotoCheck MZ" },
      {
        name: "description",
        content:
          "Reporte a sua motorizada como roubada pelo telemóvel usando o Código de Recuperação, sem criar conta.",
      },
      { property: "og:title", content: "Reportar Motorizada Roubada — MotoCheck MZ" },
      {
        property: "og:description",
        content: "Bloqueie a sua motorizada no registo nacional em minutos, sem sair de casa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportarRouboPage,
});

function ReportarRouboPage() {
  const [f, setF] = useState({
    identificador: "",
    codigo: "",
    data_nascimento: "",
    data_compra: "",
    contacto_familiar: "",
    observacoes: "",
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsErro, setGpsErro] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      reportarRoubo({
        data: {
          identificador: f.identificador,
          codigo: f.codigo,
          data_nascimento: f.data_nascimento || null,
          data_compra: f.data_compra || null,
          contacto_familiar: f.contacto_familiar || null,
          observacoes: f.observacoes || null,
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
        },
      }),
  });

  function pedirGps() {
    setGpsErro(null);
    if (!navigator.geolocation) {
      setGpsErro("O dispositivo não permite localização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsErro("Não foi possível obter a localização."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (mut.isSuccess) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" />
          <h1 className="mt-4 text-2xl font-bold">Motorizada bloqueada no registo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A {mut.data.marca} {mut.data.modelo} (chassi {mut.data.chassi}) consta agora como{" "}
            <strong className="text-destructive">ROUBADA</strong>. Qualquer pessoa que a verifique
            verá o alerta. Apresente também queixa na PRM — linha <strong>119</strong>.
          </p>
          <Link
            to="/verificar/$chassi"
            params={{ chassi: mut.data.chassi }}
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Ver ficha pública
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive">
          <ShieldAlert className="h-4 w-4" /> Proteção contra roubo
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Reportar motorizada roubada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sem conta e sem deslocação. Confirmamos a sua identidade com o Código de Recuperação
          entregue no acto do registo e com os dados do cadastro.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="mt-8 space-y-5 rounded-xl border bg-card p-6"
      >
        <L label="Chassi ou matrícula" required>
          <input
            required
            value={f.identificador}
            onChange={(e) => setF({ ...f, identificador: e.target.value.toUpperCase() })}
            className={INPUT + " font-mono"}
            placeholder="Ex: LBPKE1408..."
          />
        </L>
        <L label="Código de Recuperação" required>
          <input
            required
            value={f.codigo}
            onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })}
            className={INPUT + " font-mono tracking-widest"}
            placeholder="MGT-8F4K-P92X"
          />
        </L>

        <div className="grid gap-4 md:grid-cols-2">
          <L label="Data de nascimento">
            <input
              type="date"
              value={f.data_nascimento}
              onChange={(e) => setF({ ...f, data_nascimento: e.target.value })}
              className={INPUT}
            />
          </L>
          <L label="Data da compra">
            <input
              type="date"
              value={f.data_compra}
              onChange={(e) => setF({ ...f, data_compra: e.target.value })}
              className={INPUT}
            />
          </L>
        </div>

        <L label="Telefone do familiar de referência">
          <input
            value={f.contacto_familiar}
            onChange={(e) => setF({ ...f, contacto_familiar: e.target.value })}
            className={INPUT}
            placeholder="+258 ..."
          />
        </L>

        <L label="Onde e quando aconteceu (opcional)">
          <textarea
            value={f.observacoes}
            onChange={(e) => setF({ ...f, observacoes: e.target.value })}
            rows={3}
            className={INPUT + " resize-none"}
          />
        </L>

        <div className="rounded-lg border border-dashed p-3">
          <button
            type="button"
            onClick={pedirGps}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            <MapPin className="h-4 w-4" />
            {gps ? "Localização registada" : "Partilhar a minha localização"}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            {gps
              ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} — será anexada ao reporte.`
              : (gpsErro ?? "Opcional. Ajuda as autoridades a localizar o último ponto conhecido.")}
          </p>
        </div>

        {mut.isError && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {(mut.error as Error).message}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground">
          Ao submeter, o sistema regista a data/hora, o endereço IP, o dispositivo e (se autorizada)
          a localização, para efeitos de auditoria. Reportes falsos são puníveis por lei.
        </p>

        <button
          type="submit"
          disabled={mut.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-destructive px-5 py-3 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
        >
          {mut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          Reportar como roubada
        </button>
      </form>
    </div>
  );
}

const INPUT =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20";

function L({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
