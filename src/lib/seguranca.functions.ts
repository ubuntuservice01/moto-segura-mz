import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  sbAdmin,
  hashCodigo,
  equalsSeguro,
  gerarCodigoRecuperacao,
  prefixoCodigo,
  mascararContacto,
} from "./seguranca.server";

const BUCKET = "moto-documentos";

export interface ReporteRoubo {
  id: string;
  moto_id: string | null;
  identificador: string;
  sucesso: boolean;
  motivo_falha: string | null;
  ip: string | null;
  user_agent: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
}

export interface Avistamento {
  id: string;
  moto_id: string;
  foto_path: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  observacoes: string | null;
  contacto_informante: string | null;
  created_at: string;
}

export interface Notificacao {
  id: string;
  tipo: string;
  canal: string;
  titulo: string;
  mensagem: string;
  moto_id: string | null;
  lida: boolean;
  created_at: string;
}

const reporteSchema = z.object({
  identificador: z.string().trim().min(4, "Chassi ou matrícula inválido").max(40),
  codigo: z.string().trim().min(6, "Código de recuperação inválido").max(40),
  data_nascimento: z.string().trim().max(10).optional().nullable(),
  data_compra: z.string().trim().max(10).optional().nullable(),
  contacto_familiar: z.string().trim().max(30).optional().nullable(),
  gps_lat: z.number().min(-90).max(90).optional().nullable(),
  gps_lng: z.number().min(-180).max(180).optional().nullable(),
  observacoes: z.string().trim().max(1000).optional().nullable(),
});

/**
 * Reporte público de roubo — sem autenticação.
 * Validado pelo Código de Recuperação + dados registados no cadastro.
 */
export const reportarRoubo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reporteSchema.parse(d))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; chassi: string; marca: string; modelo: string }> => {
      const supa = sbAdmin();
      const ip =
        getRequestHeader("cf-connecting-ip") ??
        getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
        null;
      const userAgent = getRequestHeader("user-agent") ?? null;
      const ident = data.identificador.toUpperCase();

      async function registar(
        motoId: string | null,
        sucesso: boolean,
        falha?: string,
        municipioId?: string | null,
      ) {
        await supa.from("reportes_roubo").insert({
          moto_id: motoId,
          municipio_id: municipioId ?? null,
          identificador: ident,
          sucesso,
          motivo_falha: falha ?? null,
          ip,
          user_agent: userAgent,
          gps_lat: data.gps_lat ?? null,
          gps_lng: data.gps_lng ?? null,
        });
      }

      // Limite de tentativas falhadas por IP (15 min)
      if (ip) {
        const desde = new Date(Date.now() - 15 * 60_000).toISOString();
        const { count } = await supa
          .from("reportes_roubo")
          .select("*", { count: "exact", head: true })
          .eq("ip", ip)
          .eq("sucesso", false)
          .gte("created_at", desde);
        if ((count ?? 0) >= 5) {
          throw new Error("Demasiadas tentativas. Tente novamente dentro de 15 minutos.");
        }
      }

      const { data: rows } = await supa
        .from("motos")
        .select("*")
        .or(`chassi.eq.${ident},matricula.eq.${ident}`)
        .limit(1);
      const moto = rows?.[0] as
        | {
            id: string;
            chassi: string;
            marca: string;
            modelo: string;
            estado: string;
            municipio_id: string;
            codigo_recuperacao_hash: string | null;
            proprietario_data_nascimento: string | null;
            data_compra: string | null;
            proprietario_familiar_contacto: string | null;
          }
        | undefined;

      if (!moto) {
        await registar(null, false, "Motorizada não encontrada");
        throw new Error("Dados não conferem com o registo. Verifique e tente novamente.");
      }
      if (!moto.codigo_recuperacao_hash) {
        await registar(moto.id, false, "Registo sem código de recuperação");
        throw new Error(
          "Esta motorizada não tem Código de Recuperação. Dirija-se ao Município para o obter.",
        );
      }

      const hash = await hashCodigo(data.codigo);
      if (!equalsSeguro(hash, moto.codigo_recuperacao_hash)) {
        await registar(moto.id, false, "Código de recuperação incorrecto");
        throw new Error("Dados não conferem com o registo. Verifique e tente novamente.");
      }

      // Confirmações adicionais — só validadas quando existem no registo
      const digitos = (v: string) => v.replace(/\D/g, "");
      const falhas: string[] = [];
      if (moto.proprietario_data_nascimento && data.data_nascimento) {
        if (moto.proprietario_data_nascimento !== data.data_nascimento)
          falhas.push("Data de nascimento");
      }
      if (moto.data_compra && data.data_compra) {
        if (moto.data_compra !== data.data_compra) falhas.push("Data da compra");
      }
      if (moto.proprietario_familiar_contacto && data.contacto_familiar) {
        const a = digitos(moto.proprietario_familiar_contacto).slice(-9);
        const b = digitos(data.contacto_familiar).slice(-9);
        if (a !== b) falhas.push("Contacto do familiar");
      }
      if (falhas.length) {
        await registar(moto.id, false, `Dados divergentes: ${falhas.join(", ")}`);
        throw new Error("Dados não conferem com o registo. Verifique e tente novamente.");
      }

      if (moto.estado === "roubada") {
        await registar(moto.id, true, "Já estava reportada como roubada");
        return { ok: true, chassi: moto.chassi, marca: moto.marca, modelo: moto.modelo };
      }

      const agora = new Date().toISOString();
      const { error: eUpd } = await supa
        .from("motos")
        .update({ estado: "roubada", data_reporte_roubo: agora })
        .eq("id", moto.id);
      if (eUpd) throw new Error(eUpd.message);

      await supa.from("historico_motos").insert({
        moto_id: moto.id,
        municipio_id: moto.municipio_id,
        tipo_evento: "reporte_roubo",
        descricao: "Roubo reportado pelo proprietário via portal público",
        operador: "Proprietário (código de recuperação)",
        motivo: data.observacoes ?? null,
        diff: {
          estado: { antes: moto.estado, depois: "roubada" },
          ip: { antes: null, depois: ip },
          dispositivo: { antes: null, depois: userAgent?.slice(0, 120) ?? null },
          gps:
            data.gps_lat != null && data.gps_lng != null
              ? { antes: null, depois: `${data.gps_lat}, ${data.gps_lng}` }
              : { antes: null, depois: null },
        },
      });

      await supa.from("notificacoes").insert({
        tipo: "reporte_roubo",
        municipio_id: moto.municipio_id,
        titulo: `Roubo reportado — ${moto.marca} ${moto.modelo}`,
        mensagem: `Chassi ${moto.chassi} foi reportado como ROUBADO pelo proprietário.`,
        moto_id: moto.id,
        payload: { ip, gps_lat: data.gps_lat ?? null, gps_lng: data.gps_lng ?? null },
      });

      await registar(moto.id, true);
      return { ok: true, chassi: moto.chassi, marca: moto.marca, modelo: moto.modelo };
    },
  );

