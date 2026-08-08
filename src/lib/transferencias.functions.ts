import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Moto } from "./moto-types";

export type EstadoTransferencia =
  | "pendente_aceitacao"
  | "aguardando_origem"
  | "concluida"
  | "rejeitada";
export type TipoFluxoTransferencia = "origem_inicia" | "destino_solicita";

export interface ItemTransferencia {
  id: string;
  moto_id: string;
  municipio_id: string;
  municipio_origem_id: string;
  municipio_origem_nome: string;
  municipio_destino_id: string;
  municipio_destino_nome: string;
  utilizador_origem_id: string | null;
  utilizador_destino_id: string | null;
  estado: EstadoTransferencia;
  tipo_fluxo: TipoFluxoTransferencia;
  proprietario_anterior: Record<string, any>;
  proprietario_novo: Record<string, any>;
  valor_transaccao: number | null;
  motivo: string | null;
  motivo_rejeicao: string | null;
  operador: string;
  created_at: string;
  data_conclusao: string | null;
  moto: {
    chassi: string;
    matricula: string | null;
    marca: string;
    modelo: string;
    cor: string | null;
    estado: string;
  } | null;
}

const proprietarioNovoSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório").max(120),
  bi: z.string().trim().max(40).optional().nullable(),
  contacto: z.string().trim().max(40).optional().nullable(),
  contacto_alt: z.string().trim().max(40).optional().nullable(),
  familiar_nome: z.string().trim().max(120).optional().nullable(),
  familiar_contacto: z.string().trim().max(40).optional().nullable(),
  endereco: z.string().trim().max(200).optional().nullable(),
  localidade: z.string().trim().max(80).optional().nullable(),
  provincia: z.string().trim().max(60).optional().nullable(),
  data_nascimento: z.string().trim().max(10).optional().nullable(),
});

/**
 * FORMA A — ORIGEM INICIA TRANSFERÊNCIA
 * O município proprietário da moto inicia a transferência para outro município.
 */
export const iniciarTransferenciaOrigem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        motoId: z.string().uuid(),
        municipioDestinoId: z.string().uuid(),
        novoProprietario: proprietarioNovoSchema,
        valor: z.number().min(0).optional().nullable(),
        motivo: z.string().trim().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    // 1. Carregar mota
    const { data: moto, error: e1 } = await supa
      .from("motos")
      .select("*")
      .eq("id", data.motoId)
      .single();
    if (e1 || !moto) throw new Error("Motorizada não encontrada.");

    if (!ctx.superAdmin && moto.municipio_id !== ctx.municipioId) {
      throw new Error("Sem permissão para transferir motorizada de outro município.");
    }

    if (moto.municipio_id === data.municipioDestinoId) {
      throw new Error("O município de destino deve ser diferente do município actual.");
    }

    // 2. Verificar se já existe transferência activa
    const { data: ativa } = await supa
      .from("transferencias")
      .select("id")
      .eq("moto_id", data.motoId)
      .in("estado", ["pendente_aceitacao", "aguardando_origem"])
      .maybeSingle();

    if (ativa) {
      throw new Error("Esta motorizada possui uma transferência em andamento.");
    }

    // 3. Obter nome dos municípios
    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", [moto.municipio_id, data.municipioDestinoId]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    const snapshotAnterior = {
      nome: moto.proprietario_nome,
      bi: moto.proprietario_bi,
      contacto: moto.proprietario_contacto,
      contacto_alt: moto.proprietario_contacto_alt,
      familiar_nome: moto.proprietario_familiar_nome,
      familiar_contacto: moto.proprietario_familiar_contacto,
      endereco: moto.proprietario_endereco,
      localidade: moto.proprietario_localidade,
      provincia: moto.proprietario_provincia,
      data_nascimento: moto.proprietario_data_nascimento,
    };

    // 4. Inserir processo de transferência
    const { data: row, error: e2 } = await supa
      .from("transferencias")
      .insert({
        moto_id: data.motoId,
        municipio_id: moto.municipio_id,
        municipio_origem_id: moto.municipio_id,
        municipio_destino_id: data.municipioDestinoId,
        utilizador_origem_id: ctx.userId,
        estado: "pendente_aceitacao",
        tipo_fluxo: "origem_inicia",
        proprietario_anterior: snapshotAnterior,
        proprietario_novo: data.novoProprietario,
        valor_transaccao: data.valor ?? null,
        motivo: data.motivo ?? null,
        operador: ctx.nome,
      })
      .select("id")
      .single();

    if (e2 || !row) throw new Error(e2?.message ?? "Erro ao registar transferência");

    // 5. Notificar Município de destino
    const nomeOrigem = nomesMap.get(moto.municipio_id) ?? "Município de Origem";
    await supa.from("notificacoes").insert({
      tipo: "transferencia_recebida",
      municipio_id: data.municipioDestinoId,
      titulo: "Nova transferência de motorizada recebida",
      mensagem: `O ${nomeOrigem} iniciou a transferência da motorizada ${moto.marca} ${moto.modelo} (${moto.chassi}).`,
      moto_id: data.motoId,
      payload: { transferencia_id: row.id },
    });

    // 6. Registar Histórico
    await supa.from("historico_motos").insert({
      moto_id: data.motoId,
      municipio_id: moto.municipio_id,
      tipo_evento: "transferencia",
      descricao: `Transferência iniciada por ${nomeOrigem} para ${nomesMap.get(data.municipioDestinoId) ?? "Destino"}`,
      diff: {
        proprietario: { antes: moto.proprietario_nome, depois: data.novoProprietario.nome },
        municipio: { antes: nomeOrigem, depois: nomesMap.get(data.municipioDestinoId) ?? "—" },
      },
      operador: ctx.nome,
      motivo: data.motivo ?? null,
    });

    return { id: row.id };
  });

