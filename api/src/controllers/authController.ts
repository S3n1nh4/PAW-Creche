import type { Request, Response } from "express";
import * as service from "../services/authService.js";
import type { LoginInput } from "@creche/shared/auth";
import { criarSessao, encerrarSessao } from "../services/sessaoService.js";

export async function login(req: Request, res: Response){
    const dados: LoginInput = req.body;
    const usuario = await service.autenticar(dados);
    if(!usuario){
        return res.status(401).json({ mensagem: "email ou senha inválidos" });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ...usuario, ...criarSessao({ id: usuario.id, tipoUsuario: usuario.tipoUsuario, contaId: usuario.contaId, versaoSessao: usuario.versaoSessao }) });
}

export function logout(req: Request, res: Response) {
    const token = /^Bearer ([a-f0-9]{64})$/i.exec(req.headers.authorization ?? "")?.[1];
    if (token) encerrarSessao(token);
    return res.status(204).send();
}
