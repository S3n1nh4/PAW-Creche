import express, { type Request, type Response } from "express";
import * as Service  from "../services/turmaService.js";
import type { TurmaCreateInput, TurmaUpdateInput } from "../generated/prisma/models/Turma.js";
import { errorMonitor } from "events";


export async function listar(req: Request, res: Response) {
    const turmas = await Service.buscarTurmas();
    return res.json(turmas);
}

export async function buscarPorId(req: Request, res: Response) {
    try{
        const id: number = Number(req.params.id);
        const turma = await Service.buscarPorId(Number(id));
        return res.json(turma);
    }catch(erro: any){
        return res.status(404).json({mensagem: erro.message});
    }
}
export async function buscarPorNome(req: Request, res: Response) {
    try{
        const nome = (req.params.id);
        if (typeof nome !== "string" || !nome.trim()){
            return res.status(404).json({mensagem: "nome invalido"})
        }
        const turma = await Service.buscarTurmaPorNome(nome);
        return res.json(turma);
    }catch(erro: any){
        return res.status(404).json({mensagem: erro.message});
    }
}

export async function criar(req: Request, res: Response) {
    try{
        const dados: TurmaCreateInput = req.body;
        const turma = await Service.criarTurma(dados);
        return res.status(201).json(turma);
    }catch(erro:any){
        return res.status(400).json({mensagem: erro.message});
    }
}


export async function atualizar(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const dados: TurmaUpdateInput = req.body;
        const turma = await Service.atualizarTurma(id,dados);
        return res.json(turma);
    }catch(erro:any){
        return res.status(500).json({mensagem: erro.message});
    }   
}

export async function deletar(req: Request, res: Response) {
    try {
        const id:number = Number(req.params.id);
        await Service.deletarTurma(id);
        return res.status(204).send();
    }catch(erro:any){
        return res.status(500).json({mensage: erro.message});
    }
}