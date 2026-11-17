import {prisma} from "../config/prisma.js";
import type { Cuidador } from "../generated/prisma/client.js";
import type { CuidadorCreateInput, CuidadorUpdateInput } from "../generated/prisma/models/Cuidador.js";
//import type { CuidadorInput } from "@paw_creche/shared/Cuidador"; 

export async function buscarTodos() {
  return await prisma.cuidador.findMany();
}

export async function buscarPorId(id: number) {
  return await prisma.cuidador.findUnique({ where: { id } });
}

export async function buscarPorEmail(email: string) {
  return await prisma.cuidador.findFirst({ where: { email } });
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