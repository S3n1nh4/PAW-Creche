import { emailSchema } from "@creche/shared/email";
import { persistir, PresencaError } from "./presencaErrors.js";
import * as repo from "../repositories/adminRepostirio.js";
import type { Admin as AdminPrisma } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";
import type { AdminInput, CadastroAdminInput, AtualizarAdminInput } from "@creche/shared/admin";

type Admin = Omit<AdminPrisma, "senhaHash">;

function semSenha(admin: AdminPrisma): Admin {
    const { senhaHash, ...dadosPublicos } = admin;
    return dadosPublicos;
}


const SALT_ROUNDS = 10;

export async function buscarAdmins(): Promise<Admin[]> {
    return (await repo.buscarTodos()).map(semSenha);
}

export async function buscarAdminPorId(id: number): Promise<Admin | null> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new PresencaError(404, `admin com ID ${id} não encontrada.`);
    }
    return semSenha(admin);
}

export async function buscarPorEmail(email: string): Promise<Admin | null > {
    const admin = await repo.buscarPorEmail(emailSchema.parse(email));
    if (!admin) throw new PresencaError(404, "Administrador não encontrado.");
    return semSenha(admin);
}

export async function criarAdmin(dados: CadastroAdminInput ): Promise<Admin> {
    const email = emailSchema.parse(dados.email);
    const existente = await repo.buscarPorEmail(email);
    if (existente) {
        throw new PresencaError(409, "Já existe um administrador com este email.");
    }
    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS); 
    return semSenha(await persistir(() => repo.criar({ nome: dados.nome, email, senhaHash }), "Já existe um administrador com este email."));
}

export async function atualizarAdmin(id: number, dados: AtualizarAdminInput ): Promise<Admin> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new PresencaError(404, `admin com ID ${id} não encontrada.`);
    }
    const email = emailSchema.parse(dados.email);
    const existente = await repo.buscarPorEmail(email);
    if (existente && existente.id !== id) throw new PresencaError(409, "Já existe um administrador com este email.");
    const { senha, ...dadosAtualizacao } = dados;
    
    const dadosFinal = {...dadosAtualizacao, email,...(senha && {senhaHash: await bcrypt.hash(senha, SALT_ROUNDS) })};
    return semSenha(await persistir(() => repo.atualizar(id, dadosFinal), "Já existe um administrador com este email."));
}

export async function desativarAdmin(id: number): Promise<Admin> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new PresencaError(404, `Admin com ID ${id} não encontrada.`);
    }
    return semSenha(await persistir(() => repo.desativarAdmin(id)));
 }

export async function deletarAdmin(id: number): Promise<Admin> {
    const admin = await repo.buscarPorId(id);
    if (!admin) {
        throw new PresencaError(404, `admin com ID ${id} não encontrada.`);
    }
    return semSenha(await persistir(() => repo.desativarAdmin(id)));
}
