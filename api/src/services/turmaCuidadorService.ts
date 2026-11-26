import { persistir, PresencaError } from "./presencaErrors.js";
import * as repo from "../repositories/turmaCuidadorRepository.js";
import * as turmaRepo from "../repositories/turmaRepository.js";
import * as cuidadorRepo from "../repositories/cuidadorRepository.js";
import type { TurmaCuidador } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import type { TurmaCuidadorInput } from "@creche/shared/turmaCuidador";


export async function buscarTodosOsVinculos(): Promise<TurmaCuidador[]> {
    return await repo.buscarTodosOsVinculos();
}

export async function buscarCuidadorPorTurma(turmaId: number): Promise<TurmaCuidador[]> { 
    const turma = await turmaRepo.buscarPorId(turmaId);

    if (!turma) {
        throw new PresencaError(404, `Turma com ID ${turmaId} não encontrada.`);
    }

    return await repo.buscarCuidadorPorTurma(turmaId);
}
export async function buscarTurmasDosCuidadores(cuidadorId:number) {
    const Cuidador = await cuidadorRepo.buscarPorId(cuidadorId);

    if (!Cuidador) {
        throw new PresencaError(404, `Cuidador com ID ${cuidadorId} não encontrada.`);
    }

    return await repo.buscarTurmasDosCuidadores(cuidadorId)
    
}

export async function Vincular(dados: TurmaCuidadorInput): Promise<TurmaCuidador | null > {
     const turma = await turmaRepo.buscarPorId(dados.turmaId);
    if (!turma) {
        throw new PresencaError(404, `Turma com ID ${dados.turmaId} não encontrada.`);
    }
    const Cuidador = await cuidadorRepo.buscarPorId(dados.cuidadorId);
    if (!Cuidador) {
        throw new PresencaError(404, `Cuidador com ID ${dados.cuidadorId} não encontrada.`);
    }
    const vinculos = await repo.buscarCuidadorPorTurma(dados.turmaId);
    const vinculoExistente = vinculos.some(
        vinculos => vinculos.cuidadorId === dados.cuidadorId
    );

    if (vinculoExistente) {
        throw new PresencaError(409, "Cuidador já vinculado à turma.");
    }

    if (!turma.ativo || !Cuidador.ativo) throw new PresencaError(409, "Turma ou cuidador desativado.");
    return persistir(() => repo.vincular(dados));
}


export async function desvincular(turmaId: number, cuidadorId: number): Promise<TurmaCuidador> {
    return persistir(() => prisma.turmaCuidador.delete({where:{turmaId_cuidadorId:{turmaId,cuidadorId}}}));
    
}