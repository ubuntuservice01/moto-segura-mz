import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Municipio = {
  id: string;
  nome: string;
  slug: string;
  provincia: string;
  distrito: string | null;
  endereco: string | null;
  contacto: string | null;
  contacto_alt: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  brasao_url: string | null;
  favicon_url: string | null;
  cor_principal: string;
  cor_secundaria: string;
  nome_plataforma: string | null;
  estado: "activo" | "suspenso";
  licenca_plano: string;
  licenca_validade: string | null;
  notas: string | null;
  created_at: string;
};

const municipioSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  provincia: z.string().trim().min(2).max(60),
  distrito: z.string().trim().max(80).optional().nullable(),
  endereco: z.string().trim().max(200).optional().nullable(),
  contacto: z.string().trim().max(40).optional().nullable(),
  contacto_alt: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(120).optional().nullable().or(z.literal("")),
  website: z.string().trim().max(160).optional().nullable(),
  logo_url: z.string().trim().max(500).optional().nullable(),
  brasao_url: z.string().trim().max(500).optional().nullable(),
  favicon_url: z.string().trim().max(500).optional().nullable(),
  cor_principal: z.string().trim().max(20).default("#006633"),
  cor_secundaria: z.string().trim().max(20).default("#FAF92A"),
  nome_plataforma: z.string().trim().max(120).optional().nullable(),
  licenca_plano: z.string().trim().max(40).default("base"),
  licenca_validade: z.string().trim().max(10).optional().nullable(),
  notas: z.string().trim().max(1000).optional().nullable(),
});

/** Indica se a plataforma já tem um Super Administrador configurado. */
export const estadoInstalacao = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ instalada: boolean }> => {
    const { existeSuperAdmin } = await import("./plataforma.server");
    return { instalada: await existeSuperAdmin() };
  },
);

/** Cria o primeiro Super Administrador — só funciona enquanto não existir nenhum. */
export const criarPrimeiroSuperAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        nome: z.string().trim().min(3).max(120),
        email: z.string().trim().email().max(160),
        palavraPasse: z.string().min(8).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { existeSuperAdmin, criarUtilizadorPlataforma } = await import("./plataforma.server");
    if (await existeSuperAdmin()) throw new Error("A plataforma já está instalada.");
    await criarUtilizadorPlataforma({
      email: data.email,
      nome: data.nome,
      papel: "super_admin",
      municipioId: null,
      palavraPasse: data.palavraPasse,
    });
    return { ok: true };
  });

/** Lista de municípios (Super Admin vê todos; restantes vêem o seu). */
export const listMunicipios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Municipio[]> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    let q = sbAdmin().from("municipios").select("*").order("nome");
    if (!ctx.superAdmin) q = q.eq("id", ctx.municipioId!);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Municipio[];
  });

/** Cria um Município e, automaticamente, o Administrador e o Técnico Municipais. */
export const criarMunicipio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => municipioSchema.parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      municipio: Municipio;
      credenciais: { papel: string; email: string; palavraPasse: string }[];
    }> => {
      const { contextoUtilizador } = await import("./auth.server");
      const { sbAdmin } = await import("./tenant.server");
      const { slugify, criarUtilizadorPlataforma } = await import("./plataforma.server");
      const ctx = await contextoUtilizador(context.userId);
      if (!ctx.superAdmin) throw new Error("Apenas a Ubuntu Service pode criar municípios.");

      const supa = sbAdmin();
      const base = slugify(data.nome);
      let slug = base;
      for (let i = 2; ; i++) {
        const { data: existe } = await supa
          .from("municipios")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!existe) break;
        slug = `${base}-${i}`;
      }

      const { data: row, error } = await supa
        .from("municipios")
        .insert({
          ...data,
          email: data.email || null,
          slug,
          nome_plataforma: data.nome_plataforma || `MotoGest ${data.nome}`,
        })
        .select("*")
        .single();
      if (error || !row) throw new Error(error?.message ?? "Falha ao criar município");
      const municipio = row as unknown as Municipio;

      const { data: modulos } = await supa.from("modulos").select("id, chave");
      if (modulos?.length) {
        await supa.from("municipio_modulos").insert(
          modulos.map((m) => ({
            municipio_id: municipio.id,
            modulo_id: m.id,
            activo: m.chave === "motorizadas",
          })),
        );
      }

      const admin = await criarUtilizadorPlataforma({
        email: `admin.${slug}@motogest.mz`,
        nome: `Administrador ${data.nome}`,
        papel: "admin_municipal",
        municipioId: municipio.id,
      });
      const tecnico = await criarUtilizadorPlataforma({
        email: `tecnico.${slug}@motogest.mz`,
        nome: `Técnico ${data.nome}`,
        papel: "tecnico_municipal",
        municipioId: municipio.id,
      });

      return {
        municipio,
        credenciais: [
          {
            papel: "Administrador Municipal",
            email: admin.email,
            palavraPasse: admin.palavraPasse,
          },
          { papel: "Técnico Municipal", email: tecnico.email, palavraPasse: tecnico.palavraPasse },
        ],
      };
    },
  );

