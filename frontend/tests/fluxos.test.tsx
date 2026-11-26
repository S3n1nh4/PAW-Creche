import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainTurmas from '../src/pages/MainTurmas';
import MainCuidadores from '../src/pages/MainCuidadores';
import ModalFormTurma from '../src/components/modais/ModalFormTurma';
import Login from '../src/pages/LoginPage';
import App from '../src/App';
import * as api from '../src/services/api';

vi.mock('../src/services/api', async importOriginal => ({
  ...await importOriginal<typeof import('../src/services/api')>(),
  listarTurmas: vi.fn(), listarAlunos: vi.fn(), listarVinculos: vi.fn(), listarCuidadores: vi.fn(),
  criarTurma: vi.fn(), atualizarTurma: vi.fn(), removerTurma: vi.fn(),
  adicionarAlunoNaTurma: vi.fn(), criarAluno: vi.fn(),
  transferirAlunoDaTurma: vi.fn(), excluirAlunoDaTurma: vi.fn(),
  listarAtividades: vi.fn(), listarTurmasPlanner: vi.fn(),
  criarCuidador: vi.fn(), atualizarCuidador: vi.fn(), removerCuidador: vi.fn(),
  vincularCuidador: vi.fn(), desvincularCuidador: vi.fn(), listarPontoDoDia: vi.fn(),
  usuarioSalvo: vi.fn(), login: vi.fn(), logout: vi.fn(),
}));

const turma = { id: 1, nome: 'Maternal', anoLetivo: 2026, turno: 'integral', ativo: true };
const cuidador = { id: 2, nome: 'Maria Silva', email: 'Maria@example.com', telefone: '11999999999', salarioBase: '1500', dataAdmissao: '2026-01-01', ativo: true };
const erroApi = { isAxiosError: true, response: { status: 409, data: { mensagem: 'Operação recusada para teste' } } };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listarAtividades).mockResolvedValue([]);
  vi.mocked(api.listarTurmasPlanner).mockResolvedValue([]);
  vi.mocked(api.listarTurmas).mockResolvedValue([turma]);
  vi.mocked(api.listarAlunos).mockResolvedValue([]);
  vi.mocked(api.listarVinculos).mockResolvedValue([]);
  vi.mocked(api.listarCuidadores).mockResolvedValue([cuidador]);
  vi.mocked(api.listarPontoDoDia).mockResolvedValue([]);
  vi.mocked(api.usuarioSalvo).mockReturnValue(null);
});

async function abrirCriacao() {
  const user = userEvent.setup();
  render(<MainCuidadores />);
  await screen.findByText(cuidador.nome);
  await user.click(screen.getByRole('button', { name: 'Adicionar cuidador' }));
  const dialog = screen.getByRole('dialog', { name: 'Cadastrar cuidador' });
  const form = within(dialog);
  await user.type(form.getByLabelText('Nome completo'), 'Nova Pessoa');
  await user.type(form.getByLabelText('Email'), ' Nova@example.com ');
  await user.type(form.getByLabelText('Telefone'), '11988888888');
  await user.type(form.getByLabelText('Salário'), '160000');
  return { user, dialog, form };
}

