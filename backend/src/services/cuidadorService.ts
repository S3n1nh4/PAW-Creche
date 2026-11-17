import * as repo from "../repositories/cuidadorRepository.js";
import type { Cuidador } from "../generated/prisma/client.js";
import type { CuidadorCreateInput, CuidadorUpdateInput } from "../generated/prisma/models/Cuidador.js";


export async function buscarCuidadores(): Promise<Cuidador[]> {
    return await repo.buscarTodos();
}

export async function buscarCuidadorPorId(id: number): Promise<Cuidador | null> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new Error(`Cuidador com ID ${id} não encontrada.`);
    }
    return cuidador;
}

export async function buscarCuidadorPorEmail(email: string): Promise<Cuidador | null> {
    return await repo.buscarPorEmail(email);
}

export async function criarCuidador(dados: CuidadorCreateInput): Promise<Cuidador> {
    const cuidadorExistente = await repo.buscarPorEmail(dados.email);
    if (cuidadorExistente) {
        throw new Error(`Já existe uma Cuidador com o email ${dados.email}.`);
    }
    return await repo.criar(dados);
}

export async function atualizarCuidador(id: number, dados: CuidadorUpdateInput): Promise<Cuidador> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new Error(`Cuidador com ID ${id} não encontrada.`);
    }
    return await repo.atualizar(id, dados);
}

// export async function desativarCuidador(id: number): Promise<Cuidador> {
//     const Cuidador = await repo.buscarPorId(id);
//     if (!Cuidador) {
//         throw new Error(`Cuidador com ID ${id} não encontrada.`);
//     }
//     return await repo.desativarCuidador(id);
// }

export async function deletarCuidador(id: number): Promise<Cuidador> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new Error(`Cuidador com ID ${id} não encontrada.`);
    }
    return await repo.deletar(id);
}