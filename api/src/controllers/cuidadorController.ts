import type { Request, Response } from "express";
import * as service from "../services/cuidadorService.js";
import { idPresencaSchema } from "@creche/shared/presenca";
import { emailSchema } from "@creche/shared/email";

export async function listar(req: Request, res: Response) {
  return res.json(await service.buscarCuidadores());
}

export async function buscarPorId(req: Request, res: Response) {
  return res.json(await service.buscarCuidadorPorId(idPresencaSchema.parse(req.params.id)));
}

export async function buscarPorEmail(req: Request, res: Response) {
  return res.json(await service.buscarCuidadorPorEmail(emailSchema.parse(req.params.email)));
}

export async function criar(req: Request, res: Response) {
  return res.status(201).json(await service.criarCuidador(req.body));
}

export async function atualizar(req: Request, res: Response) {
  return res.json(await service.atualizarCuidador(idPresencaSchema.parse(req.params.id), req.body));
}

export async function deletar(req: Request, res: Response) {
  await service.deletarCuidador(idPresencaSchema.parse(req.params.id));
  return res.status(204).send();
}
