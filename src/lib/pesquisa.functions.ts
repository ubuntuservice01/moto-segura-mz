import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ResultadoPesquisaNacional = {
  id: string;
  chassi: string;
  matricula: string | null;
  numero_motor: string | null;
  marca: string;
  modelo: string;
  cor: string | null;
  estado: string;
  municipio_id: string;
  municipio_nome: string;
  created_at: string;
  // Campos protegidos — visíveis apenas para papéis com permissão
  proprietario_nome?: string | null;
  proprietario_bi?: string | null;
  proprietario_contacto?: string | null;
  proprietario_endereco?: string | null;
};

export type TipoPesquisa = "chassi" | "matricula" | "motor";

/**
 * Pesquisa Nacional — procura em todos os municípios.
 * O nível de detalhe do resultado depende do papel do utilizador:
 *  - super_admin / admin_municipal / policia → dados completos incluindo proprietário
 *  - tecnico_municipal a pesquisar fora do seu município → só dados básicos (sem proprietário)
 */
export const pesquisaNacional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        termo: z.string().trim().min(2).max(100),
        tipo: z.enum(["chassi", "matricula", "motor"]),
      })
      .parse(d),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{ resultados: ResultadoPesquisaNacional[]; totalEncontrado: number }> => {
      const { contextoUtilizador } = await import("./auth.server");
      const { sbAdmin } = await import("./tenant.server");
      const ctx = await contextoUtilizador(context.userId);
      const supa = sbAdmin();

      const campoFiltro =
        data.tipo === "chassi"
          ? "chassi"
          : data.tipo === "matricula"
            ? "matricula"
            : "numero_motor";

      const termoLike = `%${data.termo.toUpperCase()}%`;

      const { data: motas, error } = await supa
        .from("motos")
        .select(
          "id, chassi, matricula, numero_motor, marca, modelo, cor, estado, municipio_id, created_at, proprietario_nome, proprietario_bi, proprietario_contacto, proprietario_endereco",
        )
        .ilike(campoFiltro, termoLike)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);

      // Carregar nomes dos municípios
      const municipioIds = [...new Set((motas ?? []).map((m) => m.municipio_id))];
      const { data: munis } = await supa
        .from("municipios")
        .select("id, nome")
        .in("id", municipioIds.length > 0 ? municipioIds : ["00000000-0000-0000-0000-000000000000"]);
      const nomeMunicipio = new Map((munis ?? []).map((m) => [m.id, m.nome]));

      // Papéis com acesso a dados pessoais do proprietário
      const podeDadosPessoais =
        ctx.superAdmin ||
        ctx.papel === "admin_municipal" ||
        ctx.papel === "policia";

      const resultados: ResultadoPesquisaNacional[] = (motas ?? []).map((m) => {
        // Técnico a ver mota do seu próprio município → acesso completo
        const mesmomunicipio = m.municipio_id === ctx.municipioId;
        const acessoCompleto = podeDadosPessoais || mesmomunicipio;

        return {
          id: m.id,
          chassi: m.chassi,
          matricula: m.matricula ?? null,
          numero_motor: m.numero_motor ?? null,
          marca: m.marca,
          modelo: m.modelo,
          cor: m.cor ?? null,
          estado: m.estado,
          municipio_id: m.municipio_id,
          municipio_nome: nomeMunicipio.get(m.municipio_id) ?? "—",
          created_at: m.created_at,
          // Dados pessoais: só visíveis com acesso completo
          proprietario_nome: acessoCompleto ? (m.proprietario_nome ?? null) : undefined,
          proprietario_bi: acessoCompleto ? (m.proprietario_bi ?? null) : undefined,
          proprietario_contacto: acessoCompleto ? (m.proprietario_contacto ?? null) : undefined,
          proprietario_endereco: acessoCompleto ? (m.proprietario_endereco ?? null) : undefined,
        };
      });

      return { resultados, totalEncontrado: resultados.length };
    },
  );
