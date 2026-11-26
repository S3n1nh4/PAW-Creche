import type { Request, Response } from "express";
import * as service from "../services/comportamentoService.js";
import { idPresencaSchema } from "@creche/shared/presenca";

export async function listar(req: Request, res: Response) {
  return res.json(await service.buscarComportamentos(req.usuario!));
}
export async function buscarPorId(req: Request, res: Response) {
  return res.json(await service.buscarComportamentoPorId(idPresencaSchema.parse(req.params.id), req.usuario!));
}
export async function buscarPorCuidador(req: Request, res: Response) {
  return res.json(await service.buscarComportamentoPorCuidador(idPresencaSchema.parse(req.params.cuidadorId), req.usuario!));
}
export async function buscarPorAluno(req: Request, res: Response) {
  return res.json(await service.buscarComportamentoPorAluno(idPresencaSchema.parse(req.params.alunoId), req.usuario!));
}
export async function criar(req: Request, res: Response) {
  return res.status(201).json(await service.criarComportamento({ ...req.body, cuidadorId: req.usuario!.id }, req.usuario!));
}
export async function atualizar(req: Request, res: Response) {
  return res.json(await service.atualizar(idPresencaSchema.parse(req.params.id), { ...req.body, cuidadorId: req.usuario!.id }, req.usuario!));
}
export async function deletar(req: Request, res: Response) {
  await service.deletar(idPresencaSchema.parse(req.params.id), req.usuario!);
  return res.status(204).send();
}
