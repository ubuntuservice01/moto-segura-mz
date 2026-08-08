import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Eye, Bell, MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Ocorrências e Segurança</h1>
        <p className="page-subtitle">Notificações de alerta, avistamentos e auditoria de reportes de roubo.</p>
      </div>

      {/* Secção: Notificações */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: "var(--color-warning)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>
            Notificações
          </h2>
          {(notificacoes.data ?? []).filter(n => !n.lida).length > 0 && (
            <span className="badge badge-warning ml-1">
              {(notificacoes.data ?? []).filter(n => !n.lida).length} por ler
            </span>
          )}
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Alertas de roubo e avistamentos. Suporta futuros canais via SMS, WhatsApp e e-mail.
        </p>

        <div className="space-y-2">
          {(notificacoes.data ?? []).length === 0 && (
            <div className="empty-state">
              <Bell className="empty-state-icon" />
              <p className="empty-state-title">Sem notificações</p>
            </div>
          )}
          {(notificacoes.data ?? []).map((n) => (
            <div
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 transition-colors"
              style={{
                borderColor: n.lida ? "var(--color-border)" : "var(--color-warning)",
                backgroundColor: n.lida ? "var(--color-card)" : "rgba(180,120,0,0.05)",
              }}
            >
              {/* Indicador não lida */}
              {!n.lida && (
                <div
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--color-warning)" }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                  {n.titulo}
                </p>
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  {n.mensagem}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>
                  {new Date(n.created_at).toLocaleString("pt-PT")} · canal: {n.canal}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {n.moto_id && (
                  <Link
                    to="/gestao/$id"
                    params={{ id: n.moto_id }}
                    className="btn-secondary btn-sm"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Abrir ficha
                  </Link>
                )}
                {!n.lida && (
                  <button
                    onClick={() => lida.mutate(n.id)}
                    disabled={lida.isPending}
                    className="btn-primary btn-sm"
                  >
                    {lida.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Secção: Avistamentos */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>
            Avistamentos Comunicados
          </h2>
        </div>

        <div className="space-y-2">
          {(avistamentos.data ?? []).length === 0 && (
            <div className="empty-state">
              <Eye className="empty-state-icon" />
              <p className="empty-state-title">Sem avistamentos</p>
            </div>
          )}
          {(avistamentos.data ?? []).map((a) => (
            <div
              key={a.id}
              className="mg-card p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="font-mono font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {a.chassi ?? "—"}
                </span>
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {new Date(a.created_at).toLocaleString("pt-PT")}
                </span>
              </div>
              <p className="mt-2" style={{ color: "var(--color-foreground)" }}>
                {a.observacoes ?? "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                {a.gps_lat != null && a.gps_lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${a.gps_lat},${a.gps_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold hover:underline"
                    style={{ color: "var(--color-accent)" }}
                  >
                    <MapPin className="h-3.5 w-3.5" /> Ver no mapa
                  </a>
                )}
                {a.contacto_informante && (
                  <span>Informante: {a.contacto_informante}</span>
                )}
                {a.foto_path && (
                  <button
                    onClick={() => void abrirFoto(a.foto_path!)}
                    className="btn-secondary btn-sm"
                  >
                    Ver fotografia
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Secção: Auditoria de Reportes */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" style={{ color: "var(--color-destructive)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>
            Auditoria de Reportes de Roubo
          </h2>
        </div>

        <div className="mg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="mg-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Identificador</th>
                  <th>Resultado</th>
                  <th>IP</th>
                  <th>GPS</th>
                </tr>
              </thead>
              <tbody>
                {(reportes.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {new Date(r.created_at).toLocaleString("pt-PT")}
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--color-foreground)" }}>
                      {r.identificador}
                    </td>
                    <td>
                      {r.sucesso ? (
                        <span className="badge badge-active">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aceite
                        </span>
                      ) : (
                        <span className="badge badge-error">
                          <XCircle className="h-3.5 w-3.5" /> {r.motivo_falha ?? "Recusado"}
                        </span>
                      )}
                    </td>
                    <td className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {r.ip ?? "—"}
                    </td>
                    <td className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {r.gps_lat != null && r.gps_lng != null
                        ? `${r.gps_lat.toFixed(4)}, ${r.gps_lng.toFixed(4)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
                {(reportes.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                      Sem tentativas registadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
