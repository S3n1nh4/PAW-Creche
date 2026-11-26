import {prisma} from "../config/prisma.js";
import type { CuidadorCreateInput, CuidadorUpdateInput } from "../generated/prisma/models/Cuidador.js";

export async function buscarTodos() {
  return await prisma.cuidador.findMany({ where: { conta: { perfil: "CUIDADOR" } } });
}

export async function buscarPorId(id: number) {
  const cadastro = await prisma.cuidador.findUnique({ where: { id }, include: { conta: { select: { perfil: true } } } });
  if (!cadastro || (cadastro.conta && cadastro.conta.perfil !== "CUIDADOR")) return null;
  const { conta, ...dados } = cadastro;
  return dados;
}

export async function buscarPorEmail(email: string) {
  return await prisma.cuidador.findFirst({ where: { email, conta: { perfil: "CUIDADOR" } } });
}

export async function criar(dados: CuidadorCreateInput) {
  return await prisma.cuidador.create({ data: dados });
}

export async function atualizar(id: number, dados: CuidadorUpdateInput) {
  return await prisma.cuidador.update({ where: { id }, data: dados });
}

// export async function desativarCuidador(id:number) {
//   return await prisma.Cuidador.update({ where: { id }, data: { ativo: false } });
// }

export async function deletar(id: number) {
  return await prisma.cuidador.delete({ where: { id } });
}
