import { prisma } from "../config/prisma.js";
import type { UsuarioSessao } from "./sessaoService.js";
import { PresencaError } from "./presencaErrors.js";

export function filtroAluno(usuario: UsuarioSessao) {
  return usuario.tipoUsuario === "ADMIN" ? {} : {
    turma: { ativo: true, cuidadores: { some: { cuidadorId: usuario.id } } },
  };
}

export async function validarTurma(turmaId: number | null, usuario: UsuarioSessao) {
  if (turmaId === null) {
    if (usuario.tipoUsuario === "CUIDADOR") throw new PresencaError(403, "Informe uma turma vinculada ao cuidador.");
    return;
  }
  const turma = await prisma.turma.findUnique({ where: { id: turmaId } });
  if (!turma) throw new PresencaError(404, "Turma não encontrada.");
  if (!turma.ativo) throw new PresencaError(409, "Turma desativada.");
  if (usuario.tipoUsuario === "CUIDADOR") {
    const vinculo = await prisma.turmaCuidador.findUnique({ where: { turmaId_cuidadorId: { turmaId, cuidadorId: usuario.id } } });
    if (!vinculo) throw new PresencaError(403, "Cuidador não vinculado à turma.");
  }
}

export async function validarAluno(alunoId: number, usuario: UsuarioSessao) {
  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) throw new PresencaError(404, "Aluno não encontrado.");
  if (usuario.tipoUsuario === "CUIDADOR") await validarTurma(aluno.turmaId, usuario);
  return aluno;
}
