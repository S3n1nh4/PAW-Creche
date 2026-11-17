import * as repo from "../repositories/turmaCuidadorRepository.js";
import * as turmaRepo from "../repositories/turmaRepository.js";
import * as cuidadorRepo from "../repositories/cuidadorRepository.js";
import type { TurmaCuidador } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";



export async function buscarTodosOsVinculos(): Promise<TurmaCuidador[]> {
    return await repo.buscarTodosOsVinculos();
}

export async function buscarCuidadorPorTurma(turmaId: number): Promise<TurmaCuidador[]> { 
    const turma = await turmaRepo.buscarPorId(turmaId);

    if (!turma) {
        throw new Error(`Turma com ID ${turmaId} não encontrada.`);
    }

    return await repo.buscarCuidadorPorTurma(turmaId);
}
export async function buscarTurmasDasCuidadors(cuidadorId:number) {
    const Cuidador = await cuidadorRepo.buscarPorId(cuidadorId);

    if (!Cuidador) {
        throw new Error(`Cuidador com ID ${cuidadorId} não encontrada.`);
    }

    return await repo.buscarTurmasDoscuidadores(cuidadorId)
    
}

export async function Vincular(turmaId: number, cuidadorId: number): Promise<TurmaCuidador | null > {
     const turma = await turmaRepo.buscarPorId(turmaId);
    if (!turma) {
        throw new Error(`Turma com ID ${turmaId} não encontrada.`);
    }
    const Cuidador = await cuidadorRepo.buscarPorId(cuidadorId);
    if (!Cuidador) {
        throw new Error(`Cuidador com ID ${cuidadorId} não encontrada.`);
    }
    const vinculos = await repo.buscarCuidadorPorTurma(turmaId);
    const vinculoExistente = vinculos.some(
        vinculos => vinculos.cuidadorId === cuidadorId
    );

    if (vinculoExistente) {
        throw new Error("Essa Cuidador já está vinculada a essa turma.");
    }

    return await repo.vincular({
        turmaId,
        cuidadorId
    });
}


export async function desvincular(turmaId: number, cuidadorId: number): Promise<TurmaCuidador> {
    return await prisma.turmaCuidador.delete({where:{turmaId_cuidadorId:{turmaId,cuidadorId}}});
    
}