/** URL assinado para o cidadão carregar a foto de um avistamento. */
export const createAvistamentoUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        motoId: z.string().uuid(),
        filename: z.string().trim().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const path = `avistamentos/${data.motoId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await sbAdmin()
      .storage.from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Falha ao preparar carregamento");
    return { path: signed.path, token: signed.token };
  });

export const createAvistamentoReadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        path: z
          .string()
          .min(1)
          .max(500)
          .regex(/^avistamentos\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/, "Caminho inválido"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: signed, error } = await sbAdmin()
      .storage.from(BUCKET)
      .createSignedUrl(data.path, 600);
    if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Falha ao gerar URL");
    return { signedUrl: signed.signedUrl };
  });

/** "Vi esta motorizada" — comunicação pública de localização. */
export const registarAvistamento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        motoId: z.string().uuid(),
        foto_path: z.string().trim().max(500).optional().nullable(),
        gps_lat: z.number().min(-90).max(90).optional().nullable(),
        gps_lng: z.number().min(-180).max(180).optional().nullable(),
        observacoes: z.string().trim().max(1000).optional().nullable(),
        contacto_informante: z.string().trim().max(30).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supa = sbAdmin();
    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    const { data: moto } = await supa
      .from("motos")
      .select("id, chassi, marca, modelo, estado, municipio_id")
      .eq("id", data.motoId)
      .maybeSingle();
    if (!moto) throw new Error("Motorizada não encontrada");
    const m = moto as { id: string; chassi: string; marca: string; modelo: string; municipio_id: string };

    const { error } = await supa.from("avistamentos").insert({
      moto_id: data.motoId,
      municipio_id: m.municipio_id,
      foto_path: data.foto_path ?? null,
      gps_lat: data.gps_lat ?? null,
      gps_lng: data.gps_lng ?? null,
      observacoes: data.observacoes ?? null,
      contacto_informante: data.contacto_informante ?? null,
      ip,
      user_agent: userAgent,
    });
    if (error) throw new Error(error.message);

    const local =
      data.gps_lat != null && data.gps_lng != null
        ? `${data.gps_lat.toFixed(5)}, ${data.gps_lng.toFixed(5)}`
        : "localização não fornecida";

    await supa.from("historico_motos").insert({
      moto_id: data.motoId,
      municipio_id: m.municipio_id,
      tipo_evento: "avistamento",
      descricao: `Avistamento comunicado por cidadão (${local})`,
      operador: "Cidadão",
      motivo: data.observacoes ?? null,
      diff: null,
    });

    await supa.from("notificacoes").insert({
      tipo: "avistamento",
      municipio_id: m.municipio_id,
      titulo: `Avistamento — ${m.marca} ${m.modelo}`,
      mensagem: `Um cidadão comunicou ter visto a mota ${m.chassi} em ${local}.`,
      moto_id: data.motoId,
      payload: { gps_lat: data.gps_lat ?? null, gps_lng: data.gps_lng ?? null },
    });

    return { ok: true };
  });

// =========== PAINEL (Ubuntu Service) ===========

export const listReportesRoubo = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReporteRoubo[]> => {
    const { data, error } = await sbAdmin()
      .from("reportes_roubo")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ReporteRoubo[];
  },
);

export const listAvistamentos = createServerFn({ method: "GET" })
  .inputValidator((d: { motoId?: string } | undefined) =>
    z.object({ motoId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<(Avistamento & { chassi: string | null })[]> => {
    const supa = sbAdmin();
    let q = supa.from("avistamentos").select("*, motos(chassi)");
    if (data.motoId) q = q.eq("moto_id", data.motoId);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => {
      const row = r as unknown as Avistamento & { motos: { chassi: string } | null };
      return { ...row, chassi: row.motos?.chassi ?? null };
    });
  });

export const listNotificacoes = createServerFn({ method: "GET" }).handler(
  async (): Promise<Notificacao[]> => {
    const { data, error } = await sbAdmin()
      .from("notificacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Notificacao[];
  },
);

export const countNotificacoesNaoLidas = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    const { count } = await sbAdmin()
      .from("notificacoes")
      .select("*", { count: "exact", head: true })
      .eq("lida", false);
    return count ?? 0;
  },
);

export const marcarNotificacaoLida = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await sbAdmin().from("notificacoes").update({ lida: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Gera um novo Código de Recuperação (o anterior deixa de funcionar). */
export const regenerarCodigoRecuperacao = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ codigo: string }> => {
    const codigo = gerarCodigoRecuperacao();
    const { error } = await sbAdmin()
      .from("motos")
      .update({
        codigo_recuperacao_hash: await hashCodigo(codigo),
        codigo_recuperacao_prefixo: prefixoCodigo(codigo),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { codigo };
  });

/** Marca uma mota roubada como recuperada. */
export const marcarComoRecuperada = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), motivo: z.string().trim().min(5).max(500) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supa = sbAdmin();
    const { data: row } = await supa
      .from("motos")
      .select("id, estado, municipio_id")
      .eq("id", data.id)
      .single();
    const anterior = (row as { estado: string } | null)?.estado ?? "roubada";
    const municipioId = (row as { municipio_id: string }).municipio_id;
    const { error } = await supa
      .from("motos")
      .update({ estado: "recuperada", data_reporte_roubo: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supa.from("historico_motos").insert({
      moto_id: data.id,
      municipio_id: municipioId,
      tipo_evento: "mudanca_estado",
      descricao: "Motorizada declarada RECUPERADA",
      motivo: data.motivo,
      diff: { estado: { antes: anterior, depois: "recuperada" } },
    });
    return { ok: true };
  });

/** Contacto de emergência mascarado — usado no alerta público de mota roubada. */
export const contactoEmergenciaMascarado = createServerFn({ method: "GET" })
  .inputValidator((d: { motoId: string }) => z.object({ motoId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ familiar: string | null }> => {
    const { data: row } = await sbAdmin()
      .from("motos")
      .select("proprietario_familiar_contacto, estado")
      .eq("id", data.motoId)
      .maybeSingle();
    const r = row as { proprietario_familiar_contacto: string | null; estado: string } | null;
    if (!r || r.estado !== "roubada") return { familiar: null };
    return { familiar: mascararContacto(r.proprietario_familiar_contacto) };
  });
