import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Building2,
  FileJson,
} from "lucide-react";
import { listMunicipios, exportarBackup, restaurarBackup } from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/ubuntu/backups")({
  ssr: false,
  head: () => ({ meta: [{ title: "Backups — Ubuntu Service" }] }),
  component: BackupsPage,
});

function BackupsPage() {
  const [municipioSel, setMunicipioSel] = useState<string>("");
  const [jsonInput, setJsonInput] = useState<string>("");
  const [resultadoRestauro, setResultadoRestauro] = useState<Record<string, number> | null>(null);

  const { data: municipios } = useQuery({
    queryKey: ["municipios"],
    queryFn: () => listMunicipios(),
  });

  const exportar = useMutation({
    mutationFn: () => exportarBackup({ data: { municipioId: municipioSel || undefined } }),
    onSuccess: (res) => {
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `motogest_backup_${municipioSel ? "municipio" : "nacional"}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exportado com sucesso!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const restaurar = useMutation({
    mutationFn: () => restaurarBackup({ data: { json: jsonInput } }),
    onSuccess: (res) => {
      setResultadoRestauro(res.reposto);
      toast.success("Restauro concluído com sucesso!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cópias de Segurança & Restauro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fazer backup dos dados nacionais ou por município e restaurar registos em caso de
          emergência.
        </p>
      </div>

      {/* Exportar Backup */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Exportar Cópia de Segurança (JSON)</h2>
            <p className="text-xs text-muted-foreground">
              Descarregue uma cópia completa da base de dados em formato JSON.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Âmbito do Backup:</label>
            <select
              value={municipioSel}
              onChange={(e) => setMunicipioSel(e.target.value)}
              className="w-full sm:w-80 rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Nacional (Todos os Municípios)</option>
              {(municipios ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportar.mutate()}
            disabled={exportar.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {exportar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Gerar e Descarregar Backup
          </button>
        </div>
      </div>

      {/* Restaurar Backup */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Restaurar Cópia de Segurança</h2>
            <p className="text-xs text-muted-foreground">
              Repor dados a partir de um ficheiro JSON previamente exportado.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                <strong>Atenção:</strong> O restauro realiza inserções de registos em falta.
                Registos com o mesmo ID não serão duplicados.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Carregar ficheiro JSON:</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>

          {jsonInput && (
            <div>
              <label className="block text-xs font-semibold mb-1">Conteúdo do Ficheiro JSON:</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={4}
                className="w-full font-mono text-xs rounded-lg border p-3 bg-muted/40 outline-none"
              />
            </div>
          )}

          <button
            onClick={() => restaurar.mutate()}
            disabled={restaurar.isPending || !jsonInput}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {restaurar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Iniciar Restauro
          </button>

          {resultadoRestauro && (
            <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-success font-bold text-sm mb-2">
                <CheckCircle2 className="h-4 w-4" />
                Restauro concluído! Registos repostos:
              </div>
              <ul className="text-xs space-y-1 font-mono">
                {Object.entries(resultadoRestauro).map(([tabela, total]) => (
                  <li key={tabela}>
                    • <strong>{tabela}</strong>: {total} registos
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
