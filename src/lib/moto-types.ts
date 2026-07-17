export type EstadoMoto = "activa" | "a_venda" | "roubada" | "transferida";
export type TipoEvento = "registo" | "transferencia" | "actualizacao" | "mudanca_estado";

export type TipoDocumento = "bi" | "carta_conducao" | "livrete" | "factura" | "seguro" | "outro";

export const TIPOS_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  bi: "Bilhete de Identidade",
  carta_conducao: "Carta de Condução",
  livrete: "Livrete da Moto",
  factura: "Factura / Recibo",
  seguro: "Seguro",
  outro: "Outro documento",
};

export interface Documento {
  tipo: TipoDocumento;
  nome: string;
  path: string;
  mime: string;
  tamanho: number;
  carregado_em: string;
}

export interface Moto {
  id: string;
  chassi: string;
  matricula: string | null;
  marca: string;
  modelo: string;
  ano: number | null;
  cilindrada: number | null;
  cor: string | null;
  km: number | null;
  proprietario_nome: string;
  proprietario_bi: string | null;
  proprietario_contacto: string | null;
  proprietario_localidade: string | null;
  proprietario_distrito: string | null;
  proprietario_posto_admin: string | null;
  proprietario_provincia: string | null;
  estado: EstadoMoto;
  preco_venda: number | null;
  notas_internas: string | null;
  documentos: Documento[];
  created_at: string;
  updated_at: string;
}

/** Public-facing moto: removes BI, notas, documentos and masks contacto unless à venda */
export interface MotoPublica extends Omit<Moto, "proprietario_bi" | "notas_internas" | "proprietario_contacto" | "documentos"> {
  proprietario_contacto: string | null;
}


export type DiffValue = string | number | boolean | null;
export type DiffMap = Record<string, { antes: DiffValue; depois: DiffValue }>;

export interface HistoricoEvento {
  id: string;
  moto_id: string;
  tipo_evento: TipoEvento;
  descricao: string;
  diff: DiffMap | null;
  operador: string;
  motivo: string | null;
  created_at: string;
}

export interface Transferencia {
  id: string;
  moto_id: string;
  proprietario_anterior: Record<string, string | null>;
  proprietario_novo: Record<string, string | null>;
  valor_transaccao: number | null;
  motivo: string | null;
  operador: string;
  created_at: string;
}

export const PROVINCIAS_MZ = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
] as const;

export const ESTADOS_LABEL: Record<EstadoMoto, string> = {
  activa: "Activa",
  a_venda: "À Venda",
  roubada: "Roubada",
  transferida: "Transferida",
};

export function maskChassi(chassi: string): string {
  if (chassi.length <= 6) return chassi;
  const start = chassi.slice(0, 4);
  const end = chassi.slice(-4);
  const middleLen = chassi.length - 8;
  return `${start}${"•".repeat(middleLen)}${end}`;
}

export function publicizeMoto(m: Moto): MotoPublica {
  const showContact = m.estado === "a_venda" || m.estado === "roubada";
  return {
    id: m.id,
    chassi: m.chassi,
    matricula: m.matricula,
    marca: m.marca,
    modelo: m.modelo,
    ano: m.ano,
    cilindrada: m.cilindrada,
    cor: m.cor,
    km: m.km,
    proprietario_nome: m.proprietario_nome,
    proprietario_contacto: showContact ? m.proprietario_contacto : null,
    proprietario_localidade: m.proprietario_localidade,
    proprietario_distrito: m.proprietario_distrito,
    proprietario_posto_admin: m.proprietario_posto_admin,
    proprietario_provincia: m.proprietario_provincia,
    estado: m.estado,
    preco_venda: m.preco_venda,
    created_at: m.created_at,
    updated_at: m.updated_at,
  };
}

export function formatMTN(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(value) + " MT";
}

export function formatKm(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-PT").format(value) + " km";
}
