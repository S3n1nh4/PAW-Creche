import * as repo from "../repositories/turmaRepository.js"
import type {Turma} from "../generated/prisma/client.js";
import type { TurmaInput } from "@creche/shared/turma";
import { persistir, PresencaError } from "./presencaErrors.js";


export async function buscarTurmas(): Promise<Turma[]> {
    return await repo.buscarTodas();
}

export async function buscarPorId(id: number): Promise<Turma | null> {
    const turma = await repo.buscarPorId(id);
    if(!turma){
        throw new PresencaError(404, `Turma com ID ${id} não encontrada.`);
    }   
    return turma;
}

export async function buscarTurmaPorNome(nome : string): Promise<Turma | null> {
    const turma = await repo.buscarPorNome(nome);
    if(!turma){
        throw new PresencaError(404, `Turma com nome ${nome} não encontrada.`);
    }
    return turma;
}

export async function criarTurma(dados : TurmaInput): Promise< Turma| null> {
    // A chave única do banco é nome + ano letivo + turno, inclusive sob concorrência.
    return persistir(() => repo.criar(dados), "Já existe uma turma com esse nome, ano letivo e turno.");
}

export async function atualizarTurma(id: number,dados : TurmaInput): Promise<Turma| null>{
    const turma = await repo.buscarPorId(id);
        if (!turma) {
            throw new PresencaError(404, `Turma com ID ${id} não encontrada.`);
        }
        return persistir(() => repo.atualizar(id, dados), "Já existe uma turma com esse nome, ano letivo e turno.");
}


export async function deletarTurma(id: number): Promise<Turma> {
    const turma = await repo.buscarPorId(id);
    if (!turma) {
        throw new PresencaError(404, `Turma com ID ${id} não encontrada.`);
   }
    return await repo.atualizar(id, { ativo: false });
    
}
