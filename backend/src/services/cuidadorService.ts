import * as repo from "../repositories/cuidadorRepository.js";
import type { Cuidador as CuidadorPrisma } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";
import type { CuidadorInput, CadastroCuidadorInput, AtualizarCuidadorInput } from "@creche/shared/cuidador";

type Cuidador = Omit<CuidadorPrisma, "senha">;

const SALT_ROUNDS = 10;

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

export async function criarCuidador(dados: CadastroCuidadorInput): Promise<Cuidador> {
    const cuidadorExistente = await repo.buscarPorEmail(dados.email);
    if (cuidadorExistente) {
        throw new Error(`Já existe uma Cuidador com o email ${dados.email}.`);
    }
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    return await repo.criar({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        senhaHash,
        salarioBase: dados.salarioBase,
        ativo: dados.ativo,
    });
}

export async function atualizarCuidador(id: number, dados: AtualizarCuidadorInput): Promise<Cuidador> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new Error(`Cuidador com ID ${id} não encontrada.`);
    }
    const { senha, ...dadosAtualizacao } = dados;

    const dadosFinal = {...dadosAtualizacao,...(senha && {senhaHash: await bcrypt.hash(senha, SALT_ROUNDS) })};

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