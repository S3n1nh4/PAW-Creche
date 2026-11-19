import {prisma} from "../config/prisma.js";
import type { AdminCreateInput, AdminUpdateInput } from "../generated/prisma/models/Admin.js";

export async function buscarTodos() {
  return await prisma.admin.findMany();
}

export async function buscarPorId(id: number) {
  return await prisma.admin.findUnique({ where: { id } });
}

export async function buscarPorEmail(email: string) {
  return await prisma.admin.findFirst({ where: { email } });
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