describe('turmas', () => {
  it('mostra somente crianças compatíveis e transfere da turma atual para a turma aberta', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listarTurmas).mockResolvedValue([{ ...turma, faixaEtaria: 'bercario_ii' }, { ...turma, id: 3, nome: 'Origem' }]);
    const aluno = { id: 9, nome: 'Bia Silva', dataNascimento: '2025-06-01', responsavelNome: 'Ana Silva', responsavelTelefone: '11999999999', responsavelEmail: null, observacoes: null, turmaId: 3, ativo: true };
    vi.mocked(api.listarAlunos).mockResolvedValue([aluno, { ...aluno, id: 10, nome: 'Mais velha', dataNascimento: '2024-06-01' }, { ...aluno, id: 11, nome: 'Inativa', ativo: false }, { ...aluno, id: 12, nome: 'Já nesta turma', turmaId: 1 }]);
    vi.mocked(api.transferirAlunoDaTurma).mockImplementation(async () => { vi.mocked(api.listarAlunos).mockResolvedValue([{ ...aluno, turmaId: 1 }]); });
    render(<MainTurmas />);
    await user.click(await screen.findByRole('button', { name: 'Visualizar turma Maternal' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar Aluno' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Bia Silva')).toBeTruthy();
    expect(dialog.getByText('1 ano · Origem')).toBeTruthy();
    expect(dialog.queryByText('Mais velha')).toBeNull();
    expect(dialog.queryByText('Inativa')).toBeNull();
    expect(dialog.queryByText('Já nesta turma')).toBeNull();
    expect(dialog.queryByRole('combobox')).toBeNull();
    await user.click(dialog.getByRole('button', { name: 'Transferir Bia Silva pra essa turma' }));
    expect(api.transferirAlunoDaTurma).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Sim' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.transferirAlunoDaTurma).toHaveBeenCalledWith(3, 9, 1);
    expect(api.adicionarAlunoNaTurma).not.toHaveBeenCalled();
    await screen.findByText('Bia Silva — 1 ano');
  });
  it('atualiza cuidadores e transfere ou exclui um aluno somente após confirmação', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listarTurmas).mockResolvedValue([{ ...turma, turno: 'manha', faixaEtaria: 'bercario_ii' }, { ...turma, id: 3, nome: 'Berçário', faixaEtaria: 'bercario_ii' }, { ...turma, id: 4, nome: 'Inativa', ativo: false }]);
    vi.mocked(api.listarVinculos).mockResolvedValue([{ turmaId: 1, cuidadorId: 2 }]);
    const aluno = { id: 9, nome: 'Bia Silva', dataNascimento: '2025-06-01', responsavelNome: 'Ana Silva', responsavelTelefone: '11999999999', responsavelEmail: null, observacoes: null, turmaId: 1, ativo: true };
    vi.mocked(api.listarAlunos).mockResolvedValue([aluno]);
    vi.mocked(api.transferirAlunoDaTurma).mockRejectedValueOnce(erroApi).mockResolvedValue(undefined);
    vi.mocked(api.excluirAlunoDaTurma).mockImplementation(async () => { vi.mocked(api.listarAlunos).mockResolvedValue([{ ...aluno, turmaId: null }]); });
    render(<MainTurmas />);
    await user.click(await screen.findByRole('button', { name: 'Visualizar turma Maternal' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar/Atualizar Cuidador' }));
    expect((screen.getByLabelText('Maria Silva') as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.atualizarTurma).toHaveBeenCalledWith(1, expect.objectContaining({ cuidadorIds: [2] }));
    await user.click(screen.getByRole('button', { name: 'Transferir Bia Silva' }));
    const select = screen.getByLabelText('Turma de destino');
    expect(within(select).getAllByRole('option').map(o => o.textContent)).toEqual(['Selecione a turma', 'Berçário — integral']);
    expect(api.transferirAlunoDaTurma).not.toHaveBeenCalled();
    await user.selectOptions(select, '3');
    await user.click(screen.getByRole('button', { name: 'Confirmar transferência' }));
    await screen.findByRole('alert');
    expect((select as HTMLSelectElement).value).toBe('3');
    await user.click(screen.getByRole('button', { name: 'Confirmar transferência' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.transferirAlunoDaTurma).toHaveBeenCalledWith(1, 9, 3);
    await user.click(screen.getByRole('button', { name: 'Excluir Bia Silva da turma' }));
    expect(api.excluirAlunoDaTurma).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Sim' }));
    await screen.findByText('Nenhum aluno nesta turma.');
    expect(api.excluirAlunoDaTurma).toHaveBeenCalledWith(1, 9);
  });
  it('abre os detalhes pelo cartão, exibe autoria e adiciona aluno sem turma', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listarTurmas).mockResolvedValue([{ ...turma, faixaEtaria: 'bercario_ii', criadoEm: '2026-11-25T15:00:00Z', criadoPor: { id: 1, nome: 'Ana Admin' } }]);
    vi.mocked(api.listarVinculos).mockResolvedValue([{ turmaId: 1, cuidadorId: 2 }]);
    const aluno = { id: 9, nome: 'Bia Silva', dataNascimento: '2025-06-01', responsavelNome: 'Ana Silva', responsavelTelefone: '11999999999', responsavelEmail: null, observacoes: null, turmaId: null, ativo: true };
    vi.mocked(api.listarAlunos).mockResolvedValue([aluno]);
    vi.mocked(api.adicionarAlunoNaTurma).mockImplementation(async () => { vi.mocked(api.listarAlunos).mockResolvedValue([{ ...aluno, turmaId: 1 }]); });
    render(<MainTurmas />);
    await user.click(await screen.findByRole('button', { name: 'Visualizar turma Maternal' }));
    expect(screen.getByText('Ana Admin')).toBeTruthy();
    expect(screen.getByText('25/11/2026, 12:00:00')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cuidadores (1/3)' })).toBeTruthy();
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Adicionar Aluno' }));
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Transferir Bia Silva pra essa turma' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Adicionar Bia Silva na turma' }));
    await user.click(screen.getByRole('button', { name: 'Sim' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.adicionarAlunoNaTurma).toHaveBeenCalledWith(1, 9);
    await screen.findByText('Bia Silva — 1 ano');
    await user.click(screen.getByRole('button', { name: 'Voltar para Gestão de Turmas' }));
    await user.click(screen.getByRole('button', { name: 'Editar Maternal' }));
    expect(screen.getByRole('dialog', { name: 'Modificar Turma' })).toBeTruthy();
  });
  it('informa autoria antiga ausente e abre cadastro com turma fixa', async () => {
    const user = userEvent.setup();
    render(<MainTurmas />);
    await user.click(await screen.findByRole('button', { name: 'Visualizar turma Maternal' }));
    expect(screen.getByText('Não registrado no cadastro antigo')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Adicionar Aluno' }));
    await user.click(screen.getByRole('button', { name: 'Cadastrar novo aluno' }));
    const selecao = screen.getByLabelText('Turma', { exact: true }) as HTMLSelectElement;
    expect(selecao.value).toBe('1');
    expect(selecao.disabled).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Cadastrar Aluno' })).toBeTruthy();
  });
  it('permite substituir cuidadores e limita a seleção a três', async () => {
    const user = userEvent.setup();
    const salvar = vi.fn();
    const opcoes = [2, 3, 4, 5].map(id => ({ ...cuidador, id, nome: `Cuidador ${id}` }));
    render(<ModalFormTurma isOpen turmaInicial={{ ...turma, turno: 'manha', faixaEtaria: 'maternal_i' }} cuidadores={opcoes} cuidadorIdsIniciais={[2, 3]} onClose={vi.fn()} onSubmitTurma={salvar} />);
    expect((screen.getByLabelText('Cuidador 2') as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByLabelText('Cuidador 4'));
    expect((screen.getByLabelText('Cuidador 5') as HTMLInputElement).disabled).toBe(true);
    await user.click(screen.getByLabelText('Cuidador 2'));
    await user.click(screen.getByLabelText('Cuidador 5'));
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    expect(salvar).toHaveBeenCalledWith(expect.objectContaining({ cuidadorIds: [3, 4, 5] }));
  });
  it('usa listas de turno e faixa etária no lugar do campo Ano', async () => {
    const user = userEvent.setup();
    const salvar = vi.fn();
    render(<ModalFormTurma isOpen onClose={vi.fn()} onSubmitTurma={salvar} />);
    expect(screen.queryByLabelText('Ano')).toBeNull();
    const turno = screen.getByRole('combobox', { name: 'Turno' });
    expect(within(turno).getAllByRole('option').map(o => o.textContent)).toEqual(['Selecione o turno', 'Manhã', 'Tarde']);
    const faixa = screen.getByRole('combobox', { name: 'Turma por faixa etária' });
    expect(within(faixa).getAllByRole('option').map(o => o.textContent)).toEqual([
      'Selecione a faixa etária', 'Berçário I — 0 a 1 ano', 'Berçário II — 1 a 2 anos',
      'Maternal I — 2 a 3 anos', 'Maternal II — 3 a 4 anos',
    ]);
    await user.type(screen.getByLabelText('Nome da Turma'), 'Bebês');
    await user.type(screen.getByLabelText('Sala', { exact: true }), 'Sala 2');
    await user.selectOptions(turno, 'tarde');
    await user.click(screen.getByRole('button', { name: 'Criar' }));
    expect(salvar).not.toHaveBeenCalled();
    await user.selectOptions(faixa, 'bercario_ii');
    await user.click(screen.getByRole('button', { name: 'Criar' }));
    expect(salvar).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Bebês', sala: 'Sala 2', turno: 'tarde', faixaEtaria: 'bercario_ii' }));
  });
  it('confirma pela API e só fecha após a desativação terminar', async () => {
    const user = userEvent.setup();
    let concluir!: () => void;
    vi.mocked(api.removerTurma).mockImplementation(() => new Promise(resolve => { concluir = resolve; }));
    render(<MainTurmas />);
    await user.click(await screen.findByRole('button', { name: 'Remover Maternal' }));
    await user.click(screen.getByRole('button', { name: 'Sim' }));
    expect(api.removerTurma).toHaveBeenCalledWith(1);
    expect((screen.getByRole('button', { name: 'Salvando...' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('dialog')).toBeTruthy();
    concluir();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('mantém a confirmação aberta quando a API falha', async () => {
    const user = userEvent.setup();
    vi.mocked(api.removerTurma).mockRejectedValue(erroApi);
    render(<MainTurmas />);
    await user.click(await screen.findByRole('button', { name: 'Remover Maternal' }));
    await user.click(screen.getByRole('button', { name: 'Sim' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Operação recusada');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('preserva os dados do formulário quando salvar falha', async () => {
    const user = userEvent.setup();
    const fechar = vi.fn();
    render(<ModalFormTurma isOpen turmaInicial={turma} onClose={fechar} onSubmitTurma={vi.fn().mockRejectedValue(erroApi)} />);
    await user.clear(screen.getByLabelText('Nome da Turma'));
    await user.type(screen.getByLabelText('Nome da Turma'), 'Maternal atualizado');
    await user.selectOptions(screen.getByLabelText('Turno'), 'manha');
    await user.selectOptions(screen.getByLabelText('Turma por faixa etária'), 'maternal_i');
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await screen.findByRole('alert');
    expect((screen.getByLabelText('Nome da Turma') as HTMLInputElement).value).toBe('Maternal atualizado');
    expect(fechar).not.toHaveBeenCalled();
  });
});

describe('cuidadores', () => {
  it('preenche a edição, usa atualização e mantém senha ausente quando não é alterada', async () => {
    const user = userEvent.setup();
    vi.mocked(api.atualizarCuidador).mockRejectedValueOnce(erroApi).mockResolvedValue(cuidador);
    render(<MainCuidadores />);
    await user.click(await screen.findByRole('button', { name: 'Editar Maria Silva' }));
    const form = within(screen.getByRole('dialog', { name: 'Editar cuidador' }));
    expect((form.getByLabelText('Nome completo') as HTMLInputElement).value).toBe(cuidador.nome);
    expect((form.getByLabelText('Telefone') as HTMLInputElement).value).toBe('(11) 9 9999-9999');
    expect((form.getByLabelText('Salário') as HTMLInputElement).value).toBe('1.500,00');
    await user.clear(form.getByLabelText('Nome completo'));
    await user.type(form.getByLabelText('Nome completo'), 'Maria Atualizada');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await form.findByRole('alert');
    expect((form.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Maria Atualizada');
    expect(api.criarCuidador).not.toHaveBeenCalled();
    expect(api.atualizarCuidador).toHaveBeenCalledWith(2, expect.objectContaining({ nome: 'Maria Atualizada' }));
    expect(vi.mocked(api.atualizarCuidador).mock.calls[0][1]).not.toHaveProperty('senha');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('exige senha escolhida no cadastro e mantém o email exato', async () => {
    vi.mocked(api.criarCuidador).mockResolvedValue({ ...cuidador, id: 3 });
    const { user, form } = await abrirCriacao();
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await form.findByRole('alert');
    expect(api.criarCuidador).not.toHaveBeenCalled();
    await user.type(form.getByLabelText('Senha'), 'MinhaSenha123!');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(api.criarCuidador).toHaveBeenCalledWith(expect.objectContaining({ senha: 'MinhaSenha123!', email: ' Nova@example.com ' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('formata celular e salário e envia números corretos com várias turmas', async () => {
    vi.mocked(api.listarTurmas).mockResolvedValue([turma, { ...turma, id: 5, nome: 'Berçário' }]);
    vi.mocked(api.criarCuidador).mockResolvedValue({ ...cuidador, id: 3 });
    const { user, form } = await abrirCriacao();
    await user.clear(form.getByLabelText('Telefone'));
    await user.type(form.getByLabelText('Telefone'), '11987654321');
    expect((form.getByLabelText('Telefone') as HTMLInputElement).value).toBe('(11) 9 8765-4321');
    await user.clear(form.getByLabelText('Salário'));
    await user.type(form.getByLabelText('Salário'), '250000');
    expect((form.getByLabelText('Salário') as HTMLInputElement).value).toBe('2.500,00');
    await user.selectOptions(form.getByRole('listbox', { name: 'Turmas' }), ['1', '5']);
    await user.type(form.getByLabelText('Senha'), 'MinhaSenha123!');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.criarCuidador).toHaveBeenCalledWith(expect.objectContaining({ telefone: '11987654321', salarioBase: 2500, senha: 'MinhaSenha123!' }));
    expect(api.vincularCuidador).toHaveBeenCalledWith(1, 3);
    expect(api.vincularCuidador).toHaveBeenCalledWith(5, 3);
  });

  it('edita a senha e os vínculos sem criar outro cuidador', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listarTurmas).mockResolvedValue([turma, { ...turma, id: 5, nome: 'Berçário' }]);
    vi.mocked(api.listarVinculos).mockResolvedValue([{ turmaId: 1, cuidadorId: 2 }]);
    vi.mocked(api.atualizarCuidador).mockResolvedValue(cuidador);
    render(<MainCuidadores />);
    await user.click(await screen.findByRole('button', { name: 'Editar Maria Silva' }));
    const form = within(screen.getByRole('dialog'));
    expect((form.getByRole('listbox', { name: 'Turmas' }) as HTMLSelectElement).selectedOptions[0].value).toBe('1');
    await user.deselectOptions(form.getByLabelText('Turmas'), '1');
    await user.selectOptions(form.getByLabelText('Turmas'), '5');
    await user.type(form.getByLabelText('Nova senha (opcional)'), 'NovaSenha456!');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.atualizarCuidador).toHaveBeenCalledWith(2, expect.objectContaining({ senha: 'NovaSenha456!' }));
    expect(api.vincularCuidador).toHaveBeenCalledWith(5, 2);
    expect(api.desvincularCuidador).toHaveBeenCalledWith(1, 2);
    expect(api.criarCuidador).not.toHaveBeenCalled();
  });

  it('uma falha de associação mantém o formulário e permite repetir sem duplicar o cadastro', async () => {
    vi.mocked(api.criarCuidador).mockResolvedValue({ ...cuidador, id: 3 });
    vi.mocked(api.atualizarCuidador).mockResolvedValue({ ...cuidador, id: 3 });
    vi.mocked(api.vincularCuidador).mockRejectedValueOnce(erroApi).mockResolvedValue(undefined);
    const { user, form } = await abrirCriacao();
    await user.type(form.getByLabelText('Senha'), 'MinhaSenha123!');
    await user.selectOptions(form.getByLabelText('Turmas'), '1');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await form.findByRole('alert');
    expect((form.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Nova Pessoa');
    await user.click(form.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.criarCuidador).toHaveBeenCalledTimes(1);
    expect(api.atualizarCuidador).toHaveBeenCalledWith(3, expect.anything());
    expect(api.vincularCuidador).toHaveBeenCalledTimes(2);
  });
});

describe('perfis', () => {
  const usuario = { id: 2, nome: 'Maria', email: 'Maria@example.com', tipoUsuario: 'CUIDADOR' as const, token: 'teste' };
  it('cuidador não monta telas administrativas nem faz suas consultas', () => {
    vi.mocked(api.usuarioSalvo).mockReturnValue(usuario);
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Área do Cuidador' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Área do Administrador' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Gestão de Turmas' })).toBeNull();
    expect(api.listarTurmas).not.toHaveBeenCalled();
    expect(api.listarCuidadores).not.toHaveBeenCalled();
    expect(api.listarVinculos).not.toHaveBeenCalled();
  });
  it('login de cuidador segue para o aplicativo sem encerrar a sessão', async () => {
    const user = userEvent.setup();
    const entrar = vi.fn();
    vi.mocked(api.login).mockResolvedValue(usuario);
    render(<Login onEntrar={entrar} />);
    await user.type(screen.getByLabelText('Email'), usuario.email);
    await user.type(screen.getByLabelText('Senha'), 'MinhaSenha123!');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(entrar).toHaveBeenCalledWith(usuario));
    expect(api.logout).not.toHaveBeenCalled();
  });
});
