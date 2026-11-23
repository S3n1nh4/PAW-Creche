import type { AtualizarPresencaInput, FiltroPresenca, PresencaInput } from "@creche/shared/presenca";
import { presencaRepository } from "../repositories/presencaRepository.js";
import { dataCivil, persistir, PresencaError } from "./presencaErrors.js";

// A dependência pode ser substituída por um repositório de teste.
export function criarPresencaService(repo = presencaRepository) {
  async function validarTurma(turmaId: number, cuidadorId: number) {
    const turma = await repo.buscarTurma(turmaId);
    if (!turma) throw new PresencaError(404, "Turma não encontrada.");
    if (!turma.ativo) throw new PresencaError(409, "Turma desativada.");
    if (!await repo.buscarVinculo(turmaId, cuidadorId)) {
      throw new PresencaError(403, "Cuidador não vinculado à turma.");
    }
  }

  async function buscarPorId(id: number, cuidadorId: number) {
    const registro = await repo.buscarPorId(id);
    if (!registro) throw new PresencaError(404, "Presença não encontrada.");
    await validarTurma(registro.turmaId, cuidadorId);
    return registro;
  }

  return {
    buscarPorId,
    async listar(filtro: FiltroPresenca, cuidadorId: number) {
      if (filtro.turmaId) await validarTurma(filtro.turmaId, cuidadorId);
      const registros = await repo.listar({
        // Mesmo sem filtro, retorna somente turmas ativas vinculadas ao usuário.
        turma: { ativo: true, cuidadores: { some: { cuidadorId } } },
        ...(filtro.turmaId ? { turmaId: filtro.turmaId } : {}),
        ...(filtro.alunoId ? { alunoId: filtro.alunoId } : {}),
        ...(filtro.data ? { data: dataCivil(filtro.data) } : {}),
      }, (filtro.pagina - 1) * filtro.limite, filtro.limite);
      return { registros, pagina: filtro.pagina, limite: filtro.limite };
    },
    async criar(dados: PresencaInput, cuidadorId: number) {
      await validarTurma(dados.turmaId, cuidadorId);
      const aluno = await repo.buscarAluno(dados.alunoId);
      if (!aluno) throw new PresencaError(404, "Aluno não encontrado.");
      if (!aluno.ativo) throw new PresencaError(409, "Aluno desativado.");
      if (aluno.turmaId !== dados.turmaId) throw new PresencaError(409, "Aluno não pertence à turma informada.");
      return persistir(() => repo.criar({
        alunoId: dados.alunoId, turmaId: dados.turmaId, data: dataCivil(dados.data),
        status: dados.status, observacao: dados.observacao ?? null,
        registradoPorCuidadorId: cuidadorId,
      }));
    },
    async atualizar(id: number, dados: AtualizarPresencaInput, cuidadorId: number) {
      // Usa a turma gravada na chamada, mesmo após uma transferência do aluno.
      await buscarPorId(id, cuidadorId);
      return persistir(() => repo.atualizar(id, {
        status: dados.status, observacao: dados.observacao ?? null,
        registradoPorCuidadorId: cuidadorId,
      }));
    },
  };
}

export const presencaService = criarPresencaService();
