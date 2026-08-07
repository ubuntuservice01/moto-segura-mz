// Contexto de utilizador/tenant — apenas servidor.
import { sbAdmin } from "./tenant.server";
import { pode, type Papel, type Permissao } from "./permissoes";

export type ContextoUtilizador = {
  userId: string;
  nome: string;
  email: string | null;
  papel: Papel;
  papeis: Papel[];
  municipioId: string | null;
  esquadraId: string | null;
  superAdmin: boolean;
  municipio: {
    id: string;
    nome: string;
    slug: string;
    provincia: string;
    estado: "activo" | "suspenso";
    cor_principal: string;
    cor_secundaria: string;
    logo_url: string | null;
    nome_plataforma: string | null;
  } | null;
};

const ORDEM: Papel[] = ["super_admin", "admin_municipal", "tecnico_municipal", "policia"];

export async function contextoUtilizador(userId: string): Promise<ContextoUtilizador> {
  const supa = sbAdmin();
  const [{ data: perfil }, { data: papeisRows }] = await Promise.all([
    supa.from("perfis").select("*").eq("id", userId).maybeSingle(),
    supa.from("utilizador_papeis").select("papel").eq("user_id", userId),
  ]);

  const papeis = (papeisRows ?? []).map((r) => r.papel as Papel);
  if (papeis.length === 0)
    throw new Error("Utilizador sem perfil atribuído. Contacte a Ubuntu Service.");
  const papel = ORDEM.find((p) => papeis.includes(p)) ?? papeis[0]!;
  const superAdmin = papeis.includes("super_admin");
  const municipioId = perfil?.municipio_id ?? null;

  let municipio: ContextoUtilizador["municipio"] = null;
  if (municipioId) {
    const { data } = await supa
      .from("municipios")
      .select(
        "id, nome, slug, provincia, estado, cor_principal, cor_secundaria, logo_url, nome_plataforma",
      )
      .eq("id", municipioId)
      .maybeSingle();
    municipio = (data as ContextoUtilizador["municipio"]) ?? null;
    if (municipio && municipio.estado === "suspenso" && !superAdmin) {
      throw new Error("O acesso deste Município está suspenso. Contacte a Ubuntu Service.");
    }
  }

  if (!superAdmin && !municipioId) {
    throw new Error("Utilizador sem município atribuído. Contacte o administrador.");
  }

  return {
    userId,
    nome: perfil?.nome || "",
    email: perfil?.email ?? null,
    papel,
    papeis,
    municipioId,
    esquadraId: perfil?.esquadra_id ?? null,
    superAdmin,
    municipio,
  };
}

/** Município a usar na operação; o super admin pode indicar um explicitamente. */
export function tenantAlvo(ctx: ContextoUtilizador, pedido?: string | null): string {
  if (ctx.superAdmin) {
    if (pedido) return pedido;
    if (ctx.municipioId) return ctx.municipioId;
    throw new Error("Seleccione um município para esta operação.");
  }
  if (pedido && pedido !== ctx.municipioId)
    throw new Error("Sem permissão para operar noutro município.");
  return ctx.municipioId!;
}

export function exigirPermissao(ctx: ContextoUtilizador, permissao: Permissao): void {
  if (!pode(ctx.papel, permissao)) throw new Error("Sem permissão para esta operação.");
}
