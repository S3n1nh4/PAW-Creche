import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const presencaRepository = {
  buscarPorId: (id: number) => prisma.presenca.findUnique({ where: { id } }),
  listar: (where: Prisma.PresencaWhereInput, skip: number, take: number) =>
    prisma.presenca.findMany({ where, skip, take, orderBy: [{ data: "desc" }, { id: "desc" }] }),
  criar: (data: Prisma.PresencaUncheckedCreateInput) => prisma.presenca.create({ data }),
  atualizar: (id: number, data: Prisma.PresencaUncheckedUpdateInput) => prisma.presenca.update({ where: { id }, data }),
  buscarAluno: (id: number) => prisma.aluno.findUnique({ where: { id } }),
  buscarTurma: (id: number) => prisma.turma.findUnique({ where: { id } }),
  buscarVinculo: (turmaId: number, cuidadorId: number) =>
    prisma.turmaCuidador.findUnique({ where: { turmaId_cuidadorId: { turmaId, cuidadorId } } }),
};
