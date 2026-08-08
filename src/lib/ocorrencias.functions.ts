import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Ocorrencia = {
  id: string;
  identificador: string;
  tipo_identificador: string;
  descricao: string;
  contacto: string | null;
  sucesso: boolean;
  moto_id: string | null;
  municipio_id: string | null;
  created_at: string;
};

/** Ocorrências (reportes) do município do utilizador. */
export const listOcorrencias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Ocorrencia[]> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    let q = supa
      .from("reportes_roubo")
      .select(
        "id, identificador, tipo_identificador, descricao, contacto, sucesso, moto_id, municipio_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (!ctx.superAdmin) q = q.eq("municipio_id", ctx.municipioId!);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as Ocorrencia[];
  });

/** Registo manual de uma ocorrência pela Polícia. Marca a mota como roubada quando encontrada. */
export const registarOcorrencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        identificador: z.string().trim().min(3).max(60),
        tipo: z.enum(["chassi", "matricula", "motor"]),
        descricao: z.string().trim().min(5, "Descreva a ocorrência").max(1000),
        contacto: z.string().trim().max(40).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string; motoEncontrada: boolean }> => {
    const { contextoUtilizador, exigirPermissao } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    exigirPermissao(ctx, "ocorrencias.registar");
    const supa = sbAdmin();

    const municipioId = ctx.municipioId;
    if (!municipioId) throw new Error("Seleccione um município para registar ocorrências.");

    const campo =
      data.tipo === "chassi" ? "chassi" : data.tipo === "matricula" ? "matricula" : "numero_motor";
    const identificador = data.identificador.toUpperCase();

    const { data: mota } = await supa
      .from("motos")
      .select("id, marca, modelo, estado")
      .eq("municipio_id", municipioId)
      .ilike(campo, identificador)
      .maybeSingle();

    const { data: row, error } = await supa
      .from("reportes_roubo")
      .insert({
        municipio_id: municipioId,
        identificador,
        tipo_identificador: data.tipo,
        descricao: data.descricao,
        contacto: data.contacto ?? null,
        sucesso: false,
        moto_id: mota?.id ?? null,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Erro ao registar ocorrência");

    if (mota?.id && mota.estado !== "roubada") {
      await supa
        .from("motos")
        .update({ estado: "roubada", data_reporte_roubo: new Date().toISOString() })
        .eq("id", mota.id);
      await supa.from("historico_motos").insert({
        moto_id: mota.id,
        municipio_id: municipioId,
        tipo_evento: "reporte_roubo",
        descricao: `Ocorrência registada pela Polícia (${identificador})`,
        operador: ctx.nome,
        motivo: data.descricao,
      });
    }

    await supa.from("notificacoes").insert({
      tipo: "ocorrencia_policial",
      municipio_id: municipioId,
      titulo: "Nova ocorrência policial",
      mensagem: `Ocorrência registada para ${identificador}${mota ? ` (${mota.marca} ${mota.modelo})` : ""}.`,
      moto_id: mota?.id ?? null,
      payload: { reporte_id: row.id },
    });

    return { id: row.id, motoEncontrada: !!mota };
  });

/** Confirma a recuperação de uma motorizada associada a uma ocorrência. */
export const confirmarRecuperacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reporteId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador, exigirPermissao } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    exigirPermissao(ctx, "seguranca.recuperar");
    const supa = sbAdmin();

    const { data: reporte, error } = await supa
      .from("reportes_roubo")
      .select("id, moto_id, municipio_id, identificador")
      .eq("id", data.reporteId)
      .maybeSingle();
    if (error || !reporte) throw new Error("Ocorrência não encontrada.");
    if (!ctx.superAdmin && reporte.municipio_id !== ctx.municipioId)
      throw new Error("Sem permissão sobre esta ocorrência.");

    await supa.from("reportes_roubo").update({ sucesso: true }).eq("id", reporte.id);

    if (reporte.moto_id) {
      await supa.from("motos").update({ estado: "recuperada" }).eq("id", reporte.moto_id);
      await supa.from("historico_motos").insert({
        moto_id: reporte.moto_id,
        municipio_id: reporte.municipio_id ?? ctx.municipioId!,
        tipo_evento: "mudanca_estado",
        descricao: `Recuperação confirmada pela Polícia (${reporte.identificador})`,
        operador: ctx.nome,
      });
    }

    return { ok: true };
  });
