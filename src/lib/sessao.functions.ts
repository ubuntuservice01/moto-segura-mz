import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Papel } from "./permissoes";

export type SessaoActual = {
  userId: string;
  nome: string;
  email: string | null;
  papel: Papel;
  superAdmin: boolean;
  municipioId: string | null;
  municipio: {
    id: string;
    nome: string;
    slug: string;
    provincia: string;
    cor_principal: string;
    cor_secundaria: string;
    logo_url: string | null;
    nome_plataforma: string | null;
  } | null;
};

/** Contexto do utilizador autenticado (perfil, papel e município). */
export const getSessao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessaoActual> => {
    const { contextoUtilizador } = await import("./auth.server");
    const ctx = await contextoUtilizador(context.userId);
    return {
      userId: ctx.userId,
      nome: ctx.nome,
      email: ctx.email,
      papel: ctx.papel,
      superAdmin: ctx.superAdmin,
      municipioId: ctx.municipioId,
      municipio: ctx.municipio
        ? {
            id: ctx.municipio.id,
            nome: ctx.municipio.nome,
            slug: ctx.municipio.slug,
            provincia: ctx.municipio.provincia,
            cor_principal: ctx.municipio.cor_principal,
            cor_secundaria: ctx.municipio.cor_secundaria,
            logo_url: ctx.municipio.logo_url,
            nome_plataforma: ctx.municipio.nome_plataforma,
          }
        : null,
    };
  });

/** Super admin escolhe o município em que está a trabalhar. */
export const definirMunicipioActivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ municipioId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) throw new Error("Apenas a Ubuntu Service pode mudar de município.");
    const { error } = await sbAdmin()
      .from("perfis")
      .update({ municipio_id: data.municipioId })
      .eq("id", ctx.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
