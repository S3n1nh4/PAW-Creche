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
export async function criar(req: Request, res: Response) { return res.status(201).json(await service.criarTurma(req.body, req.usuario!)); }
export async function adicionarAluno(req: Request, res: Response) {
  await service.adicionarAluno(idPresencaSchema.parse(req.params.id), idPresencaSchema.parse(req.params.alunoId));
  return res.status(204).send();
}
export async function transferirAluno(req: Request, res: Response) {
  const { destinoId } = z.object({ destinoId: z.number().int().positive() }).strict().parse(req.body);
  await service.moverAluno(idPresencaSchema.parse(req.params.id), idPresencaSchema.parse(req.params.alunoId), destinoId);
  return res.status(204).send();
}
export async function removerAluno(req: Request, res: Response) {
  await service.moverAluno(idPresencaSchema.parse(req.params.id), idPresencaSchema.parse(req.params.alunoId), null);
  return res.status(204).send();
}
export async function atualizar(req: Request, res: Response) {
  return res.json(await service.atualizarTurma(idPresencaSchema.parse(req.params.id), req.body));
}
export async function deletar(req: Request, res: Response) {
  await service.deletarTurma(idPresencaSchema.parse(req.params.id));
  return res.status(204).send();
}
