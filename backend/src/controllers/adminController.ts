import express, { type Request, type Response } from "express";
import * as Service  from "../services/adminService.js";
import type { AdminCreateInput, AdminUpdateInput } from "../generated/prisma/models/Admin.js";


export async function listar(req: Request, res: Response) {
    const admins = await Service.buscarAdmins();
    return res.json(admins);
};

export async function buscarPorId(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const admin = await Service.buscarAdminPorId(Number(id));
        return res.json(admin);
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
        const admin = await Service.buscarPorEmail(email);
        return res.json(admin);
    } catch (erro: any) {
        return res.status(404).json({ mensagem: erro.message })
    }    
}

export async function criar(req: Request, res: Response) {
    try {
        const dados: AdminCreateInput = req.body;
        const admin = await Service.criarAdmin(dados);
        return res.status(201).json(admin);
    } catch (erro:any) {
        return res.status(400).json({ mensagem: erro.message });
    }
    
}

export async function atualizar(req: Request, res: Response) {
    try {
        const id: number = Number(req.params.id);
        const dados: AdminUpdateInput = req.body;
        const admin = await Service.atualizarAdmin(id, dados);
        return res.json(admin);
    } catch (erro: any) {
        return res.status(500).json({mensagem: erro.message});
    }
}

export async function desativar(req: Request, res: Response){
    try {
        const id: number = Number(req.params.id);
        const Cuidador = await Service.desativarAdmin(id)
        return res.json(Cuidador);
    } catch (erro:any) {
        return res.status(500).json({mensagem: erro.message});
    }
}

export async function deletar(req: Request, res: Response){
    try {
        const id: number = Number(req.params.id);
        await Service.deletarAdmin(id);
        return res.status(204).send();
    } catch (erro:any) {
        return res.status(500).json({mensagem: erro.message});
    }
}