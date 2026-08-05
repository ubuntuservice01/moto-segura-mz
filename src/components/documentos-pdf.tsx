import { useEffect, useState } from "react";
import { FileDown, CreditCard, Palette, X } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/motocheck-logo.png";
import type { HistoricoEvento, MotoPublica } from "@/lib/moto-types";
import {
  IDENTIDADE_PADRAO,
  gerarFichaPDF,
  gerarLivretePDF,
  toDataUrl,
  type IdentidadeOpcoes,
} from "@/lib/pdf-documentos";

const STORAGE_KEY = "motocheck:identidade-pdf";

export function DocumentosPdf({
  moto,
  historico,
}: {
  moto: MotoPublica;
  historico: HistoricoEvento[];
}) {
  const [opts, setOpts] = useState<IdentidadeOpcoes>(IDENTIDADE_PADRAO);
  const [aberto, setAberto] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOpts({ ...IDENTIDADE_PADRAO, ...JSON.parse(raw) });
    } catch {
      /* ignora */
    }
    void toDataUrl(logoUrl).then(setLogo);
  }, []);

  function set<K extends keyof IdentidadeOpcoes>(k: K, v: IdentidadeOpcoes[K]) {
    setOpts((prev) => {
      const next = { ...prev, [k]: v };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, logoDataUrl: null }));
      } catch {
        /* ignora */
      }
      return next;
    });
  }

  function comLogo(): IdentidadeOpcoes {
    return { ...opts, logoDataUrl: opts.logoDataUrl ?? logo };
  }

  function ficha() {
    try {
      gerarFichaPDF(moto, historico, comLogo());
      toast.success("Ficha PDF gerada.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function livrete() {
    try {
      gerarLivretePDF(moto, comLogo());
      toast.success("Livrete (cartão) gerado — imprima em 85,6 × 54 mm.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={ficha}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <FileDown className="h-4 w-4" /> Baixar ficha PDF
        </button>
        <button
          onClick={livrete}
          className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90"
        >
          <CreditCard className="h-4 w-4" /> Imprimir livrete (cartão)
        </button>
        <button
          onClick={() => setAberto((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          {aberto ? <X className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
          Personalizar identidade
        </button>
      </div>

      {aberto && (
        <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
          <Campo label="Nome da entidade">
            <input
              value={opts.entidade}
              onChange={(e) => set("entidade", e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Subtítulo / departamento">
            <input
              value={opts.subtitulo}
              onChange={(e) => set("subtitulo", e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Cor principal">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={opts.corPrincipal}
                onChange={(e) => set("corPrincipal", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border bg-background"
              />
              <span className="font-mono text-xs text-muted-foreground">{opts.corPrincipal}</span>
            </div>
          </Campo>
          <Campo label="Cor de destaque">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={opts.corDestaque}
                onChange={(e) => set("corDestaque", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border bg-background"
              />
              <span className="font-mono text-xs text-muted-foreground">{opts.corDestaque}</span>
            </div>
          </Campo>
          <Campo label="Rodapé">
            <input
              value={opts.rodape}
              onChange={(e) => set("rodape", e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Logótipo personalizado (PNG)">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fr = new FileReader();
                fr.onload = () => set("logoDataUrl", String(fr.result));
                fr.readAsDataURL(f);
              }}
              className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-semibold"
            />
          </Campo>
          <div className="space-y-2 md:col-span-2">
            <Check
              checked={opts.incluirLogo}
              onChange={(v) => set("incluirLogo", v)}
              label="Incluir logótipo nos documentos"
            />
            <Check
              checked={opts.chassiCompleto}
              onChange={(v) => set("chassiCompleto", v)}
              label="Mostrar chassi completo (desmarcar para mascarar)"
            />
            <Check
              checked={opts.incluirHistorico}
              onChange={(v) => set("incluirHistorico", v)}
              label="Incluir histórico/timeline na ficha PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-primary)]"
      />
      {label}
    </label>
  );
}
