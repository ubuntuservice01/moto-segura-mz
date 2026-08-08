import { jsPDF } from "jspdf";
import {
  ESTADOS_LABEL,
  formatKm,
  formatMTN,
  maskChassi,
  type HistoricoEvento,
  type MotoPublica,
} from "@/lib/moto-types";

export interface IdentidadeOpcoes {
  /** Nome da entidade emissora impresso no cabeçalho */
  entidade: string;
  /** Linha secundária (lema / departamento) */
  subtitulo: string;
  /** Cor institucional principal em hex, ex: #006633 */
  corPrincipal: string;
  /** Cor de destaque em hex, ex: #FAF92A */
  corDestaque: string;
  /** Rodapé personalizado */
  rodape: string;
  /** Incluir logótipo (data URL PNG) */
  incluirLogo: boolean;
  logoDataUrl?: string | null;
  /** Mostrar chassi completo ou mascarado */
  chassiCompleto: boolean;
  /** Incluir a timeline de histórico na ficha */
  incluirHistorico: boolean;
}

export const IDENTIDADE_PADRAO: IdentidadeOpcoes = {
  entidade: "MotoCheck MZ",
  subtitulo: "Registo Nacional de Motociclos - Ubuntu Service",
  corPrincipal: "#006633",
  corDestaque: "#FAF92A",
  rodape: "Documento gerado por MotoCheck MZ — Ubuntu Service",
  incluirLogo: true,
  logoDataUrl: null,
  chassiCompleto: true,
  incluirHistorico: true,
};

const TIPO_LABEL: Record<string, string> = {
  registo: "Registo",
  transferencia: "Transferência",
  actualizacao: "Actualização",
  mudanca_estado: "Mudança de estado",
};

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 102, 51];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function dataStr(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}

