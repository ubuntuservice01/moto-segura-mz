// Helpers server-only do painel Ubuntu Service.
import { sbAdmin } from "./tenant.server";

export function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function gerarPalavraPasse(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const num = "23456789";
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `${pick(abc, 4)}-${pick(num, 4)}-${pick(abc, 2)}${pick(num, 2)}`;
}

export type NovoUtilizador = {
  email: string;
  nome: string;
  papel: "super_admin" | "admin_municipal" | "tecnico_municipal" | "policia";
  municipioId: string | null;
  esquadraId?: string | null;
  telefone?: string | null;
  palavraPasse?: string;
};

/** Cria utilizador na autenticação + perfil + papel. Devolve a palavra-passe gerada. */
export async function criarUtilizadorPlataforma(u: NovoUtilizador): Promise<{
  userId: string;
  email: string;
  palavraPasse: string;
}> {
  const supa = sbAdmin();
  const palavraPasse = u.palavraPasse ?? gerarPalavraPasse();
  const { data, error } = await supa.auth.admin.createUser({
    email: u.email,
    password: palavraPasse,
    email_confirm: true,
    user_metadata: { nome: u.nome },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Falha ao criar utilizador");
  const userId = data.user.id;

  const { error: ePerfil } = await supa.from("perfis").insert({
    id: userId,
    municipio_id: u.municipioId,
    esquadra_id: u.esquadraId ?? null,
    nome: u.nome,
    email: u.email,
    telefone: u.telefone ?? null,
  });
  if (ePerfil) throw new Error(ePerfil.message);

  const { error: ePapel } = await supa
    .from("utilizador_papeis")
    .insert({ user_id: userId, papel: u.papel, municipio_id: u.municipioId });
  if (ePapel) throw new Error(ePapel.message);

  return { userId, email: u.email, palavraPasse };
}

export async function existeSuperAdmin(): Promise<boolean> {
  const { count } = await sbAdmin()
    .from("utilizador_papeis")
    .select("*", { count: "exact", head: true })
    .eq("papel", "super_admin");
  return (count ?? 0) > 0;
}

export async function contarMotasPorEstado(municipioId?: string | null) {
  let q = sbAdmin().from("motos").select("estado");
  if (municipioId) q = q.eq("municipio_id", municipioId);
  const { data } = await q;
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.estado] = (out[r.estado] ?? 0) + 1;
  return out;
}
