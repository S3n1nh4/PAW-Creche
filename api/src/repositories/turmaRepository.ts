import {prisma} from "../config/prisma.js";
import type {TurmaCreateInput, TurmaUpdateInput} from "../generated/prisma/models/Turma.js";

export async function buscarTodas() {
    return await prisma.turma.findMany({ include: { criadoPor: { select: { id: true, nome: true } } } });
}

export async function buscarPorId(id: number) {
    return await prisma.turma.findUnique({ where: { id }, include: { criadoPor: { select: { id: true, nome: true } } } });

}
export async function buscarPorNome(nome: string) {
    return await prisma.turma.findFirst({ where: { nome } });
}

export async function criar(dados: TurmaCreateInput) {
    return await prisma.turma.create({ data: dados });

}

export async function atualizar(id: number, dados: TurmaUpdateInput) {
    return await prisma.turma.update({ where: { id }, data: dados });
}

export async function deletar(id:number){
    return await prisma.turma.delete({where: {id}})
}
