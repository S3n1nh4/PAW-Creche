import type { Request, Response } from "express";
import { idPresencaSchema } from "@creche/shared/presenca";
import { filtroPresencaCuidadorSchema } from "@creche/shared/presencaCuidador";
import { presencaCuidadorService } from "../services/presencaCuidadorService.js";

export async function deletar(req: Request, res: Response) {
  await presencaCuidadorService.deletar(idPresencaSchema.parse(req.params.id));
  return res.status(204).send();
}

export async function listar(req: Request, res: Response) {
  return res.json(await presencaCuidadorService.listar(filtroPresencaCuidadorSchema.parse(req.query)));
}
export async function buscarPorId(req: Request, res: Response) {
  return res.json(await presencaCuidadorService.buscarPorId(idPresencaSchema.parse(req.params.id)));
}
export async function criar(req: Request, res: Response) {
  return res.status(201).json(await presencaCuidadorService.criar(req.body, req.usuario!.id));
}
export async function atualizar(req: Request, res: Response) {
  return res.json(await presencaCuidadorService.atualizar(idPresencaSchema.parse(req.params.id), req.body, req.usuario!.id));
}
