import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { buscarSessao, type UsuarioSessao } from "../services/sessaoService.js";
import { PresencaError } from "../services/presencaErrors.js";

declare global {
  namespace Express {
    interface Request { usuario?: UsuarioSessao }
  }
}

export function autenticarPresenca(...perfis: UsuarioSessao["tipoUsuario"][]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = /^Bearer ([a-f0-9]{64})$/i.exec(req.headers.authorization ?? "")?.[1];
      const usuario = token ? buscarSessao(token) : null;
      if (!usuario) throw new PresencaError(401, "Faça login e envie um token Bearer válido.");
      if (!usuario.contaId || !usuario.versaoSessao) throw new PresencaError(401, "Faça login novamente.");
      const conta = await prisma.conta.findUnique({ where: { id: usuario.contaId }, include: { admin: true, cuidador: true } });
      if (!conta?.ativo || conta.versaoSessao !== usuario.versaoSessao || conta.perfil !== usuario.tipoUsuario) {
        throw new PresencaError(401, "Sessão encerrada. Faça login novamente.");
      }
      const cadastro = usuario.tipoUsuario === "ADMIN" ? conta.admin : conta.cuidador;
      if (!cadastro?.ativo || cadastro.id !== usuario.id) throw new PresencaError(401, "Conta desativada ou removida.");
      if (!perfis.includes(usuario.tipoUsuario)) throw new PresencaError(403, "Seu perfil não pode acessar esta operação.");
      req.usuario = usuario;
      next();
    } catch (erro) { next(erro); }
  };
}
