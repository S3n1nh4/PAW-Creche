

import { prisma } from "../config/prisma.js";
import type { CriarPacienteDTO } from "../schemas/Schema.js";

export async function buscarTodos() {
  return await prisma.titia.findMany();
}

export async function buscarPorId(id: number) {
  return await prisma.titia.findUnique({ where: { id } });
}

export async function criar(dados: CriarPacienteDTO ) {
  return await prisma.titia.create({ data: dados });
}