/** Substitui glifos ausentes nas fontes base do PDF */
function txt(s: string): string {
  return s.replace(/→/g, "->").replace(/[•·]/g, "*").replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

/** Converte um asset (url) em data URL para embutir no PDF */
export async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Desenha a assinatura visual do chassi (mesma lógica do componente web) */
function desenharFingerprint(
  doc: jsPDF,
  chassi: string,
  cx: number,
  cy: number,
  raioMax: number,
  cor: [number, number, number],
) {
  const seed = chassi.split("").reduce((acc, c) => (acc * 33 + c.charCodeAt(0)) % 997, 7);
  const offset = (seed % 8) - 4;
  doc.setLineWidth(0.35);
  doc.setDrawColor(...cor);
  for (let i = 0; i < 7; i++) {
    const r = ((18 + i * 6 + (offset * i) / 10) / 60) * raioMax;
    const start = (seed * (i + 1)) % 360;
    const sweep = 220 + ((seed >> i) % 100);
    const steps = Math.max(12, Math.round(sweep / 8));
    let prev = polar(cx, cy, r, start);
    for (let s = 1; s <= steps; s++) {
      const p = polar(cx, cy, r, start + (sweep * s) / steps);
      doc.line(prev.x, prev.y, p.x, p.y);
      prev = p;
    }
  }
  doc.setFillColor(...cor);
  doc.circle(cx, cy, 0.9, "F");
}

function cabecalho(doc: jsPDF, o: IdentidadeOpcoes, titulo: string) {
  const principal = rgb(o.corPrincipal);
  const destaque = rgb(o.corDestaque);
  doc.setFillColor(...principal);
  doc.rect(0, 0, 210, 30, "F");
  doc.setFillColor(...destaque);
  doc.rect(0, 30, 210, 1.6, "F");

  let textX = 16;
  if (o.incluirLogo && o.logoDataUrl) {
    try {
      doc.addImage(o.logoDataUrl, "PNG", 15, 7, 16, 16);
      textX = 36;
    } catch {
      /* logo inválido — ignora */
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(txt(o.entidade), textX, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(txt(o.subtitulo), textX, 21);
  doc.setFontSize(8);
  doc.text(titulo.toUpperCase(), 195, 21, { align: "right" });
}

function rodape(doc: jsPDF, o: IdentidadeOpcoes) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 283, 195, 283);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(txt(o.rodape), 15, 288);
    doc.text(`Página ${p}/${total}`, 195, 288, { align: "right" });
  }
}

/** Ficha completa A4 da mota, com resumo do chassi e timeline */
export function gerarFichaPDF(
  moto: MotoPublica,
  historico: HistoricoEvento[],
  opts: IdentidadeOpcoes,
) {
  const o = { ...IDENTIDADE_PADRAO, ...opts };
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const principal = rgb(o.corPrincipal);
  const chassi = o.chassiCompleto ? moto.chassi : maskChassi(moto.chassi);

  cabecalho(doc, o, "Ficha da mota");

  // Bloco de identificação
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(txt(`${moto.marca} ${moto.modelo}`), 15, 47);
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(txt(`Chassi: ${chassi}`), 15, 54);
  if (moto.matricula) doc.text(`Matrícula: ${moto.matricula}`, 15, 59.5);

  // Estado
  doc.setFillColor(...principal);
  doc.roundedRect(150, 40, 45, 9, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(ESTADOS_LABEL[moto.estado].toUpperCase(), 172.5, 46.2, { align: "center" });

  // Assinatura do chassi
  desenharFingerprint(doc, moto.chassi, 172.5, 70, 15, principal);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text("ASSINATURA DO CHASSI", 172.5, 88, { align: "center" });

  const linhas: Array<[string, string]> = [
    ["Ano", moto.ano ? String(moto.ano) : "—"],
    ["Cilindrada", moto.cilindrada ? `${moto.cilindrada} cc` : "—"],
    ["Cor", moto.cor ?? "—"],
    ["Quilometragem", formatKm(moto.km)],
    ["Proprietário", moto.proprietario_nome],
    ["Contacto", moto.proprietario_contacto ?? "Protegido"],
    [
      "Localização",
      [moto.proprietario_posto_admin, moto.proprietario_distrito, moto.proprietario_provincia]
        .filter(Boolean)
        .join(" / ") || "—",
    ],
    ["Preço pedido", moto.estado === "a_venda" ? formatMTN(moto.preco_venda) : "—"],
    ["Registado em", dataStr(moto.created_at)],
  ];

  let y = 70;
  doc.setFontSize(9);
  linhas.forEach(([k, v], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(247, 247, 247);
      doc.rect(15, y - 4.6, 125, 8, "F");
    }
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(k.toUpperCase(), 18, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(txt(v), 70)[0] ?? "—", 70, y);
    y += 8;
  });

  // Timeline
  if (o.incluirHistorico) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text("Histórico da mota", 15, y);
    y += 7;

    if (!historico.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Sem histórico registado.", 15, y);
    }

    historico.forEach((e) => {
      const detalhes: string[] = [];
      if (e.diff) {
        for (const [campo, raw] of Object.entries(e.diff)) {
          // Registos iniciais guardam valores simples; actualizações guardam {antes, depois}
          const val = raw as unknown;
          if (val === null || val === undefined) continue;
          if (typeof val !== "object") {
            detalhes.push(txt(`${campo}: ${val}`));
            continue;
          }
          const { antes, depois } = val as { antes?: unknown; depois?: unknown };
          const a = antes === null || antes === undefined || antes === "" ? null : antes;
          const d = depois === null || depois === undefined || depois === "" ? null : depois;
          if (a === null && d === null) continue;
          detalhes.push(txt(a === null ? `${campo}: ${d}` : `${campo}: ${a} -> ${d ?? "—"}`));
        }
      }
      if (e.motivo) detalhes.push(txt(`Motivo: ${e.motivo}`));
      const desc = doc.splitTextToSize(txt(e.descricao), 160) as string[];
      const bloco = 10 + desc.length * 4.2 + detalhes.length * 4;

      if (y + bloco > 275) {
        doc.addPage();
        cabecalho(doc, o, "Ficha da mota");
        y = 45;
      }

      doc.setFillColor(...principal);
      doc.circle(18, y - 1.2, 1.6, "F");
      doc.setDrawColor(225, 225, 225);
      doc.line(18, y + 1, 18, y + bloco - 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...principal);
      doc.text((TIPO_LABEL[e.tipo_evento] ?? e.tipo_evento).toUpperCase(), 24, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 140, 140);
      doc.text(dataStr(e.created_at), 195, y, { align: "right" });

      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(desc, 24, y + 4.8);
      let dy = y + 4.8 + desc.length * 4.2;
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      detalhes.forEach((d) => {
        doc.text(doc.splitTextToSize(d, 155)[0] ?? "", 24, dy);
        dy += 4;
      });
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(txt(`Operador: ${e.operador}`), 24, dy);
      y = dy + 7;
    });
  }

  rodape(doc, o);
  doc.save(`ficha-${moto.chassi}.pdf`);
}

