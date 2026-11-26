import * as repo from "../repositories/comportamentoRepository.js";
import * as cuidadorRepo from "../repositories/cuidadorRepository.js";
import type { ComportamentoInput } from "@creche/shared/comportamento";
import { converterDataCivil } from "@creche/shared/dataCivil";
import type { UsuarioSessao } from "./sessaoService.js";
import { filtroAluno, validarAluno } from "./acessoDados.js";
import { persistir, PresencaError } from "./presencaErrors.js";

export function buscarComportamentos(usuario: UsuarioSessao) {
  return repo.buscarTodos({ aluno: filtroAluno(usuario) });
}
export async function buscarComportamentoPorId(id: number, usuario: UsuarioSessao) {
  const registro = await repo.buscarPorId(id);
  if (!registro) throw new PresencaError(404, "Comportamento não encontrado.");
  await validarAluno(registro.alunoId, usuario);
  return registro;
}
export async function buscarComportamentoPorAluno(alunoId: number, usuario: UsuarioSessao) {
  await validarAluno(alunoId, usuario);
  return repo.buscarTodos({ alunoId, aluno: filtroAluno(usuario) });
}
export async function buscarComportamentoPorCuidador(cuidadorId: number, usuario: UsuarioSessao) {
  const cuidador = await cuidadorRepo.buscarPorId(cuidadorId);
  if (!cuidador) throw new PresencaError(404, "Cuidador não encontrado.");
  return repo.buscarTodos({ cuidadorId, aluno: filtroAluno(usuario) });
}
export async function criarComportamento(dados: ComportamentoInput, usuario: UsuarioSessao) {
  const aluno = await validarAluno(dados.alunoId, usuario);
  if (!aluno.ativo) throw new PresencaError(409, "Aluno desativado.");
  return persistir(() => repo.criar({ ...dados, cuidadorId: usuario.id, data: converterDataCivil(dados.data) }));
}
export async function atualizar(id: number, dados: ComportamentoInput, usuario: UsuarioSessao) {
  const registro = await buscarComportamentoPorId(id, usuario);
  if (registro.alunoId !== dados.alunoId) throw new PresencaError(409, "Não é permitido trocar o aluno do registro.");
  return persistir(() => repo.atualizar(id, { descricao: dados.descricao, data: converterDataCivil(dados.data), cuidadorId: usuario.id }));
}
export async function deletar(id: number, usuario: UsuarioSessao) {
  await buscarComportamentoPorId(id, usuario);
  return persistir(() => repo.deletar(id));
}
