// Server-only tenant helpers for the multi-tenant (multi-município) platform.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function sbAdmin() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

let cachedDefault: string | null = null;

/** Município usado quando a operação não traz tenant explícito (ex.: fluxos públicos). */
export async function municipioPadrao(): Promise<string> {
  if (cachedDefault) return cachedDefault;
  const { data, error } = await sbAdmin()
    .from("municipios")
    .select("id")
    .eq("estado", "activo")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error("Nenhum município activo configurado na plataforma.");
  cachedDefault = data.id;
  return data.id;
}

export async function resolverMunicipio(id?: string | null): Promise<string> {
  return id ?? (await municipioPadrao());
}

/** Município responsável por uma mota (para herdar em histórico, transferências, etc.). */
export async function municipioDaMoto(motoId: string): Promise<string> {
  const { data, error } = await sbAdmin()
    .from("motos")
    .select("municipio_id")
    .eq("id", motoId)
    .maybeSingle();
  if (error || !data) throw new Error("Mota não encontrada");
  return data.municipio_id;
}