/**
 * FORMA B — DESTINO SOLICITA TRANSFERÊNCIA
 * Um técnico pesquisa a moto de outro município e solicita a transferência.
 */
export const solicitarTransferenciaDestino = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        motoId: z.string().uuid(),
        novoProprietario: proprietarioNovoSchema,
        valor: z.number().min(0).optional().nullable(),
        motivo: z.string().trim().min(3, "Indique o motivo da solicitação").max(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    const { data: moto, error: e1 } = await supa
      .from("motos")
      .select("*")
      .eq("id", data.motoId)
      .single();
    if (e1 || !moto) throw new Error("Motorizada não encontrada.");

    if (!ctx.superAdmin && moto.municipio_id === ctx.municipioId) {
      throw new Error("Esta motorizada já pertence ao seu município.");
    }

    // Verificar se já existe transferência activa
    const { data: ativa } = await supa
      .from("transferencias")
      .select("id")
      .eq("moto_id", data.motoId)
      .in("estado", ["pendente_aceitacao", "aguardando_origem"])
      .maybeSingle();

    if (ativa) {
      throw new Error("Esta motorizada possui uma transferência em andamento.");
    }

    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", [moto.municipio_id, ctx.municipioId!]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    const snapshotAnterior = {
      nome: moto.proprietario_nome,
      bi: moto.proprietario_bi,
      contacto: moto.proprietario_contacto,
      contacto_alt: moto.proprietario_contacto_alt,
      familiar_nome: moto.proprietario_familiar_nome,
      familiar_contacto: moto.proprietario_familiar_contacto,
      endereco: moto.proprietario_endereco,
      localidade: moto.proprietario_localidade,
      provincia: moto.proprietario_provincia,
      data_nascimento: moto.proprietario_data_nascimento,
    };

    const { data: row, error: e2 } = await supa
      .from("transferencias")
      .insert({
        moto_id: data.motoId,
        municipio_id: moto.municipio_id,
        municipio_origem_id: moto.municipio_id,
        municipio_destino_id: ctx.municipioId!,
        utilizador_destino_id: ctx.userId,
        estado: "aguardando_origem",
        tipo_fluxo: "destino_solicita",
        proprietario_anterior: snapshotAnterior,
        proprietario_novo: data.novoProprietario,
        valor_transaccao: data.valor ?? null,
        motivo: data.motivo,
        operador: ctx.nome,
      })
      .select("id")
      .single();

    if (e2 || !row) throw new Error(e2?.message ?? "Erro ao solicitar transferência");

    const nomeDestino = nomesMap.get(ctx.municipioId!) ?? "Município Solicitante";
    await supa.from("notificacoes").insert({
      tipo: "pedido_transferencia",
      municipio_id: moto.municipio_id,
      titulo: "Novo pedido de transferência recebido",
      mensagem: `O ${nomeDestino} solicitou a transferência da motorizada ${moto.marca} ${moto.modelo} (${moto.chassi}).`,
      moto_id: data.motoId,
      payload: { transferencia_id: row.id },
    });

    await supa.from("historico_motos").insert({
      moto_id: data.motoId,
      municipio_id: moto.municipio_id,
      tipo_evento: "transferencia",
      descricao: `Solicitação de transferência iniciada pelo ${nomeDestino}`,
      diff: {
        solicitante: { antes: null, depois: nomeDestino },
      },
      operador: ctx.nome,
      motivo: data.motivo,
    });

    return { id: row.id };
  });

