import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import {
  type Moto,
  type MotoPublica,
  type HistoricoEvento,
  type Transferencia,
  publicizeMoto,
} from "./moto-types";

// Server-side client using the service role key.
// Bypasses RLS — all public-facing reads MUST be sanitized (see publicizeMoto).
function sb() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const documentoSchema = z.object({
  tipo: z.enum(["bi", "carta_conducao", "livrete", "factura", "seguro", "outro"]),
  nome: z.string().min(1).max(200),
  path: z.string().min(1).max(500),
  mime: z.string().max(100),
  tamanho: z.number().int().min(0),
  carregado_em: z.string(),
});

const motoInputSchema = z.object({
  chassi: z.string().trim().min(6, "Chassi muito curto").max(40).toUpperCase(),
  matricula: z.string().trim().max(20).optional().nullable(),
  marca: z.string().trim().min(1).max(50),
  modelo: z.string().trim().min(1).max(50),
  ano: z.number().int().min(1950).max(2100).optional().nullable(),
  cilindrada: z.number().int().min(50).max(2000).optional().nullable(),
  cor: z.string().trim().max(30).optional().nullable(),
  km: z.number().int().min(0).max(9_999_999).optional().nullable(),
  proprietario_nome: z.string().trim().min(1).max(100),
  proprietario_bi: z.string().trim().max(30).optional().nullable(),
  proprietario_contacto: z.string().trim().max(30).optional().nullable(),
  proprietario_localidade: z.string().trim().max(80).optional().nullable(),
  proprietario_distrito: z.string().trim().max(80).optional().nullable(),
  proprietario_posto_admin: z.string().trim().max(100).optional().nullable(),
  proprietario_provincia: z.string().trim().max(40).optional().nullable(),
  estado: z
    .enum(["activa", "a_venda", "roubada", "transferida", "recuperada", "vendida", "abatida"])
    .default("activa"),
  numero_motor: z.string().trim().max(40).optional().nullable(),
  proprietario_data_nascimento: z.string().trim().max(10).optional().nullable(),
  proprietario_contacto_alt: z.string().trim().max(30).optional().nullable(),
  proprietario_familiar_nome: z.string().trim().max(100).optional().nullable(),
  proprietario_familiar_contacto: z.string().trim().max(30).optional().nullable(),
  proprietario_endereco: z.string().trim().max(200).optional().nullable(),
  data_compra: z.string().trim().max(10).optional().nullable(),
  local_compra: z.string().trim().max(120).optional().nullable(),
  foto_path: z.string().trim().max(500).optional().nullable(),
  preco_venda: z.number().min(0).max(999_999_999).optional().nullable(),
  notas_internas: z.string().trim().max(2000).optional().nullable(),
  documentos: z.array(documentoSchema).default([]),
});


export type MotoInput = z.infer<typeof motoInputSchema>;

// =========== PUBLIC ===========

