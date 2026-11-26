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
    return persistir(() => prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM turma WHERE id = ${dados.turmaId} FOR UPDATE`;
        const turma = await tx.turma.findUnique({ where: { id: dados.turmaId } });
        if (!turma) throw new PresencaError(404, "Turma não encontrada.");
        const cuidador = await tx.cuidador.findUnique({ where: { id: dados.cuidadorId } });
        if (!cuidador) throw new PresencaError(404, "Cuidador não encontrado.");
        const vinculos = await tx.turmaCuidador.findMany({ where: { turmaId: dados.turmaId } });
        if (vinculos.some(v => v.cuidadorId === dados.cuidadorId)) throw new PresencaError(409, "Cuidador já vinculado à turma.");
        if (vinculos.length >= 3) throw new PresencaError(409, "Cada turma permite no máximo 3 cuidadores.");
        if (!turma.ativo || !cuidador.ativo) throw new PresencaError(409, "Turma ou cuidador desativado.");
        return tx.turmaCuidador.create({ data: dados });
    }));
}


export async function desvincular(turmaId: number, cuidadorId: number): Promise<TurmaCuidador> {
    return persistir(() => prisma.turmaCuidador.delete({where:{turmaId_cuidadorId:{turmaId,cuidadorId}}}));
    
}