/**
 * APROVAR SOLICITAÇÃO (Origem autoriza solicitação do Destino em Forma B)
 */
export const aprovarSolicitacaoOrigem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ transferenciaId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    const { data: trans, error: e1 } = await supa
      .from("transferencias")
      .select("*, moto:moto_id(chassi, marca, modelo)")
      .eq("id", data.transferenciaId)
      .single();

    if (e1 || !trans) throw new Error("Transferência não encontrada.");

    if (!ctx.superAdmin && (trans.municipio_origem_id ?? trans.municipio_id) !== ctx.municipioId) {
      throw new Error("Sem permissão para aprovar esta solicitação.");
    }

    if (trans.estado !== "aguardando_origem") {
      throw new Error("Esta transferência não está aguardando aprovação.");
    }

    const { error: e2 } = await supa
      .from("transferencias")
      .update({
        estado: "pendente_aceitacao",
        utilizador_origem_id: ctx.userId,
      })
      .eq("id", data.transferenciaId);

    if (e2) throw new Error(e2.message);

    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", [
        trans.municipio_origem_id ?? trans.municipio_id,
        trans.municipio_destino_id ?? trans.municipio_id,
      ]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    await supa.from("notificacoes").insert({
      tipo: "transferencia_aprovada",
      municipio_id: trans.municipio_destino_id ?? trans.municipio_id,
      titulo: "Solicitação de transferência aprovada",
      mensagem: `O ${nomesMap.get(trans.municipio_origem_id ?? trans.municipio_id) ?? "Município de Origem"} aprovou o pedido para a motorizada ${trans.moto?.chassi}. Já pode concluir o processo.`,
      moto_id: trans.moto_id,
      payload: { transferencia_id: trans.id },
    });

    return { ok: true };
  });

/**
 * CONCLUIR TRANSFERÊNCIA
 * O município de destino confirma os dados finais do novo proprietário e conclui a transferência.
 * A motorizada muda de município_id e o proprietário é actualizado.
 */
