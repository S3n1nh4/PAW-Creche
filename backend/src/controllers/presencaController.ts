import type { Request, Response } from "express";
import { filtroPresencaSchema, idPresencaSchema } from "@creche/shared/presenca";
import { presencaService } from "../services/presencaService.js";

export async function listar(req: Request, res: Response) {
  return res.json(await presencaService.listar(filtroPresencaSchema.parse(req.query), req.usuario!.id));
}
export async function buscarPorId(req: Request, res: Response) {
  return res.json(await presencaService.buscarPorId(idPresencaSchema.parse(req.params.id), req.usuario!.id));
}
export async function criar(req: Request, res: Response) {
  return res.status(201).json(await presencaService.criar(req.body, req.usuario!.id));
}
export async function atualizar(req: Request, res: Response) {
  return res.json(await presencaService.atualizar(idPresencaSchema.parse(req.params.id), req.body, req.usuario!.id));
}
