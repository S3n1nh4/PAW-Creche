import type { Request, Response } from "express";
import * as service from "../services/authService.js";
import type { LoginInput } from "@creche/shared/auth";

export async function login(req: Request, res: Response){
    const dados: LoginInput = req.body;
    const usuario = await service.autenticar(dados);
    if(!usuario){
        return res.status(401).json({ mensagem: "email ou senha inválidos" });
    }
    return res.json(usuario);
}