/** Actualiza dados institucionais e identidade visual de um município. */
export const actualizarMunicipio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: municipioSchema.partial() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador, exigirPermissao } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) {
      exigirPermissao(ctx, "municipio.configurar");
      if (data.id !== ctx.municipioId) throw new Error("Sem permissão para outro município.");
    }
    const { error } = await sbAdmin().from("municipios").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Activa ou suspende um município. */
export const alterarEstadoMunicipio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), estado: z.enum(["activo", "suspenso"]) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) throw new Error("Apenas a Ubuntu Service pode alterar o estado.");
    const { error } = await sbAdmin()
      .from("municipios")
      .update({ estado: data.estado })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Elimina um município — apenas quando não tiver motorizadas registadas. */
export const eliminarMunicipio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) throw new Error("Apenas a Ubuntu Service pode eliminar municípios.");
    const supa = sbAdmin();
    const { count } = await supa
      .from("motos")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", data.id);
    if ((count ?? 0) > 0)
      throw new Error("Não é possível eliminar: este município já tem motorizadas registadas.");
    const { data: perfis } = await supa.from("perfis").select("id").eq("municipio_id", data.id);
    for (const p of perfis ?? []) await supa.auth.admin.deleteUser(p.id);
    const { error } = await supa.from("municipios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type EstatisticasNacionais = {
  municipios: { total: number; activos: number; suspensos: number };
  motos: { total: number; porEstado: Record<string, number> };
  utilizadores: { total: number; porPapel: Record<string, number> };
  esquadras: number;
  transferencias: number;
  ultimosRegistos: {
    id: string;
    chassi: string;
    marca: string;
    modelo: string;
    municipio: string;
    created_at: string;
  }[];
  ultimasTransferencias: { id: string; moto_id: string; municipio: string; created_at: string }[];
  ultimosReportes: { id: string; identificador: string; sucesso: boolean; created_at: string }[];
  porMunicipio: { nome: string; total: number }[];
};

/** Indicadores nacionais em tempo real (Super Administrador). */
export const estatisticasNacionais = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EstatisticasNacionais> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) throw new Error("Área exclusiva da Ubuntu Service.");
    const supa = sbAdmin();

    const [munis, motos, papeis, esquadras, transf, registos, transfRec, reportes] =
      await Promise.all([
        supa.from("municipios").select("id, nome, estado"),
        supa.from("motos").select("estado, municipio_id"),
        supa.from("utilizador_papeis").select("papel"),
        supa.from("esquadras").select("*", { count: "exact", head: true }),
        supa.from("transferencias").select("*", { count: "exact", head: true }),
        supa
          .from("motos")
          .select("id, chassi, marca, modelo, municipio_id, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supa
          .from("transferencias")
          .select("id, moto_id, municipio_id, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supa
          .from("reportes_roubo")
          .select("id, identificador, sucesso, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    const nomes = new Map((munis.data ?? []).map((m) => [m.id, m.nome]));
    const porEstado: Record<string, number> = {};
    const porMunicipioMap = new Map<string, number>();
    for (const m of motos.data ?? []) {
      porEstado[m.estado] = (porEstado[m.estado] ?? 0) + 1;
      const nome = nomes.get(m.municipio_id) ?? "—";
      porMunicipioMap.set(nome, (porMunicipioMap.get(nome) ?? 0) + 1);
    }
    const porPapel: Record<string, number> = {};
    for (const p of papeis.data ?? []) porPapel[p.papel] = (porPapel[p.papel] ?? 0) + 1;

    return {
      municipios: {
        total: munis.data?.length ?? 0,
        activos: (munis.data ?? []).filter((m) => m.estado === "activo").length,
        suspensos: (munis.data ?? []).filter((m) => m.estado === "suspenso").length,
      },
      motos: { total: motos.data?.length ?? 0, porEstado },
      utilizadores: { total: papeis.data?.length ?? 0, porPapel },
      esquadras: esquadras.count ?? 0,
      transferencias: transf.count ?? 0,
      ultimosRegistos: (registos.data ?? []).map((r) => ({
        id: r.id,
        chassi: r.chassi,
        marca: r.marca,
        modelo: r.modelo,
        municipio: nomes.get(r.municipio_id) ?? "—",
        created_at: r.created_at,
      })),
      ultimasTransferencias: (transfRec.data ?? []).map((t) => ({
        id: t.id,
        moto_id: t.moto_id,
        municipio: nomes.get(t.municipio_id ?? "") ?? "—",
        created_at: t.created_at,
      })),
      ultimosReportes: reportes.data ?? [],
      porMunicipio: [...porMunicipioMap.entries()]
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total),
    };
  });

export type UtilizadorPlataforma = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  papel: string;
  municipio: string | null;
  municipio_id: string | null;
  activo: boolean;
  created_at: string;
};

/** Utilizadores visíveis ao contexto actual. */
export const listUtilizadores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { municipioId?: string } | undefined) =>
    z.object({ municipioId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<UtilizadorPlataforma[]> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();
    let q = supa.from("perfis").select("*").order("created_at", { ascending: false });
    if (ctx.superAdmin) {
      if (data.municipioId) q = q.eq("municipio_id", data.municipioId);
    } else {
      q = q.eq("municipio_id", ctx.municipioId!);
    }
    const { data: perfis, error } = await q;
    if (error) throw new Error(error.message);
    const [{ data: papeis }, { data: munis }] = await Promise.all([
      supa.from("utilizador_papeis").select("user_id, papel"),
      supa.from("municipios").select("id, nome"),
    ]);
    const papelDe = new Map((papeis ?? []).map((p) => [p.user_id, p.papel]));
    const nomeDe = new Map((munis ?? []).map((m) => [m.id, m.nome]));
    return (perfis ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      papel: papelDe.get(p.id) ?? "—",
      municipio: p.municipio_id ? (nomeDe.get(p.municipio_id) ?? null) : null,
      municipio_id: p.municipio_id,
      activo: p.activo,
      created_at: p.created_at,
    }));
  });

