import { prisma } from "../config/prisma.js";
import { persistir, PresencaError } from "./presencaErrors.js";

const camposPublicos = { id: true, email: true, perfil: true, ativo: true, criadoEm: true } as const;

export async function buscarConta(id: number) {
  const conta = await prisma.conta.findUnique({ where: { id }, select: camposPublicos });
  if (!conta) throw new PresencaError(404, "Conta não encontrada.");
  return conta;
}

export function alterarPerfil(id: number, perfil: "ADMIN" | "CUIDADOR") {
  return persistir(() => prisma.$transaction(async tx => {
    // Serializa duas trocas concorrentes da mesma conta.
    await tx.$queryRaw`SELECT id FROM conta WHERE id=${id} FOR UPDATE`;
    const conta = await tx.conta.findUnique({ where: { id }, include: { admin: true, cuidador: true } });
    if (!conta) throw new PresencaError(404, "Conta não encontrada.");
    if (conta.perfil === perfil) return buscarConta(id);
    const origem = conta.perfil === "ADMIN" ? conta.admin : conta.cuidador;
    if (!origem) throw new PresencaError(409, "Cadastro da conta incompleto.");
    await tx.conta.update({ where: { id }, data: { perfil } });
    // Os registros antigos permanecem para preservar presenças e outros históricos.
    if (perfil === "ADMIN" && !conta.admin) {
      await tx.admin.create({ data: { contaId: id, nome: origem.nome, email: conta.email, senhaHash: conta.senhaHash, ativo: conta.ativo } });
    }
    if (perfil === "CUIDADOR" && !conta.cuidador) {
      await tx.cuidador.create({ data: { contaId: id, nome: origem.nome, email: conta.email, senhaHash: conta.senhaHash, ativo: conta.ativo } });
    }
    return tx.conta.findUniqueOrThrow({ where: { id }, select: camposPublicos });
  }), "O email já pertence a outra conta.");
}
