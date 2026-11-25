import axios from 'axios';
import type { LoginInput } from '@creche/shared/auth';
import type { Aluno } from '@creche/shared/aluno';
import type { Cuidador } from '@creche/shared/cuidador';
import type { Turma, TurmaInput } from '@creche/shared/turma';
import type { TurmaCuidador } from '@creche/shared/turmaCuidador';

// Todas as chamadas à API passam por aqui
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

// Rotas de admin (/cuidadores, /presencas-cuidadores) exigem "Authorization: Bearer <token>"
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tipos do que a API devolve

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: 'ADMIN' | 'CUIDADOR';
  token: string;
};

export type CuidadorResumo = Pick<Cuidador, 'id' | 'nome' | 'email' | 'ativo'>;

export type StatusPresenca = 'presente' | 'falta' | 'falta_justificada';

export type PresencaCuidador = {
  id: number;
  cuidadorId: number;
  data: string;
  status: StatusPresenca;
  entrada: string | null;
  saida: string | null;
  observacao: string | null;
};

// Tratamento de erros

// Mensagem principal do erro (a API responde { mensagem })
export function mensagemDeErro(e: unknown, padrao: string): string {
  if (axios.isAxiosError(e)) {
    if (e.response) return e.response.data?.mensagem ?? padrao;
    return 'Não foi possível conectar à API. Ela está rodando?';
  }
  return padrao;
}

// Erros de cada campo: a API responde { detalhes: [{ campo, mensagem }] }
export function errosPorCampo(e: unknown): Record<string, string> {
  const porCampo: Record<string, string> = {};
  if (axios.isAxiosError(e) && Array.isArray(e.response?.data?.detalhes)) {
    for (const d of e.response.data.detalhes) {
      if (d.campo) porCampo[d.campo] = d.mensagem;
    }
  }
  return porCampo;
}

// Autenticação

export async function login(dados: LoginInput): Promise<Usuario> {
  const resposta = await api.post('/login', dados);
  sessionStorage.setItem('token', resposta.data.token);
  return resposta.data;
}

export async function logout() {
  try {
    await api.post('/logout');
  } finally {
    sessionStorage.removeItem('token');
  }
}

// Turmas 

export async function listarTurmas(): Promise<Turma[]> {
  const resposta = await api.get('/turmas');
  return resposta.data;
}

export async function criarTurma(turma: TurmaInput): Promise<Turma> {
  const resposta = await api.post('/turmas', turma);
  return resposta.data;
}

export async function atualizarTurma(id: number, turma: TurmaInput): Promise<Turma> {
  const resposta = await api.put(`/turmas/${id}`, turma);
  return resposta.data;
}

export async function removerTurma(id: number) {
  await api.delete(`/turmas/${id}`);
}

// Alunos e cuidadores (listas para contagens e selects) 

// Atenção: o backend ainda não tem a rota GET /alunos
export async function listarAlunos(): Promise<Aluno[]> {
  const resposta = await api.get('/alunos');
  return resposta.data;
}

export async function listarCuidadores(): Promise<CuidadorResumo[]> {
  const resposta = await api.get('/cuidadores');
  return resposta.data;
}

// Vínculo turma x cuidador 

export async function listarVinculos(): Promise<TurmaCuidador[]> {
  const resposta = await api.get('/turmaCuidador');
  return resposta.data;
}

export async function vincularCuidador(turmaId: number, cuidadorId: number) {
  // o validarBody da API lê turmaId/cuidadorId do corpo, então vão nos dois lugares
  await api.post(`/turmaCuidador/${turmaId}/${cuidadorId}`, { turmaId, cuidadorId });
}

export async function desvincularCuidador(turmaId: number, cuidadorId: number) {
  await api.delete(`/turmaCuidador/${turmaId}/${cuidadorId}`);
}

// Ponto de presença dos cuidadores 

// data no formato AAAA-MM-DD
export async function listarPontoDoDia(data: string): Promise<PresencaCuidador[]> {
  const resposta = await api.get('/presencas-cuidadores', { params: { data, limite: 100 } });
  return resposta.data.registros;
}