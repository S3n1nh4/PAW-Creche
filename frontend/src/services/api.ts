import axios from 'axios';
import type { LoginInput } from '@creche/shared/auth';
import type { Aluno } from '@creche/shared/aluno';
import type { AtualizarCuidadorInput, CadastroCuidadorInput, Cuidador } from '@creche/shared/cuidador';
import type { AtualizarPresencaCuidadorInput, PresencaCuidadorInput } from '@creche/shared/presencaCuidador';
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

// Token inválido ou expirado (ex.: a API reiniciou): limpa a sessão e volta para o login
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (axios.isAxiosError(erro) && erro.response?.status === 401 && erro.config?.url !== '/login') {
      limparSessao();
      window.location.reload();
    }
    return Promise.reject(erro);
  },
);

// Tipos do que a API devolve 

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: 'ADMIN' | 'CUIDADOR';
  token: string;
};

// Como a API devolve o cuidador: telefone pode ser nulo e o salário (Decimal) vem como texto
export type CuidadorResumo = Pick<Cuidador, 'id' | 'nome' | 'email' | 'ativo'> & {
  telefone: string | null;
  dataAdmissao: string;
  salarioBase: string | number;
};

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

function limparSessao() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
}

// Quem está logado (guardado na sessão do navegador, para o F5 não deslogar)
export function usuarioSalvo(): Usuario | null {
  try {
    const texto = sessionStorage.getItem('usuario');
    return texto ? (JSON.parse(texto) as Usuario) : null;
  } catch {
    return null;
  }
}

export async function login(dados: LoginInput): Promise<Usuario> {
  const resposta = await api.post('/login', dados);
  sessionStorage.setItem('token', resposta.data.token);
  sessionStorage.setItem('usuario', JSON.stringify(resposta.data));
  return resposta.data;
}

export async function logout() {
  try {
    await api.post('/logout');
  } finally {
    limparSessao();
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

// Alunos (só leitura: contagens da Dashboard e das Turmas) 

// Se a API ainda não tiver GET /alunos (404), devolve lista vazia para a tela abrir mesmo assim
export async function listarAlunos(): Promise<Aluno[]> {
  try {
    const resposta = await api.get('/alunos');
    return resposta.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return [];
    throw e;
  }
}

// Cuidadores 

export async function listarCuidadores(): Promise<CuidadorResumo[]> {
  const resposta = await api.get('/cuidadores');
  return resposta.data;
}

export async function criarCuidador(cuidador: CadastroCuidadorInput): Promise<CuidadorResumo> {
  const resposta = await api.post('/cuidadores', cuidador);
  return resposta.data;
}

export async function atualizarCuidador(id: number, cuidador: AtualizarCuidadorInput): Promise<CuidadorResumo> {
  const resposta = await api.put(`/cuidadores/${id}`, cuidador);
  return resposta.data;
}

export async function removerCuidador(id: number) {
  await api.delete(`/cuidadores/${id}`);
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

export async function criarPonto(dados: PresencaCuidadorInput): Promise<PresencaCuidador> {
  const resposta = await api.post('/presencas-cuidadores', dados);
  return resposta.data;
}

export async function atualizarPonto(id: number, dados: AtualizarPresencaCuidadorInput): Promise<PresencaCuidador> {
  const resposta = await api.put(`/presencas-cuidadores/${id}`, dados);
  return resposta.data;
}

// Precisa da rota DELETE /presencas-cuidadores/:id (ver patch do backend)
export async function removerPonto(id: number) {
  await api.delete(`/presencas-cuidadores/${id}`);
}