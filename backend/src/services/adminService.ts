import * as repo from "../repositories/adminRepostirio.js";
import type { Admin as AdminPrisma } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";
import type { AdminInput, CadastroAdminInput } from "@creche/shared/admin";

type Admin = Omit<AdminPrisma, "senhaHash">;


const SALT_ROUNDS = 10;

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

export async function criarAdmin(dados: CadastroAdminInput ): Promise<Admin> {
    if (!dados.nome || !dados.email ) {
    throw new Error("Campos obrigatórios ausentes: nome e email.");
    }
    const existente = await repo.buscarPorEmail(dados.email);
    if (existente) {
        throw new Error("Já existe um secretário cadastrado com este email.");
    }
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS); 
    return await repo.criar({nome: dados.nome, email: dados.email, senhaHash});
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