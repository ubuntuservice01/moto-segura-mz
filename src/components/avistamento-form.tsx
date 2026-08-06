import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import {
  registarAvistamento,
  createAvistamentoUploadUrl,
} from "@/lib/seguranca.functions";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "moto-documentos";
const MAX = 8 * 1024 * 1024;

export function AvistamentoForm({ motoId }: { motoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [obs, setObs] = useState("");
  const [contacto, setContacto] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      registarAvistamento({
        data: {
          motoId,
          foto_path: fotoPath,
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
          observacoes: obs || null,
          contacto_informante: contacto || null,
        },
      }),
  });

  async function enviarFoto(file: File) {
    setErro(null);
    if (file.size > MAX) {
      setErro("Fotografia maior que 8 MB.");
      return;
    }
    setACarregar(true);
    try {
      const { path, token } = await createAvistamentoUploadUrl({
        data: { motoId, filename: file.name },
      });
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || "application/octet-stream",
        });
      if (error) throw error;
      setFotoPath(path);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar a fotografia");
    } finally {
      setACarregar(false);
    }
  }

  function pedirGps() {
    if (!navigator.geolocation) return setErro("Localização indisponível neste dispositivo.");
    navigator.geolocation.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErro("Não foi possível obter a localização."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (mut.isSuccess) {
    return (
      <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-5 text-sm">
        <CheckCircle2 className="h-6 w-6 text-secondary" />
        <p className="mt-2 font-semibold">Obrigado. A comunicação foi enviada.</p>
        <p className="mt-1 text-muted-foreground">
          O Município e o proprietário foram alertados. Em caso de perigo, contacte a PRM — 119.
        </p>
      </div>
    );
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-destructive px-5 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10"
      >
        <Eye className="h-4 w-4" />
        Vi esta motorizada
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="space-y-4 rounded-xl border-2 border-destructive/40 bg-card p-5"
    >
      <h3 className="text-base font-bold">Comunicar avistamento</h3>
      <p className="text-xs text-muted-foreground">
        Não se aproxime nem confronte ninguém. Envie apenas o que conseguir em segurança.
      </p>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Onde a viu / observações</span>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={3}
          required
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-secondary"
          placeholder="Ex: Bairro Polana Caniço, junto ao mercado, por volta das 14h"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Contacto (opcional)</span>
        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-secondary"
          placeholder="+258 ..."
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={pedirGps}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          <MapPin className="h-4 w-4" />
          {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Enviar localização GPS"}
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted">
          {aCarregar ? "A enviar…" : fotoPath ? "Fotografia anexada" : "Anexar fotografia"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={aCarregar}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void enviarFoto(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {(erro || mut.isError) && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {erro ?? (mut.error as Error).message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mut.isPending || aCarregar}
          className="inline-flex items-center gap-2 rounded-md bg-destructive px-5 py-2.5 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Enviar comunicação
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-md border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