/** Cria um utilizador municipal, da polícia ou global. */
export const criarUtilizador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        nome: z.string().trim().min(3).max(120),
        email: z.string().trim().email().max(160),
        telefone: z.string().trim().max(40).optional().nullable(),
        papel: z.enum(["super_admin", "admin_municipal", "tecnico_municipal", "policia"]),
        municipioId: z.string().uuid().optional().nullable(),
        esquadraId: z.string().uuid().optional().nullable(),
        palavraPasse: z.string().min(8).max(72).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ email: string; palavraPasse: string }> => {
    const { contextoUtilizador, exigirPermissao } = await import("./auth.server");
    const { criarUtilizadorPlataforma } = await import("./plataforma.server");
    const ctx = await contextoUtilizador(context.userId);
    let municipioId = data.municipioId ?? null;
    if (!ctx.superAdmin) {
      exigirPermissao(ctx, "utilizadores.gerir");
      if (data.papel === "super_admin" || data.papel === "admin_municipal")
        throw new Error("Sem permissão para criar este perfil.");
      municipioId = ctx.municipioId;
    }
    if (data.papel !== "super_admin" && !municipioId)
      throw new Error("Indique o município do utilizador.");
    const r = await criarUtilizadorPlataforma({
      email: data.email,
      nome: data.nome,
      telefone: data.telefone ?? null,
      papel: data.papel,
      municipioId,
      esquadraId: data.esquadraId ?? null,
      palavraPasse: data.palavraPasse,
    });
    return { email: r.email, palavraPasse: r.palavraPasse };
  });

/** Elimina um utilizador da plataforma. */
export const eliminarUtilizador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador, exigirPermissao } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (data.id === ctx.userId) throw new Error("Não pode eliminar a sua própria conta.");
    const supa = sbAdmin();
    const { data: alvo } = await supa
      .from("perfis")
      .select("municipio_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!ctx.superAdmin) {
      exigirPermissao(ctx, "utilizadores.gerir");
      if (!alvo || alvo.municipio_id !== ctx.municipioId)
        throw new Error("Sem permissão para este utilizador.");
    }
    const { error } = await supa.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Exportação de dados (backup) em JSON — nacional ou por município. */
export const exportarBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { municipioId?: string } | undefined) =>
    z.object({ municipioId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ gerado_em: string; json: string }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) throw new Error("Área exclusiva da Ubuntu Service.");
    const supa = sbAdmin();
    const tabelas = [
      "municipios",
      "esquadras",
      "motos",
      "historico_motos",
      "transferencias",
      "pre_registos",
      "avistamentos",
      "reportes_roubo",
    ] as const;
    const dados: Record<string, unknown[]> = {};
    for (const t of tabelas) {
      let q = supa.from(t as "motos").select("*");
      if (data.municipioId) {
        q =
          t === "municipios"
            ? q.eq("id", data.municipioId)
            : q.eq("municipio_id", data.municipioId);
      }
      const { data: rows } = await q;
      dados[t] = (rows ?? []) as unknown[];
    }
    return { gerado_em: new Date().toISOString(), json: JSON.stringify(dados) };
  });

/** Restauro de backup: repõe registos em falta sem apagar dados existentes. */
export const restaurarBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ json: z.string().min(2) }).parse(d))
  .handler(async ({ context, data }): Promise<{ reposto: Record<string, number> }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    if (!ctx.superAdmin) throw new Error("Área exclusiva da Ubuntu Service.");
    const supa = sbAdmin();
    const dados = JSON.parse(data.json) as Record<string, unknown[]>;
    const ordem = [
      "municipios",
      "esquadras",
      "motos",
      "historico_motos",
      "transferencias",
      "pre_registos",
      "avistamentos",
      "reportes_roubo",
    ];
    const reposto: Record<string, number> = {};
    for (const tabela of ordem) {
      const rows = dados[tabela];
      if (!rows?.length) continue;
      const { error } = await supa
        .from(tabela as "motos")
        .upsert(rows as never, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw new Error(`${tabela}: ${error.message}`);
      reposto[tabela] = rows.length;
    }
    return { reposto };
  });
