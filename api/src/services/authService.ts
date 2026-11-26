import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import type { LoginInput } from "@creche/shared/auth";

export async function autenticar({ email, senha }: LoginInput) {
  const conta = await prisma.conta.findUnique({ where: { email }, include: { admin: true, cuidador: true } });
  if (!conta?.ativo || !await bcrypt.compare(senha, conta.senhaHash)) return null;
  const tipoUsuario = conta.perfil === "ADMIN" ? "ADMIN" as const : "CUIDADOR" as const;
  const cadastro = tipoUsuario === "ADMIN" ? conta.admin : conta.cuidador;
  if (!cadastro?.ativo) return null;
  const { senhaHash, ...publico } = cadastro;
  return { ...publico, email: conta.email, tipoUsuario, contaId: conta.id, versaoSessao: conta.versaoSessao };
}
