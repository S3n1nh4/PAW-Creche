import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const presencaCuidadorRepository = {
  buscarPorId: (id: number) => prisma.presencaCuidador.findUnique({ where: { id } }),
  listar: (where: Prisma.PresencaCuidadorWhereInput, skip: number, take: number) =>
    prisma.presencaCuidador.findMany({ where, skip, take, orderBy: [{ data: "desc" }, { id: "desc" }] }),
  criar: (data: Prisma.PresencaCuidadorUncheckedCreateInput) => prisma.presencaCuidador.create({ data }),
  atualizar: (id: number, data: Prisma.PresencaCuidadorUncheckedUpdateInput) =>
    prisma.presencaCuidador.update({ where: { id }, data }),
  buscarCuidador: (id: number) => prisma.cuidador.findUnique({ where: { id } }),
};
