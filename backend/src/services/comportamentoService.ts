import * as repo from "../repositories/comportamentoRepository.js";
import * as alunoRepo from "../repositories/alunoRepositorio.js";
import * as cuidadorRepo from "../repositories/cuidadorRepository.js"
import type { Comportamento } from "../generated/prisma/client.js";
import type { ComportamentoUncheckedCreateInput, ComportamentoUncheckedUpdateInput } from "../generated/prisma/models/Comportamento.js";


export async function buscarComportamentos(): Promise<Comportamento[]> {
    return await repo.buscarTodos();
}

export async function buscarComportamentoPorId(id: number): Promise<Comportamento | null> {
    const comportamento = await repo.buscarPorId(id);
    if (!comportamento) {
        throw new Error(`Comportamento com ID ${id} não encontrada.`);
    }
    return comportamento;
}

export async function buscarComportamentoPorAluno(alunoId: number): Promise<Comportamento[]> {
    const aluno = await alunoRepo.buscarPorId(alunoId);
    if(!alunoId){throw new Error(`aluno com ID ${alunoId} não encontrado.`);}
    return await repo.buscarPorAluno(alunoId);
}

export async function buscarComportamentoPorCuidador(cuidadorId: number): Promise<Comportamento[]> {
    const cuidador = await cuidadorRepo.buscarPorId(cuidadorId);
    if(!cuidadorId){throw new Error(`cuidador com ID ${cuidadorId} não encontrado.`);}
    return await repo.buscarPorCuidador(cuidadorId);
}

export async function criarComportamento(dados: ComportamentoUncheckedCreateInput): Promise<Comportamento> {
    const cuidador = await cuidadorRepo.buscarPorId(dados.cuidadorId);
    if (!cuidador) {
        throw new Error(`Cuidador com ID ${dados.cuidadorId} não encontrada.`);
    }
    const aluno = await alunoRepo.buscarPorId(dados.alunoId);
    
    if (!aluno) {
        throw new Error(`Aluno com ID ${dados.alunoId} não encontrada.`);
    }
    return await repo.criar(dados);
}

export async function atualizar(id: number , dados: ComportamentoUncheckedUpdateInput): Promise<Comportamento> {
    const comportamento = await repo.buscarPorId(id);
    if (!comportamento) {
        throw new Error(`Comportamento com ID ${dados.id} não encontrada.`);
    }
    return await repo.atualizar(id,dados);
}

export async function deletar(id: number): Promise<Comportamento> {
    const comportamento = await repo.buscarPorId(id);
    if (!comportamento) {
        throw new Error(`Comportamento com ID ${id} não encontrada.`);
    }
    return await repo.deletar(id);
}