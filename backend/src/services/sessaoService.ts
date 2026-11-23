import { createHash, randomBytes } from "node:crypto";

export type UsuarioSessao = { id: number; tipoUsuario: "ADMIN" | "CUIDADOR" };
type Sessao = { usuario: UsuarioSessao; expiraEm: number };
const sessoes = new Map<string, Sessao>();
const duracao = 8 * 60 * 60 * 1000;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Sessões locais: reiniciar a API encerra os logins.
export function criarSessao(usuario: UsuarioSessao) {
  const agora = Date.now();
  for (const [chave, sessao] of sessoes) {
    if (sessao.expiraEm <= agora) sessoes.delete(chave);
  }
  const token = randomBytes(32).toString("hex");
  sessoes.set(hash(token), { usuario, expiraEm: agora + duracao });
  return { token, tokenType: "Bearer", expiresIn: duracao / 1000 };
}

export function buscarSessao(token: string): UsuarioSessao | null {
  const chave = hash(token);
  const sessao = sessoes.get(chave);
  if (!sessao) return null;
  if (sessao.expiraEm <= Date.now()) {
    sessoes.delete(chave);
    return null;
  }
  return sessao.usuario;
}

export function encerrarSessao(token: string) {
  sessoes.delete(hash(token));
}
