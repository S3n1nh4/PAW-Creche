import { emailSchema } from "@creche/shared/email";
import { persistir, PresencaError } from "./presencaErrors.js";
import * as repo from "../repositories/cuidadorRepository.js";
import type { Cuidador as CuidadorPrisma } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";
import type { CuidadorInput, CadastroCuidadorInput, AtualizarCuidadorInput } from "@creche/shared/cuidador";

type Cuidador = Omit<CuidadorPrisma, "senhaHash">;

function semSenha(cuidador: CuidadorPrisma): Cuidador {
    const { senhaHash, ...dadosPublicos } = cuidador;
    return dadosPublicos;
}

const SALT_ROUNDS = 10;

export async function buscarCuidadores(): Promise<Cuidador[]> {
    return (await repo.buscarTodos()).map(semSenha);
}

export async function buscarCuidadorPorId(id: number): Promise<Cuidador | null> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new PresencaError(404, `Cuidador com ID ${id} não encontrada.`);
    }
    return semSenha(cuidador);
}

export async function buscarCuidadorPorEmail(email: string): Promise<Cuidador | null> {
    const cuidador = await repo.buscarPorEmail(emailSchema.parse(email));
    if (!cuidador) throw new PresencaError(404, "Cuidador não encontrado.");
    return semSenha(cuidador);
}

export async function criarCuidador(dados: CadastroCuidadorInput): Promise<Cuidador> {
    const email = emailSchema.parse(dados.email);
    const cuidadorExistente = await repo.buscarPorEmail(email);
    if (cuidadorExistente) {
        throw new PresencaError(409, "Já existe um cuidador com este email.");
    }
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    return semSenha(await persistir(() => repo.criar({
        nome: dados.nome,
        email,
        telefone: dados.telefone,
        senhaHash,
        salarioBase: dados.salarioBase,
        ativo: dados.ativo,
    }), "Já existe um cuidador com este email."));
}

export async function atualizarCuidador(id: number, dados: AtualizarCuidadorInput): Promise<Cuidador> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new PresencaError(404, `Cuidador com ID ${id} não encontrada.`);
    }
    const email = emailSchema.parse(dados.email);
    const existente = await repo.buscarPorEmail(email);
    if (existente && existente.id !== id) throw new PresencaError(409, "Já existe um cuidador com este email.");
    const { senha, ...dadosAtualizacao } = dados;

    const dadosFinal = {...dadosAtualizacao, email,...(senha && {senhaHash: await bcrypt.hash(senha, SALT_ROUNDS) })};

    return semSenha(await persistir(() => repo.atualizar(id, dadosFinal), "Já existe um cuidador com este email."));
}

// export async function desativarCuidador(id: number): Promise<Cuidador> {
//     const Cuidador = await repo.buscarPorId(id);
//     if (!Cuidador) {
//         throw new PresencaError(404, `Cuidador com ID ${id} não encontrada.`);
//     }
//     return await repo.desativarCuidador(id);
// }

export async function deletarCuidador(id: number): Promise<Cuidador> {
    const cuidador = await repo.buscarPorId(id);
    if (!cuidador) {
        throw new PresencaError(404, `Cuidador com ID ${id} não encontrada.`);
    }
    return semSenha(await persistir(() => repo.atualizar(id, { ativo: false })));
}
