import type { Request, Response } from "express";
import * as service from "../services/alunoService.js";
import { idPresencaSchema } from "@creche/shared/presenca";
import { z } from "zod";

export async function listar(req: Request, res: Response) {
  return res.json(await service.buscarAlunos(req.usuario!));
}
export async function buscarPorId(req: Request, res: Response) {
  return res.json(await service.buscarAlunoPorId(idPresencaSchema.parse(req.params.id), req.usuario!));
}
export async function buscarPorNome(req: Request, res: Response) {
  const nome = z.string().trim().min(1).parse(req.params.nome);
  return res.json(await service.buscarPorNome(nome, req.usuario!));
}
export async function buscarPorTurma(req: Request, res: Response) {
  return res.json(await service.buscarPorTurma(idPresencaSchema.parse(req.params.turmaId), req.usuario!));
}
export async function criar(req: Request, res: Response) {
  return res.status(201).json(await service.criarAluno(req.body, req.usuario!));
}
export async function atualizar(req: Request, res: Response) {
  return res.json(await service.atualizarAluno(idPresencaSchema.parse(req.params.id), req.body, req.usuario!));
}
export async function deletar(req: Request, res: Response) {
  await service.deletarAluno(idPresencaSchema.parse(req.params.id), req.usuario!);
  return res.status(204).send();
}
