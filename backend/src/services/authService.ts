import bcrypt from "bcryptjs";
import * as cuidadorRepo from "../repositories/cuidadorRepository.js";
import * as adminRepo from "../repositories/adminRepostirio.js";
import type { LoginInput } from "@creche/shared/auth"; 

export async function autenticar({ email, senha }: LoginInput) {
  let usuario = await adminRepo.buscarPorEmail(email);
  let tipoUsuario: "ADMIN" | "CUIDADOR" = "ADMIN";

  if (!usuario) {
    usuario = await cuidadorRepo.buscarPorEmail(email);
    tipoUsuario = "CUIDADOR";
  }

  if (!usuario || !usuario.ativo || !usuario.senhaHash) {
    return null;
  }
  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {return null; }
  const { senhaHash: _, ...usuarioSemSenha } = usuario;

  return {
    ...usuarioSemSenha,
    tipoUsuario
  };
}
