import type { Request, Response, NextFunction } from "express";

export function criarLimitadorLogin(maximo = 60, janelaMs = 15 * 60 * 1000) {
  const tentativas = new Map<string, { total: number; ate: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const agora = Date.now();
    for (const [chave, valor] of tentativas) if (valor.ate <= agora) tentativas.delete(chave);
    const chave = req.ip ?? "local";
    const atual = tentativas.get(chave) ?? { total: 0, ate: agora + janelaMs };
    if (atual.total >= maximo || (!tentativas.has(chave) && tentativas.size >= 10000)) {
      res.setHeader("Retry-After", Math.ceil((atual.ate - agora) / 1000));
      return res.status(429).json({ mensagem: "Muitas tentativas de login. Tente novamente mais tarde." });
    }
    atual.total++;
    tentativas.set(chave, atual);
    next();
  };
}
