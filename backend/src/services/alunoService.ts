import * as repo from "../repositories/alunoRepositorio.js";
import type { Aluno } from "../generated/prisma/client.js";
import type { AlunoCreateInput, AlunoUpdateInput } from "../generated/prisma/models/Aluno.js";

export async function buscarAlunos(): Promise<Aluno[]> {
    return await repo.buscarTodos();
}

export async function buscarAlunoPorId(id: number): Promise<Aluno | null> {
    const aluno = await repo.buscarPorId(id);
    if (!aluno) {
        throw new Error(`Aluno com ID ${id} não encontrada.`);
    }
    return aluno;
}

export async function buscarPorTurma(turmaId: number): Promise<Aluno[]> {
    return await repo.buscarPorTurma(turmaId);
}

export async function buscarPorNome(nome: string): Promise<Aluno[]> {
    const aluno = await repo.buscarPorNome(nome);
    if (!aluno) {
        throw new Error(`Aluno com ID ${nome} não encontrada.`);
    }
    return aluno;
}
export async function criarAluno(dados: AlunoCreateInput): Promise<Aluno> {
    return await repo.criar(dados);
}

export async function atualizarAluno(id: number, dados: AlunoUpdateInput): Promise<Aluno> {
    const Aluno = await repo.buscarPorId(id);
    if (!Aluno) {
        throw new Error(`Aluno com ID ${id} não encontrada.`);
    }
    return await repo.atualizar(id, dados);
}

export async function deletarAluno(id: number): Promise<Aluno> {
    const Aluno = await repo.buscarPorId(id);
    if (!Aluno) {
        throw new Error(`Aluno com ID ${id} não encontrada.`);
    }
    return await repo.deletar(id);
}