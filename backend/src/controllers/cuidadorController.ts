import express, { type Request, type Response } from "express";
import * as Service  from "../services/cuidadorService.js";
import type { CuidadorInput, CadastroCuidadorInput } from "@creche/shared/cuidador";


export async function listar(req: Request, res: Response) {
    const cuidadores = await Service.buscarCuidadores();
    return res.json(cuidadores);
};

export async function buscarPorId(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const cuidador = await Service.buscarCuidadorPorId(Number(id));
        return res.json(cuidador);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message });
    }
}

export async function buscarPorEmail(req: Request, res: Response) {
    try {
        const email = (req.query.email);
        if (typeof email !== "string" || !email.trim()){
            return res.status(404).json({mensagem: "email invalido"})
        }
        const cuidador = await Service.buscarCuidadorPorEmail(email);
        return res.json(cuidador);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message })
    }    
}

export async function criar(req: Request, res: Response) {
    try {
        const dados: CadastroCuidadorInput = req.body;
        const cuidador = await Service.criarCuidador(dados);
        return res.status(201).json(cuidador);
    } catch (erro:any) {
        return res.status(400).json({ mensagem: erro.message });
    }
    
}

export async function atualizar(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const dados: CadastroCuidadorInput = req.body;
        const cuidador = await Service.atualizarCuidador(id, dados);
        return res.json(cuidador);
    } catch (erro: any) {
        return res.status(500).json({mensagem: erro.message});
    }
}

// export async function desativar(req: Request, res: Response){
//     try {
//         const id: number = Number(req.params.id);
//         const Cuidador = await Service.desativarCuidador(id)
//         return res.json(Cuidador);
//     } catch (erro:any) {
//         return res.status(500).json({mensagem: erro.message});
//     }
// }

export async function deletar(req: Request, res: Response){
    try {
        const id: number = Number(req.params.id);
        await Service.deletarCuidador(id);
        return res.status(204).send();
    } catch (erro:any) {
        return res.status(500).json({mensagem: erro.message});
    }
}