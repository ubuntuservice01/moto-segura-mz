import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Eye, Bell, MapPin, CheckCircle2, XCircle } from "lucide-react";
import {
  listReportesRoubo,
  listAvistamentos,
  listNotificacoes,
  marcarNotificacaoLida,
  createAvistamentoReadUrl,
} from "@/lib/seguranca.functions";

export const Route = createFileRoute("/_authenticated/gestao/seguranca")({
  component: SegurancaPainel,
});

function SegurancaPainel() {
  const qc = useQueryClient();
  const notificacoes = useQuery({ queryKey: ["notificacoes"], queryFn: () => listNotificacoes() });
  const reportes = useQuery({ queryKey: ["reportes-roubo"], queryFn: () => listReportesRoubo() });
  const avistamentos = useQuery({
    queryKey: ["avistamentos"],
    queryFn: () => listAvistamentos({ data: {} }),
  });

  const lida = useMutation({
    mutationFn: (id: string) => marcarNotificacaoLida({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes"] });
      qc.invalidateQueries({ queryKey: ["notificacoes-nao-lidas"] });
    },
  });

  async function abrirFoto(path: string) {
    const { signedUrl } = await createAvistamentoReadUrl({ data: { path } });
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Bell className="h-5 w-5" /> Notificações
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Alertas de roubo e avistamentos. A arquitetura suporta futuros canais (SMS, WhatsApp,
          e-mail) através do campo de canal em cada notificação.
        </p>
        <div className="mt-4 space-y-2">
          {(notificacoes.data ?? []).length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sem notificações.
            </p>
          )}
          {(notificacoes.data ?? []).map((n) => (
            <div
              key={n.id}
              className={
                "flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 " +
                (n.lida ? "bg-card" : "border-warning/50 bg-warning/10")
              }
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.titulo}</p>
                <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("pt-PT")} · canal: {n.canal}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {n.moto_id && (
                  <Link
                    to="/gestao/$id"
                    params={{ id: n.moto_id }}
                    className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Abrir ficha
                  </Link>
                )}
                {!n.lida && (
                  <button
                    onClick={() => lida.mutate(n.id)}
                    className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Eye className="h-5 w-5" /> Avistamentos comunicados
        </h2>
        <div className="mt-4 space-y-2">
          {(avistamentos.data ?? []).length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sem avistamentos.
            </p>
          )}
          {(avistamentos.data ?? []).map((a) => (
            <div key={a.id} className="rounded-lg border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-semibold">{a.chassi ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("pt-PT")}
                </span>
              </div>
              <p className="mt-2">{a.observacoes ?? "—"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {a.gps_lat != null && a.gps_lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${a.gps_lat},${a.gps_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Ver no mapa
                  </a>
                )}
                {a.contacto_informante && <span>Informante: {a.contacto_informante}</span>}
                {a.foto_path && (
                  <button
                    onClick={() => void abrirFoto(a.foto_path!)}
                    className="rounded border px-2 py-1 font-semibold hover:bg-muted"
                  >
                    Ver fotografia
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ShieldAlert className="h-5 w-5" /> Auditoria de reportes de roubo
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Identificador</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(reportes.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {new Date(r.created_at).toLocaleString("pt-PT")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.identificador}</td>
                  <td className="px-3 py-2">
                    {r.sucesso ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aceite
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> {r.motivo_falha ?? "Recusado"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.ip ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.gps_lat != null && r.gps_lng != null
                      ? `${r.gps_lat.toFixed(4)}, ${r.gps_lng.toFixed(4)}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {(reportes.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Sem tentativas registadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