/** Livrete em formato cartão (85,6 × 54 mm), frente e verso */
export function gerarLivretePDF(moto: MotoPublica, opts: IdentidadeOpcoes) {
  const o = { ...IDENTIDADE_PADRAO, ...opts };
  const W = 85.6;
  const H = 54;
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "landscape" });
  const principal = rgb(o.corPrincipal);
  const destaque = rgb(o.corDestaque);
  const chassi = o.chassiCompleto ? moto.chassi : maskChassi(moto.chassi);

  // ---- FRENTE ----
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...principal);
  doc.rect(0, 0, W, 13, "F");
  doc.setFillColor(...destaque);
  doc.rect(0, 13, W, 1, "F");

  let tx = 4;
  if (o.incluirLogo && o.logoDataUrl) {
    try {
      doc.addImage(o.logoDataUrl, "PNG", 3.5, 2.5, 8, 8);
      tx = 14;
    } catch {
      /* ignora */
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(txt(o.entidade), tx, 6.6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.4);
  doc.text("LIVRETE DIGITAL DE MOTOCICLO", tx, 10);

  // Estado no canto superior direito
  doc.setFillColor(...destaque);
  doc.roundedRect(W - 26, 3.6, 22, 5, 1.2, 1.2, "F");
  doc.setTextColor(25, 25, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.4);
  doc.text(ESTADOS_LABEL[moto.estado].toUpperCase(), W - 15, 6.9, { align: "center" });

  desenharFingerprint(doc, moto.chassi, 70, 34, 11, principal);

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(txt(`${moto.marca} ${moto.modelo}`), 48)[0] ?? "", 4, 19.5);

  const campos: Array<[string, string]> = [
    ["CHASSI", chassi],
    ["MATRÍCULA", moto.matricula ?? "—"],
    ["ANO / CC", `${moto.ano ?? "—"} - ${moto.cilindrada ?? "—"} cc`],
    ["PROPRIETÁRIO", moto.proprietario_nome],
    ["PROVÍNCIA", moto.proprietario_provincia ?? "—"],
  ];
  let cy = 25;
  campos.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.9);
    doc.setTextColor(130, 130, 130);
    doc.text(k, 4, cy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(25, 25, 25);
    doc.text(doc.splitTextToSize(txt(v), 48)[0] ?? "—", 4, cy + 3.1);
    cy += 5.6;
  });

  // ---- VERSO ----
  doc.addPage([W, H], "landscape");
  doc.setFillColor(...principal);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(3, 3, W - 6, H - 6, 2, 2, "F");

  doc.setTextColor(...principal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("VERIFICAÇÃO", 6, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(70, 70, 70);
  doc.text(
    doc.splitTextToSize(
      txt(
        `Consulte o estado actual desta mota em motocheck-mz.lovable.app/verificar usando o chassi ${chassi}. Este livrete é um comprovativo de registo e não substitui documentação oficial emitida pelas autoridades.`,
      ),
      W - 12,
    ) as string[],
    6,
    15,
  );

  doc.setFontSize(4.4);
  doc.setTextColor(120, 120, 120);
  doc.text("EMITIDO EM", 6, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(25, 25, 25);
  doc.text(new Date().toLocaleDateString("pt-PT", { dateStyle: "long" }), 6, 39.5);

  doc.setDrawColor(200, 200, 200);
  doc.line(46, 42, 79, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.4);
  doc.setTextColor(130, 130, 130);
  doc.text("Assinatura / carimbo do emissor", 62.5, 45, { align: "center" });

  doc.setFontSize(4.2);
  doc.setTextColor(150, 150, 150);
  doc.text(doc.splitTextToSize(txt(o.rodape), W - 12)[0] ?? "", 6, H - 6);

  doc.save(`livrete-${moto.chassi}.pdf`);
}