export const concluirTransferencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        transferenciaId: z.string().uuid(),
        novoProprietario: proprietarioNovoSchema,
        valorTransaccao: z.number().min(0).optional().nullable(),
        observacoes: z.string().trim().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    const { data: trans, error: e1 } = await supa
      .from("transferencias")
      .select("*")
      .eq("id", data.transferenciaId)
      .single();

    if (e1 || !trans) throw new Error("Transferência não encontrada.");

    if (!ctx.superAdmin && (trans.municipio_destino_id ?? trans.municipio_id) !== ctx.municipioId) {
      throw new Error("Apenas o município de destino pode concluir esta transferência.");
    }

    if (trans.estado === "concluida") throw new Error("Esta transferência já foi concluída.");
    if (trans.estado === "rejeitada")
      throw new Error("Não é possível concluir uma transferência rejeitada.");

    const { data: moto, error: e2 } = await supa
      .from("motos")
      .select("*")
      .eq("id", trans.moto_id)
      .single();

    if (e2 || !moto) throw new Error("Motorizada associada não encontrada.");

    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", [
        trans.municipio_origem_id ?? trans.municipio_id,
        trans.municipio_destino_id ?? trans.municipio_id,
      ]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    const nomeOrigem = nomesMap.get(trans.municipio_origem_id ?? trans.municipio_id) ?? "—";
    const nomeDestino = nomesMap.get(trans.municipio_destino_id ?? trans.municipio_id) ?? "—";

    // 1. Atualizar Mota (mudança de município e proprietário)
    const { error: e3 } = await supa
      .from("motos")
      .update({
        municipio_id: trans.municipio_destino_id ?? trans.municipio_id,
        proprietario_nome: data.novoProprietario.nome,
        proprietario_bi: data.novoProprietario.bi ?? null,
        proprietario_contacto: data.novoProprietario.contacto ?? null,
        proprietario_contacto_alt: data.novoProprietario.contacto_alt ?? null,
        proprietario_familiar_nome: data.novoProprietario.familiar_nome ?? null,
        proprietario_familiar_contacto: data.novoProprietario.familiar_contacto ?? null,
        proprietario_endereco: data.novoProprietario.endereco ?? null,
        proprietario_localidade: data.novoProprietario.localidade ?? null,
        proprietario_provincia: data.novoProprietario.provincia ?? null,
        proprietario_data_nascimento: data.novoProprietario.data_nascimento ?? null,
        estado: "activa",
      })
      .eq("id", trans.moto_id);

    if (e3) throw new Error(e3.message);

    // 2. Atualizar processo de Transferência
    const nowStr = new Date().toISOString();
    const { error: e4 } = await supa
      .from("transferencias")
      .update({
        estado: "concluida",
        data_conclusao: nowStr,
        utilizador_destino_id: ctx.userId,
        proprietario_novo: data.novoProprietario,
        valor_transaccao: data.valorTransaccao ?? trans.valor_transaccao,
        motivo: data.observacoes ?? trans.motivo,
      })
      .eq("id", data.transferenciaId);

    if (e4) throw new Error(e4.message);

    // 3. Registar no Histórico com Diff Completo de Auditoria
    await supa.from("historico_motos").insert({
      moto_id: trans.moto_id,
      municipio_id: trans.municipio_destino_id ?? trans.municipio_id,
      tipo_evento: "transferencia",
      descricao: `Transferência concluída. Município alterado de ${nomeOrigem} para ${nomeDestino}. Proprietário alterado de ${moto.proprietario_nome} para ${data.novoProprietario.nome}.`,
      diff: {
        municipio: { antes: nomeOrigem, depois: nomeDestino },
        proprietario_nome: { antes: moto.proprietario_nome, depois: data.novoProprietario.nome },
        proprietario_bi: { antes: moto.proprietario_bi, depois: data.novoProprietario.bi },
        proprietario_contacto: {
          antes: moto.proprietario_contacto,
          depois: data.novoProprietario.contacto,
        },
        proprietario_endereco: {
          antes: moto.proprietario_endereco,
          depois: data.novoProprietario.endereco,
        },
      },
      operador: ctx.nome,
      motivo: data.observacoes ?? trans.motivo,
    });

    // 4. Enviar Notificações para ambos os Municípios
    await supa.from("notificacoes").insert([
      {
        tipo: "transferencia_concluida",
        municipio_id: trans.municipio_origem_id ?? trans.municipio_id,
        titulo: "Transferência concluída",
        mensagem: `A transferência da motorizada ${moto.marca} ${moto.modelo} (${moto.chassi}) para o ${nomeDestino} foi concluída com sucesso.`,
        moto_id: trans.moto_id,
        payload: { transferencia_id: trans.id },
      },
      {
        tipo: "transferencia_concluida",
        municipio_id: trans.municipio_destino_id ?? trans.municipio_id,
        titulo: "Transferência concluída",
        mensagem: `A motorizada ${moto.marca} ${moto.modelo} (${moto.chassi}) foi transferida e registada com sucesso no seu Município.`,
        moto_id: trans.moto_id,
        payload: { transferencia_id: trans.id },
      },
    ]);

    return { ok: true };
  });

/**
 * REJEITAR TRANSFERÊNCIA
 */
