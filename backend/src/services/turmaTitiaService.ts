import * as repo from "../repositories/turmaTitiaRepository.js";
import * as turmaRepo from "../repositories/turmaRepository.js";
import * as titiaRepo from "../repositories/titiaRepository.js";
import type { TurmaTitia } from "../generated/prisma/client.js";



export async function buscarTodosOsVinculos(): Promise<TurmaTitia[]> {
    return await repo.buscarTodosOsVinculos();
}

export async function buscarTitiarPorTurma(turmaId: number): Promise<TurmaTitia[]> { 
    const turma = await turmaRepo.buscarPorId(turmaId);

    if (!turma) {
        throw new Error(`Turma com ID ${turmaId} não encontrada.`);
    }

    return await repo.buscarTitiarPorTurma(turmaId);
}
export async function buscarTurmasDasTitias(titiaId:number) {
    const titia = await titiaRepo.buscarPorId(titiaId);

    if (!titia) {
        throw new Error(`Titia com ID ${titiaId} não encontrada.`);
    }

    return await repo.buscarTurmasDasTitias(titiaId)
    
}

export async function Vincular(turmaId: number,titiaId: number): Promise<TurmaTitia | null > {
     const turma = await turmaRepo.buscarPorId(turmaId);
    if (!turma) {
        throw new Error(`Turma com ID ${turmaId} não encontrada.`);
    }
    const titia = await titiaRepo.buscarPorId(titiaId);
    if (!titia) {
        throw new Error(`Titia com ID ${titiaId} não encontrada.`);
    }
    const vinculos = await repo.buscarTitiarPorTurma(turmaId);
    const vinculoExistente = vinculos.some(
        vinculos => vinculos.titiaId === titiaId
    );

    if (vinculoExistente) {
        throw new Error("Essa titia já está vinculada a essa turma.");
    }

    return await repo.vincular({
        turmaId,
        titiaId
    });
}


export async function (params:type) {
    
}