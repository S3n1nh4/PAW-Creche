import express, { type Request, type Response } from "express";
import * as Service  from "../services/alunoService.js";
import type { AlunoCreateInput, AlunoUpdateInput } from "../generated/prisma/models/Aluno.js";

export async function listar(req: Request, res: Response) {
    const alunos = await Service.buscarAlunos();
    return res.json(alunos);
};
export async function buscarPorId(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const aluno = await Service.buscarAlunoPorId(Number(id));
        return res.json(aluno);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
} 
export async function buscarPorNome(req: Request, res: Response) {
    try {
        const nome = (req.params.id);
        if (typeof nome !== "string" || !nome.trim()){
            return res.status(404).json({mensagem: "nome invalido"})
        }
        const aluno = await Service.buscarPorNome(nome);
        return res.json(aluno);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
} 

export async function buscarPorTurma(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const alunos = await Service.buscarPorTurma(Number(id));
        return res.json(alunos);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
}

export async function criar(req: Request, res: Response) {
    try {
        const dados: AlunoCreateInput = req.body;
        const aluno = await Service.criarAluno(dados);
        return res.status(201).json(aluno);
    } catch (erro:any) {
        return res.status(400).json({ mensagem: erro.message });
    }
    
}
export async function atualizar(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const dados: AlunoCreateInput = req.body;
        const aluno = await Service.atualizarAluno(id, dados);
        return res.json(aluno);
    } catch (erro: any) {
        return res.status(500).json({mensagem: erro.message});
    }
}

export async function deletar(req: Request, res: Response){
    try {
        const id: number = Number(req.params.id);
        await Service.deletarAluno(id);
        return res.status(204).send();
    } catch (erro:any) {
        return res.status(500).json({mensagem: erro.message});
    }
}