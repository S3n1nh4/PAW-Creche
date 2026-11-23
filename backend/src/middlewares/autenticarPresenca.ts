import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { buscarSessao, type UsuarioSessao } from "../services/sessaoService.js";
import { PresencaError } from "../services/presencaErrors.js";

declare global {
  namespace Express {
    interface Request { usuario?: UsuarioSessao }
  }
}

export function autenticarPresenca(perfil: UsuarioSessao["tipoUsuario"]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = /^Bearer ([a-f0-9]{64})$/i.exec(req.headers.authorization ?? "")?.[1];
      const usuario = token ? buscarSessao(token) : null;
      if (!usuario) throw new PresencaError(401, "Faça login e envie um token Bearer válido.");
      const cadastro = usuario.tipoUsuario === "ADMIN"
        ? await prisma.admin.findUnique({ where: { id: usuario.id }, select: { ativo: true } })
        : await prisma.cuidador.findUnique({ where: { id: usuario.id }, select: { ativo: true } });
      if (!cadastro?.ativo) throw new PresencaError(401, "Conta desativada ou removida.");
      if (usuario.tipoUsuario !== perfil) throw new PresencaError(403, "Seu perfil não pode acessar esta operação.");
      req.usuario = usuario;
      next();
    } catch (erro) { next(erro); }
  };
}