export const searchMotosByChassi = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().trim().min(2).max(40) }).parse(d))
  .handler(async ({ data }): Promise<MotoPublica[]> => {
    const { data: rows, error } = await sb()
      .from("motos")
      .select("*")
      .ilike("chassi", `%${data.q}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => publicizeMoto(r as unknown as Moto));
  });

export const getMotoByChassi = createServerFn({ method: "GET" })
  .inputValidator((d: { chassi: string }) => z.object({ chassi: z.string().trim().min(2).max(40) }).parse(d))
  .handler(async ({ data }): Promise<{ moto: MotoPublica; historico: HistoricoEvento[] } | null> => {
    const supa = sb();
    const { data: row, error } = await supa
      .from("motos")
      .select("*")
      .eq("chassi", data.chassi.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const moto = row as unknown as Moto;
    const { data: hist } = await supa
      .from("historico_motos")
      .select("*")
      .eq("moto_id", moto.id)
      .order("created_at", { ascending: false });
    const PII_KEYS = new Set([
      "proprietario_nome",
      "proprietario_bi",
      "proprietario_contacto",
      "proprietario_localidade",
      "proprietario_provincia",
    ]);
    const sanitizedHist = ((hist ?? []) as HistoricoEvento[]).map((h) => ({
      ...h,
      diff: h.diff
        ? Object.fromEntries(Object.entries(h.diff).filter(([k]) => !PII_KEYS.has(k)))
        : h.diff,
    }));
    return {
      moto: publicizeMoto(moto),
      historico: sanitizedHist,
    };
  });

export const listMarketplace = createServerFn({ method: "GET" })
  .inputValidator((d: { marca?: string; provincia?: string; precoMax?: number }) =>
    z
      .object({
        marca: z.string().trim().optional(),
        provincia: z.string().trim().optional(),
        precoMax: z.number().positive().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<MotoPublica[]> => {
    let q = sb().from("motos").select("*").eq("estado", "a_venda");
    if (data.marca) q = q.eq("marca", data.marca);
    if (data.provincia) q = q.eq("proprietario_provincia", data.provincia);
    if (data.precoMax) q = q.lte("preco_venda", data.precoMax);
    const { data: rows, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => publicizeMoto(r as unknown as Moto));
  });

export const getMotoMarketplaceById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<MotoPublica | null> => {
    const { data: row, error } = await sb().from("motos").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return publicizeMoto(row as unknown as Moto);
  });

// =========== GESTÃO (sem auth nesta fase) ===========

export const listAllMotos = createServerFn({ method: "GET" })
  .inputValidator((d: { busca?: string; estado?: string }) =>
    z.object({ busca: z.string().optional(), estado: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<Moto[]> => {
    let q = sb().from("motos").select("*");
    if (data.estado && data.estado !== "todos") q = q.eq("estado", data.estado as unknown as Moto["estado"]);
    if (data.busca) {
      const term = `%${data.busca}%`;
      q = q.or(`chassi.ilike.${term},matricula.ilike.${term},proprietario_nome.ilike.${term},marca.ilike.${term},modelo.ilike.${term}`);
    }
    const { data: rows, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as unknown as Moto[];
  });

export const getMotoById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<Moto | null> => {
    const { data: row, error } = await sb().from("motos").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return (row as unknown as Moto) ?? null;
  });

export const createMoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => motoInputSchema.parse(d))
  .handler(async ({ data }): Promise<{ moto: Moto; codigo_recuperacao: string }> => {
    const { gerarCodigoRecuperacao, hashCodigo, prefixoCodigo } = await import("./seguranca.server");
    const codigo = gerarCodigoRecuperacao();
    const { data: row, error } = await sb()
      .from("motos")
      .insert({
        ...data,
        codigo_recuperacao_hash: await hashCodigo(codigo),
        codigo_recuperacao_prefixo: prefixoCodigo(codigo),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { moto: row as unknown as Moto, codigo_recuperacao: codigo };
  });

export const updateMoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: motoInputSchema.partial() }).parse(d),
  )
  .handler(async ({ data }): Promise<Moto> => {
    const { data: row, error } = await sb()
      .from("motos")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Moto;
  });

export const deleteMoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await sb().from("motos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const transferSchema = z.object({
  motoId: z.string().uuid(),
  novoProprietario: z.object({
    nome: z.string().trim().min(1).max(100),
    bi: z.string().trim().max(30).optional().nullable(),
    contacto: z.string().trim().max(30).optional().nullable(),
    localidade: z.string().trim().max(80).optional().nullable(),
    provincia: z.string().trim().max(40).optional().nullable(),
  }),
  valor: z.number().min(0).max(999_999_999).optional().nullable(),
  motivo: z.string().trim().max(500).optional().nullable(),
});

export const transferOwner = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => transferSchema.parse(d))
  .handler(async ({ data }): Promise<{ moto: Moto }> => {
    const supa = sb();
    const { data: current, error: e1 } = await supa
      .from("motos")
      .select("*")
      .eq("id", data.motoId)
      .single();
    if (e1 || !current) throw new Error(e1?.message || "Moto não encontrada");
    const old = current as unknown as Moto;

    const snapshotAnterior = {
      nome: old.proprietario_nome,
      bi: old.proprietario_bi,
      contacto: old.proprietario_contacto,
      localidade: old.proprietario_localidade,
      provincia: old.proprietario_provincia,
    };

    const { data: updated, error: e2 } = await supa
      .from("motos")
      .update({
        proprietario_nome: data.novoProprietario.nome,
        proprietario_bi: data.novoProprietario.bi ?? null,
        proprietario_contacto: data.novoProprietario.contacto ?? null,
        proprietario_localidade: data.novoProprietario.localidade ?? null,
        proprietario_provincia: data.novoProprietario.provincia ?? null,
        estado: "activa",
      })
      .eq("id", data.motoId)
      .select("*")
      .single();
    if (e2) throw new Error(e2.message);

    await supa.from("transferencias").insert({
      moto_id: data.motoId,
      proprietario_anterior: snapshotAnterior,
      proprietario_novo: data.novoProprietario,
      valor_transaccao: data.valor ?? null,
      motivo: data.motivo ?? null,
    });

    const valorTxt = data.valor != null ? ` por ${new Intl.NumberFormat("pt-PT").format(data.valor)} MT` : "";
    await supa.from("historico_motos").insert({
      moto_id: data.motoId,
      tipo_evento: "transferencia",
      descricao: `Transferida de ${snapshotAnterior.nome} para ${data.novoProprietario.nome}${valorTxt}`,
      diff: {
        proprietario: { antes: snapshotAnterior.nome, depois: data.novoProprietario.nome },
        valor_transaccao: { antes: null, depois: data.valor ?? null },
      },
      motivo: data.motivo ?? null,
    });

    return { moto: updated as unknown as Moto };
  });

export const listHistorico = createServerFn({ method: "GET" })
  .inputValidator((d: { tipo?: string }) =>
    z.object({ tipo: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let q = sb()
      .from("historico_motos")
      .select("*, motos:moto_id(chassi, marca, modelo)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.tipo && data.tipo !== "todos") {
      q = q.eq("tipo_evento", data.tipo as HistoricoEvento["tipo_evento"]);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<
      HistoricoEvento & { motos: { chassi: string; marca: string; modelo: string } | null }
    >;
  });

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const supa = sb();
  const { data: rows, error } = await supa.from("motos").select("estado, marca");
  if (error) throw new Error(error.message);
  const motos = (rows ?? []) as Pick<Moto, "estado" | "marca">[];
  const total = motos.length;
  const porEstado = motos.reduce<Record<string, number>>((acc, m) => {
    acc[m.estado] = (acc[m.estado] ?? 0) + 1;
    return acc;
  }, {});
  const porMarcaMap = motos.reduce<Record<string, number>>((acc, m) => {
    acc[m.marca] = (acc[m.marca] ?? 0) + 1;
    return acc;
  }, {});
  const porMarca = Object.entries(porMarcaMap)
    .map(([marca, total]) => ({ marca, total }))
    .sort((a, b) => b.total - a.total);

  const { count: histCount } = await supa
    .from("historico_motos")
    .select("*", { count: "exact", head: true });
  const { count: transCount } = await supa
    .from("transferencias")
    .select("*", { count: "exact", head: true });

  return {
    total,
    activas: porEstado.activa ?? 0,
    aVenda: porEstado.a_venda ?? 0,
    roubadas: porEstado.roubada ?? 0,
    transferidas: porEstado.transferida ?? 0,
    eventos: histCount ?? 0,
    transferencias: transCount ?? 0,
    porMarca,
  };
});

export type Transferencia_ = Transferencia;

/** Marca uma mota como roubada, registando o motivo no histórico. */
export const marcarComoRoubada = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      motivo: z.string().trim().min(5, "Descreva o motivo (mín. 5 caracteres)").max(500),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supa = sb();
    const { data: current, error: e1 } = await supa
      .from("motos")
      .select("id, estado")
      .eq("id", data.id)
      .single();
    if (e1 || !current) throw new Error(e1?.message ?? "Mota não encontrada");
    const anterior = (current as { estado: string }).estado;
    if (anterior === "roubada") throw new Error("Esta mota já está marcada como roubada.");

    const { error: e2 } = await supa
      .from("motos")
      .update({ estado: "roubada" })
      .eq("id", data.id);
    if (e2) throw new Error(e2.message);

    const { error: e3 } = await supa.from("historico_motos").insert({
      moto_id: data.id,
      tipo_evento: "mudanca_estado",
      descricao: "Mota declarada ROUBADA pelo operador",
      diff: { estado: { antes: anterior, depois: "roubada" } },
      motivo: data.motivo,
    });
    if (e3) throw new Error(e3.message);

    return { ok: true };
  });
