import {prisma} from "../config/prisma.js";
import type { AdminCreateInput, AdminUpdateInput } from "../generated/prisma/models/Admin.js";

export async function buscarTodos() {
  return await prisma.admin.findMany({ where: { conta: { perfil: "ADMIN" } } });
}

export async function buscarPorId(id: number) {
  const cadastro = await prisma.admin.findUnique({ where: { id }, include: { conta: { select: { perfil: true } } } });
  if (!cadastro || (cadastro.conta && cadastro.conta.perfil !== "ADMIN")) return null;
  const { conta, ...dados } = cadastro;
  return dados;
}

export async function buscarPorEmail(email: string) {
  return await prisma.admin.findFirst({ where: { email, conta: { perfil: "ADMIN" } } });
}

export async function criar(dados: AdminCreateInput) {
  return await prisma.admin.create({ data: dados });
}

export async function atualizar(id: number, dados: AdminUpdateInput) {
  return await prisma.admin.update({ where: { id }, data: dados });
}

export async function desativarAdmin(id:number) {
   return await prisma.admin.update({ where: { id }, data: { ativo: false } });
}

export async function deletar(id: number) {
  return await prisma.admin.delete({ where: { id } });
}
