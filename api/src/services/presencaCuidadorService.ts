import type { AtualizarPresencaCuidadorInput, FiltroPresencaCuidador, PresencaCuidadorInput } from "@creche/shared/presencaCuidador";
import { presencaCuidadorRepository } from "../repositories/presencaCuidadorRepository.js";
import { dataCivil, persistir, PresencaError } from "./presencaErrors.js";

export function validarHorarios(dados: AtualizarPresencaCuidadorInput) {
  const entrada = dados.entrada ? new Date(dados.entrada) : null;
  const saida = dados.saida ? new Date(dados.saida) : null;
  if (saida && !entrada) throw new PresencaError(400, "Informe a entrada antes da saída.");
  if (entrada && saida && saida < entrada) throw new PresencaError(400, "A saída não pode ser anterior à entrada.");
  if (dados.status !== "presente" && (entrada || saida)) {
    throw new PresencaError(400, "Uma falta não pode conter horários de entrada ou saída.");
  }
  return { entrada, saida };
}

export function criarPresencaCuidadorService(repo = presencaCuidadorRepository) {
  async function buscarPorId(id: number) {
    const registro = await repo.buscarPorId(id);
    if (!registro) throw new PresencaError(404, "Ponto não encontrado.");
    return registro;
  }
  return {
    buscarPorId,
    async listar(filtro: FiltroPresencaCuidador) {
      const registros = await repo.listar({
        ...(filtro.cuidadorId ? { cuidadorId: filtro.cuidadorId } : {}),
        ...(filtro.data ? { data: dataCivil(filtro.data) } : {}),
      }, (filtro.pagina - 1) * filtro.limite, filtro.limite);
      return { registros, pagina: filtro.pagina, limite: filtro.limite };
    },
    async criar(dados: PresencaCuidadorInput, adminId: number) {
      const horarios = validarHorarios(dados);
      const cuidador = await repo.buscarCuidador(dados.cuidadorId);
      if (!cuidador) throw new PresencaError(404, "Cuidador não encontrado.");
      if (!cuidador.ativo) throw new PresencaError(409, "Cuidador desativado.");
      return persistir(() => repo.criar({
        cuidadorId: dados.cuidadorId, data: dataCivil(dados.data), status: dados.status,
        ...horarios, observacao: dados.observacao ?? null, registradoPorAdminId: adminId,
      }));
    },
    async atualizar(id: number, dados: AtualizarPresencaCuidadorInput, adminId: number) {
      const horarios = validarHorarios(dados);
      await buscarPorId(id);
      // Permite corrigir o histórico mesmo que o cuidador tenha sido desativado.
      return persistir(() => repo.atualizar(id, {
        status: dados.status, ...horarios, observacao: dados.observacao ?? null,
        registradoPorAdminId: adminId,
      }));
    },
  };
}

export const presencaCuidadorService = criarPresencaCuidadorService();
