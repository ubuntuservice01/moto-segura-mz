import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function sb() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type PreRegistoEstado = "pendente" | "aprovado" | "rejeitado";

export interface PreRegisto {
  id: string;
  chassi: string;
  marca: string;
  modelo: string;
  ano: number | null;
  cor: string | null;
  proprietario_nome: string;
  proprietario_contacto: string | null;
  proprietario_provincia: string | null;
  notas: string | null;
  origem_busca: string | null;
  estado: PreRegistoEstado;
  created_at: string;
  updated_at: string;
}

const inputSchema = z.object({
  chassi: z.string().trim().min(4, "Chassi muito curto").max(40).toUpperCase(),
  marca: z.string().trim().min(1).max(50),
  modelo: z.string().trim().min(1).max(50),
  ano: z.number().int().min(1950).max(2100).optional().nullable(),
  cor: z.string().trim().max(30).optional().nullable(),
  proprietario_nome: z.string().trim().min(1).max(100),
  proprietario_contacto: z.string().trim().max(30).optional().nullable(),
  proprietario_provincia: z.string().trim().max(40).optional().nullable(),
  notas: z.string().trim().max(1000).optional().nullable(),
  origem_busca: z.string().trim().max(40).optional().nullable(),
});

export type PreRegistoInput = z.infer<typeof inputSchema>;

export const createPreRegisto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { error } = await sb().from("pre_registos" as never).insert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPreRegistos = createServerFn({ method: "GET" })
  .inputValidator((d: { estado?: string }) =>
    z.object({ estado: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<PreRegisto[]> => {
    let q = sb().from("pre_registos" as never).select("*");
    if (data.estado && data.estado !== "todos") q = q.eq("estado", data.estado);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as PreRegisto[];
  });

export const updatePreRegistoEstado = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      estado: z.enum(["pendente", "aprovado", "rejeitado"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await sb()
      .from("pre_registos" as never)
      .update({ estado: data.estado } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePreRegisto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await sb().from("pre_registos" as never).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
