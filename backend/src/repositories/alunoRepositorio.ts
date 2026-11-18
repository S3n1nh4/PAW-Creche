import {prisma} from "../config/prisma.js";
import type { AlunoCreateInput, AlunoUpdateInput } from "../generated/prisma/models/Aluno.js";

export async function buscarTodos() {
  return await prisma.aluno.findMany();
}

export async function buscarPorTurma(turmaId: number) {
    return await prisma.aluno.findMany({where:{turmaId}})
}

export async function buscarPorId(id: number) {
  return await prisma.aluno.findUnique({ where: { id } });
}

export async function buscarPorNome(nome: string) {
    return await prisma.aluno.findMany({where:{nome}})
}

export async function criar(dados: AlunoCreateInput){
    return await prisma.aluno.create({data: dados});
}

export async function atualizar(id:number, dados: AlunoUpdateInput){
    return await prisma.aluno.update({where: { id }, data: dados});
}

export async function deletar(id:number){
    return await prisma.aluno.delete({where:{id}})
}
