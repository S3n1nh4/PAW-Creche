import type { Aluno } from "../generated/prisma/client.js";
import * as repo from "../repositories/alunoRepositorio.js";
import type { AlunoInput } from "@creche/shared/aluno";
import { converterDataCivil } from "@creche/shared/dataCivil";
import type { UsuarioSessao } from "./sessaoService.js";
import { filtroAluno, validarAluno, validarTurma } from "./acessoDados.js";
import { persistir } from "./presencaErrors.js";


function dadosPersistencia(dados: AlunoInput, anterior?: Aluno) {
  return {
    ...dados,
    dataNascimento: converterDataCivil(dados.dataNascimento),
    responsavelParentesco: dados.responsavelParentesco === undefined ? anterior?.responsavelParentesco ?? null : dados.responsavelParentesco,
    responsavelSecundarioNome: dados.responsavelSecundarioNome === undefined ? anterior?.responsavelSecundarioNome ?? null : dados.responsavelSecundarioNome,
    responsavelSecundarioParentesco: dados.responsavelSecundarioParentesco === undefined ? anterior?.responsavelSecundarioParentesco ?? null : dados.responsavelSecundarioParentesco,
    responsavelSecundarioTelefone: dados.responsavelSecundarioTelefone === undefined ? anterior?.responsavelSecundarioTelefone ?? null : dados.responsavelSecundarioTelefone,
  };
}

export function buscarAlunos(usuario: UsuarioSessao) {
  return repo.buscarTodos(filtroAluno(usuario));
}
export function buscarAlunoPorId(id: number, usuario: UsuarioSessao) {
  return validarAluno(id, usuario);
}
export async function buscarPorTurma(turmaId: number, usuario: UsuarioSessao) {
  await validarTurma(turmaId, usuario);
  return repo.buscarTodos({ ...filtroAluno(usuario), turmaId });
}
export function buscarPorNome(nome: string, usuario: UsuarioSessao) {
  return repo.buscarTodos({ ...filtroAluno(usuario), nome });
}
export async function criarAluno(dados: AlunoInput, usuario: UsuarioSessao) {
  await validarTurma(dados.turmaId, usuario);
  return persistir(() => repo.criar(dadosPersistencia(dados)));
}
export async function atualizarAluno(id: number, dados: AlunoInput, usuario: UsuarioSessao) {
  const anterior = await validarAluno(id, usuario);
  await validarTurma(dados.turmaId, usuario);
  return persistir(() => repo.atualizar(id, dadosPersistencia(dados, anterior)));
}
// DELETE desativa o cadastro e preserva chamadas e demais históricos.
export async function deletarAluno(id: number, usuario: UsuarioSessao) {
  await validarAluno(id, usuario);
  return persistir(() => repo.atualizar(id, { ativo: false }));
}
