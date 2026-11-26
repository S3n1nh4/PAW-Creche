import type { Request, Response } from "express";
import * as service from "../services/adminService.js";
import { idPresencaSchema } from "@creche/shared/presenca";
import { emailSchema } from "@creche/shared/email";

export async function listar(req: Request, res: Response) {
  return res.json(await service.buscarAdmins());
}

export async function buscarPorId(req: Request, res: Response) {
  return res.json(await service.buscarAdminPorId(idPresencaSchema.parse(req.params.id)));
}

export async function buscarPorEmail(req: Request, res: Response) {
  return res.json(await service.buscarPorEmail(emailSchema.parse(req.params.email)));
}

export async function criar(req: Request, res: Response) {
  return res.status(201).json(await service.criarAdmin(req.body));
}

export async function atualizar(req: Request, res: Response) {
  return res.json(await service.atualizarAdmin(idPresencaSchema.parse(req.params.id), req.body));
}

export async function desativar(req: Request, res: Response) {
  return res.json(await service.desativarAdmin(idPresencaSchema.parse(req.params.id)));
}

export async function deletar(req: Request, res: Response) {
  await service.deletarAdmin(idPresencaSchema.parse(req.params.id));
  return res.status(204).send();
}