export const rejeitarTransferencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        transferenciaId: z.string().uuid(),
        motivoRejeicao: z.string().trim().min(3, "Indique o motivo da rejeição").max(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    const { data: trans, error: e1 } = await supa
      .from("transferencias")
      .select("*, moto:moto_id(chassi, marca, modelo)")
      .eq("id", data.transferenciaId)
      .single();

    if (e1 || !trans) throw new Error("Transferência não encontrada.");

    const eOrigem = (trans.municipio_origem_id ?? trans.municipio_id) === ctx.municipioId;
    const eDestino = (trans.municipio_destino_id ?? trans.municipio_id) === ctx.municipioId;

    if (!ctx.superAdmin && !eOrigem && !eDestino) {
      throw new Error("Sem permissão para rejeitar esta transferência.");
    }

    if (trans.estado === "concluida")
      throw new Error("Não é possível rejeitar uma transferência já concluída.");

    const { error: e2 } = await supa
      .from("transferencias")
      .update({
        estado: "rejeitada",
        motivo_rejeicao: data.motivoRejeicao,
      })
      .eq("id", data.transferenciaId);

    if (e2) throw new Error(e2.message);

    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", [
        trans.municipio_origem_id ?? trans.municipio_id,
        trans.municipio_destino_id ?? trans.municipio_id,
      ]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    const quemRejeitou =
      ctx.municipioId === (trans.municipio_origem_id ?? trans.municipio_id) ? "Origem" : "Destino";
    const municipioNotificar = eOrigem
      ? (trans.municipio_destino_id ?? trans.municipio_id)
      : (trans.municipio_origem_id ?? trans.municipio_id);

    await supa.from("notificacoes").insert({
      tipo: "transferencia_rejeitada",
      municipio_id: municipioNotificar,
      titulo: "Transferência rejeitada",
      mensagem: `A transferência da motorizada ${trans.moto?.chassi} foi rejeitada pelo Município de ${nomesMap.get(ctx.municipioId!) ?? quemRejeitou}. Motivo: ${data.motivoRejeicao}`,
      moto_id: trans.moto_id,
      payload: { transferencia_id: trans.id },
    });

    await supa.from("historico_motos").insert({
      moto_id: trans.moto_id,
      municipio_id: trans.municipio_origem_id ?? trans.municipio_id,
      tipo_evento: "mudanca_estado",
      descricao: `Transferência rejeitada pelo ${nomesMap.get(ctx.municipioId!) ?? "Município"}. Motivo: ${data.motivoRejeicao}`,
      operador: ctx.nome,
      motivo: data.motivoRejeicao,
    });

    return { ok: true };
  });

/**
 * LISTAR TRANSFERÊNCIAS (Filtros: recebidas, enviadas, pendentes, concluidas, rejeitadas)
 */
export const listTransferencias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { aba?: string } | undefined) =>
    z
      .object({
        aba: z
          .enum(["recebidas", "enviadas", "pendentes", "concluidas", "rejeitadas", "todas"])
          .optional()
          .default("todas"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<ItemTransferencia[]> => {
    const { contextoUtilizador } = await import("./auth.server");
    const { sbAdmin } = await import("./tenant.server");
    const ctx = await contextoUtilizador(context.userId);
    const supa = sbAdmin();

    let q = supa
      .from("transferencias")
      .select("*, moto:moto_id(chassi, matricula, marca, modelo, cor, estado)")
      .order("created_at", { ascending: false });

    if (!ctx.superAdmin) {
      if (data.aba === "recebidas") {
        q = q.eq("municipio_destino_id", ctx.municipioId!);
      } else if (data.aba === "enviadas") {
        q = q.eq("municipio_origem_id", ctx.municipioId!);
      } else if (data.aba === "pendentes") {
        q = q
          .or(
            `municipio_origem_id.eq.${ctx.municipioId},municipio_destino_id.eq.${ctx.municipioId}`,
          )
          .in("estado", ["pendente_aceitacao", "aguardando_origem"]);
      } else if (data.aba === "concluidas") {
        q = q
          .or(
            `municipio_origem_id.eq.${ctx.municipioId},municipio_destino_id.eq.${ctx.municipioId}`,
          )
          .eq("estado", "concluida");
      } else if (data.aba === "rejeitadas") {
        q = q
          .or(
            `municipio_origem_id.eq.${ctx.municipioId},municipio_destino_id.eq.${ctx.municipioId}`,
          )
          .eq("estado", "rejeitada");
      } else {
        q = q.or(
          `municipio_origem_id.eq.${ctx.municipioId},municipio_destino_id.eq.${ctx.municipioId},municipio_id.eq.${ctx.municipioId}`,
        );
      }
    } else {
      if (data.aba === "pendentes") q = q.in("estado", ["pendente_aceitacao", "aguardando_origem"]);
      else if (data.aba === "concluidas") q = q.eq("estado", "concluida");
      else if (data.aba === "rejeitadas") q = q.eq("estado", "rejeitada");
    }

    const { data: rows, error } = await q.limit(100);
    if (error) throw new Error(error.message);

    // Carregar nomes de municípios envolvidos
    const munSet = new Set<string>();
    for (const r of rows ?? []) {
      if (r.municipio_origem_id) munSet.add(r.municipio_origem_id);
      if (r.municipio_destino_id) munSet.add(r.municipio_destino_id);
      if (r.municipio_id) munSet.add(r.municipio_id);
    }

    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", munSet.size > 0 ? [...munSet] : ["00000000-0000-0000-0000-000000000000"]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    return (rows ?? []).map((r) => ({
      id: r.id,
      moto_id: r.moto_id,
      municipio_id: r.municipio_id,
      municipio_origem_id: r.municipio_origem_id ?? r.municipio_id,
      municipio_origem_nome: nomesMap.get(r.municipio_origem_id ?? r.municipio_id) ?? "—",
      municipio_destino_id: r.municipio_destino_id ?? r.municipio_id,
      municipio_destino_nome: nomesMap.get(r.municipio_destino_id ?? r.municipio_id) ?? "—",
      utilizador_origem_id: r.utilizador_origem_id ?? null,
      utilizador_destino_id: r.utilizador_destino_id ?? null,
      estado: (r.estado as EstadoTransferencia) ?? "concluida",
      tipo_fluxo: (r.tipo_fluxo as TipoFluxoTransferencia) ?? "origem_inicia",
      proprietario_anterior: (r.proprietario_anterior ?? {}) as Record<string, any>,
      proprietario_novo: (r.proprietario_novo ?? {}) as Record<string, any>,
      valor_transaccao: r.valor_transaccao ?? null,
      motivo: r.motivo ?? null,
      motivo_rejeicao: r.motivo_rejeicao ?? null,
      operador: r.operador ?? "—",
      created_at: r.created_at,
      data_conclusao: r.data_conclusao ?? null,
      moto: r.moto ?? null,
    }));
  });

