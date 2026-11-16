import {prisma} from "../config/prisma.js";
import type { TurmaTitia } from "../generated/prisma/client.js";
import type { TurmaTitiaUncheckedCreateInput } from "../generated/prisma/models/TurmaTitia.js";

export async function buscarTodosOsVinculos(): Promise<TurmaTitia[]> {
    return await prisma.turmaTitia.findMany();
}

export async function buscarTitiarPorTurma(turmaId: number): Promise<TurmaTitia[]> {
    return await prisma.turmaTitia.findMany({
        where: { turmaId }
    });
}

export async function buscarTurmasDasTitias(titiaId:number): Promise<TurmaTitia[]> {
    return await prisma.turmaTitia.findMany({
            where: {titiaId}
    });
}

export async function Vincular(params:type) {
    
}