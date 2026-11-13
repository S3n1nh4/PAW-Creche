import * as repo from "../repositories/titiaRepository.js";
import type { Titia } from "../generated/prisma/client.js";
import type { TitiaCreateInput, TitiaUpdateInput } from "../generated/prisma/models/Titia.js";


export async function buscarTitias(): Promise<Titia[]> {
    return await repo.buscarTodos();
}

export async function buscarTitiaPorId(id: number): Promise<Titia | null> {
    const titia = await repo.buscarPorId(id);
    if (!titia) {
        throw new Error(`Titia com ID ${id} não encontrada.`);
    }
    return titia;
}

export async function buscarTitiaPorEmail(email: string): Promise<Titia | null> {
    return await repo.buscarPorEmail(email);
}

export async function criarTitia(dados: TitiaCreateInput): Promise<Titia> {
    const titiaExistente = await repo.buscarPorEmail(dados.email);
    if (titiaExistente) {
        throw new Error(`Já existe uma titia com o email ${dados.email}.`);
    }
    return await repo.criar(dados);
}

export async function atualizarTitia(id: number, dados: TitiaUpdateInput): Promise<Titia> {
    const titia = await repo.buscarPorId(id);
    if (!titia) {
        throw new Error(`Titia com ID ${id} não encontrada.`);
    }
    return await repo.atualizar(id, dados);
}

// export async function desativarTitia(id: number): Promise<Titia> {
//     const titia = await repo.buscarPorId(id);
//     if (!titia) {
//         throw new Error(`Titia com ID ${id} não encontrada.`);
//     }
//     return await repo.desativarTitia(id);
// }

export async function deletarTitia(id: number): Promise<Titia> {
    const titia = await repo.buscarPorId(id);
    if (!titia) {
        throw new Error(`Titia com ID ${id} não encontrada.`);
    }
    return await repo.deletar(id);
}