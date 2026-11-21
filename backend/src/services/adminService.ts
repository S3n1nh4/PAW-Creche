import * as repo from "../repositories/adminRepostirio.js";
import type { Admin } from "../generated/prisma/client.js";
import type { AdminInput,CadastroAdminInput } from "@creche/shared/admin";

export async function buscarAdmins(): Promise<Admin[]> {
    return await repo.buscarTodos();
}

export async function buscarAdminPorId(id: number): Promise<Admin | null> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new Error(`admin com ID ${id} não encontrada.`);
    }
    return admin;
}

export async function buscarPorEmail(email: string): Promise<Admin | null > {
    return await repo.buscarPorEmail(email);
}

export async function criarAdmin(dados: CadastroAdminInput): Promise<Admin> {
    return await repo.criar(dados);
}

export async function atualizarAdmin(id: number, dados: CadastroAdminInput ): Promise<Admin> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new Error(`admin com ID ${id} não encontrada.`);
    }
    return await repo.atualizar(id, dados);
}

export async function desativarAdmin(id: number): Promise<Admin> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new Error(`Admin com ID ${id} não encontrada.`);
    }
    return await repo.desativarAdmin(id);
 }

export async function deletarAdmin(id: number): Promise<Admin> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new Error(`admin com ID ${id} não encontrada.`);
    }
    return await repo.deletar(id);
}