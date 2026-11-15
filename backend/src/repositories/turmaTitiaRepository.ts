import {prisma} from "../config/prisma.js";
import type { TurmaTitia } from "../generated/prisma/client.js";
import type { TurmaTitiaUncheckedCreateInput } from "../generated/prisma/models/TurmaTitia.js";

export async function buscarTodosOsVinculos(): Promise<TurmaTitia[]> {
    return await prisma.turmaTitia.findMany();
    
}