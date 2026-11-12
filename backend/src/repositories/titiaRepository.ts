import {prisma} from "../config/prisma.js";
import type { Titia } from "../generated/prisma/client.js";
import type { TitiaCreateInput } from "../generated/prisma/models/Titia.js";
//import type { TitiaInput } from "@paw_creche/shared/titia"; 

export async function buscarTodos() {
  return await prisma.titia.findMany();
}

export async function buscarPorId(id: number) {
  return await prisma.titia.findUnique({ where: { id } });

}

export async function buscarPorEmail(email: string) {
  return await prisma.titia.findFirst({ where: { email } });
}

export async function criar(dados: TitiaCreateInput) {
  return await prisma.titia.create({ data: dados });
}

export async function atualizar(id: number, dados: Partial<Titia>) {
  return await prisma.titia.update({ where: { id }, data: dados });
}

export async function deletar(id: number) {
  return await prisma.titia.delete({ where: { id } });
}