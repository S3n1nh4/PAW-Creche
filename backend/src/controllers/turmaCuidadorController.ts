import express, { type Request, type Response } from "express";
import * as Service  from "../services/turmaCuidadorService.js";
import type { TurmaCuidadorUncheckedCreateInput } from "../generated/prisma/models/TurmaCuidador.js";


export async function listar(req: Request, res: Response) {
    const turmas_Cuidadores = await Service.buscarTodosOsVinculos();
    return res.json(turmas_Cuidadores);
}

export async function buscarCuidadorPorTurma(req: Request, res: Response) {
    try{
        const turmaId: number = Number(req.params.id);
        const cuidadores = await Service.buscarCuidadorPorTurma(Number(turmaId));
        return res.json(cuidadores);
    }catch(erro: any){
        return res.status(404).json({mensagem: erro.message});
    }
}

export async function buscarTurmasDosCuidadores(req: Request, res: Response) {
    try{
        const cuidadorId: number = Number(req.params.id);
        const turmas = await Service.buscarCuidadorPorTurma(Number(cuidadorId));
        return res.json(turmas);
    }catch(erro: any){
        return res.status(404).json({mensagem: erro.message});
    }
}

export async function vincular(req: Request, res: Response) {
    try{
        const turmaId = Number(req.params.turmaId);
        const cuidadorId = Number(req.params.cuidadorId);
        const turmaCuidador = await Service.Vincular(cuidadorId,turmaId);
        return res.status(201).json(turmaCuidador);
    }catch(erro:any){
        return res.status(400).json({mensagem: erro.message});
    }
}



export async function desvincular(req: Request, res: Response) {
    try {
        const turmaId = Number(req.params.turmaId);
        const cuidadorId = Number(req.params.cuidadorId);
        await Service.desvincular(cuidadorId,turmaId);
        return res.status(204).send();
    }catch(erro:any){
        return res.status(500).json({mensagem: erro.message});
    }
}