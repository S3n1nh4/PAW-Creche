import type { Prisma } from "../generated/prisma/client.js";
import {prisma} from "../config/prisma.js";
import type { ComportamentoUncheckedCreateInput, ComportamentoUncheckedUpdateInput } from "../generated/prisma/models/Comportamento.js";


export async function buscarTodos(where: Prisma.ComportamentoWhereInput = {}) {
  return await prisma.comportamento.findMany({ where, orderBy: { data: "desc" } });
}

export async function buscarPorId(id: number) {
  return await prisma.comportamento.findUnique({ where: { id } });
}


export async function buscarPorAluno(alunoId: number) {
  return await prisma.comportamento.findMany({ where: { alunoId },orderBy:{data:"desc"} });
}

export async function buscarPorCuidador(cuidadorId: number) {
  return await prisma.comportamento.findMany({ where: { cuidadorId },orderBy:{data:"desc"} });
}

export async function criar(dados: ComportamentoUncheckedCreateInput) {
  return await prisma.comportamento.create({ data: dados });
}

export async function atualizar(id: number, dados: ComportamentoUncheckedUpdateInput) {
  return await prisma.comportamento.update({ where: { id }, data: dados });
}

export async function deletar(id: number) {
  return await prisma.comportamento.delete({ where: { id } });
}
