import {prisma} from "../config/prisma.js";
import type { TurmaCuidador } from "../generated/prisma/client.js";
import type { TurmaCuidadorUncheckedCreateInput } from "../generated/prisma/models/TurmaCuidador.js";

export async function buscarTodosOsVinculos(): Promise<TurmaCuidador[]> {
    return await prisma.turmaCuidador.findMany();
}

export async function buscarCuidadorPorTurma(turmaId: number): Promise<TurmaCuidador[]> {
    return await prisma.turmaCuidador.findMany({
        where: { turmaId }
    });
}


export async function buscarTurmasDoscuidadores(cuidadorId:number): Promise<TurmaCuidador[]> {
    return await prisma.turmaCuidador.findMany({
            where: {cuidadorId}
    });
}

export async function vincular(dados:TurmaCuidadorUncheckedCreateInput ): Promise<TurmaCuidador> {
    return await prisma.turmaCuidador.create({data:dados});
}

export async function desvincular(cuidadorId:number,turmaId: number): Promise<TurmaCuidador> {
    return await prisma.turmaCuidador.delete({where:{turmaId_cuidadorId:{turmaId,cuidadorId}}});
}
