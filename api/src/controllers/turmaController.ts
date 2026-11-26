import type { Request, Response } from "express";
import * as service from "../services/turmaService.js";
import { idPresencaSchema } from "@creche/shared/presenca";
import { z } from "zod";

export async function listar(_req: Request, res: Response) { return res.json(await service.buscarTurmas()); }
export async function buscarPorId(req: Request, res: Response) {
  return res.json(await service.buscarPorId(idPresencaSchema.parse(req.params.id)));
}
export async function buscarPorNome(req: Request, res: Response) {
  return res.json(await service.buscarTurmaPorNome(z.string().trim().min(1).parse(req.params.nome)));
}
export async function criar(req: Request, res: Response) { return res.status(201).json(await service.criarTurma(req.body)); }
export async function atualizar(req: Request, res: Response) {
  return res.json(await service.atualizarTurma(idPresencaSchema.parse(req.params.id), req.body));
}
export async function deletar(req: Request, res: Response) {
  await service.deletarTurma(idPresencaSchema.parse(req.params.id));
  return res.status(204).send();
}
