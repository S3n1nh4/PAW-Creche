import * as repo from "../repositories/turmaRepository.js"
import type {Turma} from "../generated/prisma/client.js";
import type {TurmaCreateInput, TurmaUpdateInput} from "../generated/prisma/models/Turma.js";


export async function buscarTurmas(): Promise<Turma[]> {
    return await repo.buscarTodas();
}

export async function buscarPorId(id: number): Promise<Turma | null> {
    const turma = repo.buscarPorId(id);
    if(!turma){
        throw new Error(`Turma com ID ${id} não encontrado.`);
    }   
    return turma;
}

export async function buscarTurmaPorNome(nome : string): Promise<Turma | null> {
    const turma = repo.buscarPorNome(nome);
    if(!turma){
        throw new Error(`Turma com nome ${nome} não encontrado.`);
    }
    return turma;
}

export async function criarTurma(dados : TurmaCreateInput): Promise< Turma| null> {
    const turmaExistente = await repo.buscarPorNome(dados.nome);
        if (turmaExistente) {
            throw new Error(`Já existe uma Turma com o nome ${dados.nome}.`);
        }
        return await repo.criar(dados)
}

export async function atualizarTurma(id: number,dados : TurmaUpdateInput): Promise<Turma| null>{
    const turma = await repo.buscarPorId(id);
        if (!turma) {
            throw new Error(`turma com ID ${id} não encontrada.`);
        }
        return await repo.atualizar(id, dados);
}


export async function deletarTurma(id: number): Promise<Turma> {
    const turma = await repo.buscarPorId(id);
    if (!turma) {
        throw new Error(`Turma com ID ${id} não encontrada.`);
   }
    return await repo.deletar(id);
    
}