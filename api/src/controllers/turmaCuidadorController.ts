import type { Request, Response } from "express";
import * as service from "../services/turmaCuidadorService.js";
import { idPresencaSchema } from "@creche/shared/presenca";
import { PresencaError } from "../services/presencaErrors.js";

export async function listar(_req: Request, res: Response) {
  return res.json(await service.buscarTodosOsVinculos());
}
export async function buscarCuidadorPorTurma(req: Request, res: Response) {
  return res.json(await service.buscarCuidadorPorTurma(idPresencaSchema.parse(req.params.turmaId)));
}
export async function buscarTurmasDosCuidadores(req: Request, res: Response) {
  return res.json(await service.buscarTurmasDosCuidadores(idPresencaSchema.parse(req.params.cuidadorId)));
}
export async function vincular(req: Request, res: Response) {
  const turmaId = idPresencaSchema.parse(req.params.turmaId);
  const cuidadorId = idPresencaSchema.parse(req.params.cuidadorId);
  if (req.body.turmaId !== turmaId || req.body.cuidadorId !== cuidadorId) {
    throw new PresencaError(400, "IDs da URL e do corpo precisam ser iguais.");
  }
  return res.status(201).json(await service.Vincular({ turmaId, cuidadorId }));
}
export async function desvincular(req: Request, res: Response) {
  await service.desvincular(idPresencaSchema.parse(req.params.turmaId), idPresencaSchema.parse(req.params.cuidadorId));
  return res.status(204).send();
}
