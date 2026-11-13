import express, { type Request, type Response } from "express";
import * as Service  from "../services/titiaService.js";
import type { TitiaCreateInput, TitiaUpdateInput } from "../generated/prisma/models/Titia.js";


export async function listar(req: Request, res: Response) {
    const titias = await Service.buscarTitias();
    return res.json(titias);
};

export async function buscarPorId(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const titia = await Service.buscarTitiaPorId(Number(id));
        return res.json(titia);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message })
    }
}

export async function buscarPorEmail(req: Request, res: Response) {
    try {
        const email = (req.query.email);
        if (typeof email !== "string" || !email.trim()){
            return res.status(404).json({mensagem: "email invalido"})
        }
        const titia = await Service.buscarTitiaPorEmail(email);
        return res.json(titia);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message })
    }    
}

export async function criar(req: Request, res: Response) {
    try {
        const dados: TitiaCreateInput = req.body;
        const titia = await Service.criarTitia(dados);
        return res.status(201).json(titia);
    } catch (erro:any) {
        return res.status(400).json({ mensagem: erro.message });
    }
    
}

export async function atualizar(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const dados: TitiaUpdateInput = req.body;
        const titia = await Service.atualizarTitia(id, dados);
        return res.json(titia);
    } catch (erro: any) {
        return res.status(500).json({mensagem: erro.message});
    }
}

// export async function desativar(req: Request, res: Response){
//     try {
//         const id: number = Number(req.params.id);
//         const titia = await Service.desativarTitia(id)
//         return res.json(titia);
//     } catch (erro:any) {
//         return res.status(500).json({mensagem: erro.message});
//     }
// }

export async function deletar(req: Request, res: Response){
    try {
        const id: number = Number(req.params.id);
        await Service.deletarTitia(id)
        return res.status(204).send();
    } catch (erro:any) {
        return res.status(500).json({mensagem: erro.message});
    }
}