/**
 * OBTER TRANSFERÊNCIA ACTIVA DE UMA MOTORIZADA (SE EXISTIR)
 */
export const obterTransferenciaAtivaMoto = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ motoId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<ItemTransferencia | null> => {
    const { sbAdmin } = await import("./tenant.server");
    const supa = sbAdmin();

    const { data: r, error } = await supa
      .from("transferencias")
      .select("*, moto:moto_id(chassi, matricula, marca, modelo, cor, estado)")
      .eq("moto_id", data.motoId)
      .in("estado", ["pendente_aceitacao", "aguardando_origem"])
      .maybeSingle();

    if (error || !r) return null;

    const { data: munis } = await supa
      .from("municipios")
      .select("id, nome")
      .in("id", [
        r.municipio_origem_id ?? r.municipio_id,
        r.municipio_destino_id ?? r.municipio_id,
      ]);
    const nomesMap = new Map((munis ?? []).map((m) => [m.id, m.nome]));

    return {
      id: r.id,
      moto_id: r.moto_id,
      municipio_id: r.municipio_id,
      municipio_origem_id: r.municipio_origem_id ?? r.municipio_id,
      municipio_origem_nome: nomesMap.get(r.municipio_origem_id ?? r.municipio_id) ?? "—",
      municipio_destino_id: r.municipio_destino_id ?? r.municipio_id,
      municipio_destino_nome: nomesMap.get(r.municipio_destino_id ?? r.municipio_id) ?? "—",
      utilizador_origem_id: r.utilizador_origem_id ?? null,
      utilizador_destino_id: r.utilizador_destino_id ?? null,
      estado: (r.estado as EstadoTransferencia) ?? "concluida",
      tipo_fluxo: (r.tipo_fluxo as TipoFluxoTransferencia) ?? "origem_inicia",
      proprietario_anterior: (r.proprietario_anterior ?? {}) as Record<string, any>,
      proprietario_novo: (r.proprietario_novo ?? {}) as Record<string, any>,
      valor_transaccao: r.valor_transaccao ?? null,
      motivo: r.motivo ?? null,
      motivo_rejeicao: r.motivo_rejeicao ?? null,
      operador: r.operador ?? "—",
      created_at: r.created_at,
      data_conclusao: r.data_conclusao ?? null,
      moto: r.moto ?? null,
    };
  });
