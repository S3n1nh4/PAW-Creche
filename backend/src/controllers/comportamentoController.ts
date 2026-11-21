import express, { type Request, type Response } from "express";
import * as Service  from "../services/comportamentoService.js";
import type { ComportamentoInput } from "@creche/shared/comportamento";


export async function listar(req: Request, res: Response) {
    const Comportamentos = await Service.buscarComportamentos();
    return res.json(Comportamentos);
};
export async function buscarPorId(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const comportamento = await Service.buscarComportamentoPorId(Number(id));
        return res.json(comportamento);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
};

export async function buscarPorCuidador(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const comportamento = await Service.buscarComportamentoPorCuidador(id);
        return res.json(comportamento);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
}; 

export async function buscarPorAluno(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const comportamento = await Service.buscarComportamentoPorAluno(Number(id));
        return res.json(comportamento);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
};


export async function criar(req: Request, res: Response) {
    try {
        const dados: ComportamentoInput = req.body;
        const comportamento = await Service.criarComportamento(dados);
        return res.status(201).json(comportamento);
    } catch (erro:any) {
        return res.status(400).json({ mensagem: erro.message });
    }
    
};

export async function atualizar(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const dados: ComportamentoInput = req.body;
        const comportamento = await Service.atualizar(id, dados);
        return res.json(comportamento);
    } catch (erro: any) {
        return res.status(500).json({mensagem: erro.message});
    }
};

export async function deletar(req: Request, res: Response){
    try {
        const id: number = Number(req.params.id);
        await Service.deletar(id);
        return res.status(204).send();
    } catch (erro:any) {
        return res.status(500).json({mensagem: erro.message});
    }
}