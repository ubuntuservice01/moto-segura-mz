// Matriz de permissões da plataforma — módulo partilhado (cliente e servidor).

export type Papel = "super_admin" | "admin_municipal" | "tecnico_municipal" | "policia";

export const PAPEL_LABEL: Record<Papel, string> = {
  super_admin: "Super Administrador (Ubuntu Service)",
  admin_municipal: "Administrador Municipal",
  tecnico_municipal: "Técnico Municipal",
  policia: "Polícia",
};

export type Permissao =
  | "motos.ver"
  | "motos.criar"
  | "motos.editar"
  | "motos.eliminar"
  | "motos.transferir"
  | "motos.estado"
  | "motos.documentos"
  | "pre_registos.gerir"
  | "seguranca.ver"
  | "seguranca.recuperar"
  | "ocorrencias.registar"
  | "relatorios.ver"
  | "esquadras.gerir"
  | "utilizadores.gerir"
  | "municipio.configurar"
  | "plataforma.gerir";

const MUNICIPAL_BASE: Permissao[] = [
  "motos.ver",
  "motos.criar",
  "motos.editar",
  "motos.transferir",
  "motos.documentos",
  "pre_registos.gerir",
  "seguranca.ver",
  "relatorios.ver",
];

export const PERMISSOES: Record<Papel, Permissao[]> = {
  super_admin: [
    ...MUNICIPAL_BASE,
    "motos.eliminar",
    "motos.estado",
    "seguranca.recuperar",
    "ocorrencias.registar",
    "esquadras.gerir",
    "utilizadores.gerir",
    "municipio.configurar",
    "plataforma.gerir",
  ],
  admin_municipal: [
    ...MUNICIPAL_BASE,
    "motos.eliminar",
    "motos.estado",
    "seguranca.recuperar",
    "esquadras.gerir",
    "utilizadores.gerir",
    "municipio.configurar",
  ],
  tecnico_municipal: [...MUNICIPAL_BASE],
  policia: ["motos.ver", "seguranca.ver", "seguranca.recuperar", "ocorrencias.registar", "relatorios.ver"],
};

export function pode(papel: Papel | null | undefined, permissao: Permissao): boolean {
  if (!papel) return false;
  return PERMISSOES[papel]?.includes(permissao) ?? false;
}
