import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainAlunos from '../src/pages/MainAlunos';
import ModalFormAluno from '../src/components/modais/ModalFormAluno';
import App from '../src/App';
import * as api from '../src/services/api';

vi.mock('../src/services/api', async importOriginal => ({
  ...await importOriginal<typeof import('../src/services/api')>(),
  listarAlunos: vi.fn(), listarTurmas: vi.fn(), listarCuidadores: vi.fn(), listarVinculos: vi.fn(), listarPontoDoDia: vi.fn(),
  criarAluno: vi.fn(), atualizarAluno: vi.fn(), removerAluno: vi.fn(), usuarioSalvo: vi.fn(),
}));

const turma = { id: 1, nome: 'Berçário', turno: 'manha', anoLetivo: 2026, ativo: true };
const aluno: api.AlunoResumo = {
  id: 7, nome: 'Bia Silva', dataNascimento: '2025-06-01T00:00:00.000Z', turmaId: 1,
  responsavelNome: 'Ana Silva', responsavelParentesco: 'Mãe', responsavelTelefone: '11987654321',
  responsavelSecundarioNome: 'João Silva', responsavelSecundarioParentesco: 'Pai', responsavelSecundarioTelefone: '11988887777',
  responsavelEmail: null, observacoes: null, ativo: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-25T15:00:00Z'));
  vi.mocked(api.listarAlunos).mockResolvedValue([aluno]);
  vi.mocked(api.listarTurmas).mockResolvedValue([turma]);
  vi.mocked(api.listarVinculos).mockResolvedValue([{ turmaId: 1, cuidadorId: 2 }]);
  vi.mocked(api.listarPontoDoDia).mockResolvedValue([]);
  vi.mocked(api.listarCuidadores).mockResolvedValue([{ id: 2, nome: 'Maria Cuidadora', email: 'maria@example.com', telefone: null, dataAdmissao: '2026-01-01', salarioBase: 1000, ativo: true }]);
});
afterEach(() => vi.useRealTimers());

it('abre Aluno pelo menu e lista turma, idade e cuidadores', async () => {
  vi.mocked(api.usuarioSalvo).mockReturnValue({ id: 1, nome: 'Admin', email: 'admin@example.com', tipoUsuario: 'ADMIN', token: 'teste' });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getAllByRole('button', { name: 'Aluno', exact: true })[0]);
  const linha = (await screen.findByText('Bia Silva')).closest('tr')!;
  expect(linha.textContent).toContain('Berçário');
  expect(linha.textContent).toContain('1 ano');
  expect(linha.textContent).toContain('Maria Cuidadora');
});

it('visualiza os responsáveis sem permitir gravação', async () => {
  const user = userEvent.setup();
  render(<MainAlunos />);
  await user.click(await screen.findByRole('button', { name: 'Visualizar Bia Silva' }));
  const dialog = within(screen.getByRole('dialog'));
  expect((dialog.getByLabelText('Nome do Responsável', { exact: true }) as HTMLInputElement).value).toBe('Ana Silva');
  expect((dialog.getByLabelText('Responsável Secundário', { exact: true }) as HTMLInputElement).value).toBe('João Silva');
  expect((dialog.getByLabelText('Nome do Aluno') as HTMLInputElement).matches(':disabled')).toBe(true);
  expect(dialog.queryByRole('button', { name: 'Salvar aluno' })).toBeNull();
});

it('cadastra aluno, formata contatos e calcula a idade', async () => {
  const user = userEvent.setup();
  vi.mocked(api.criarAluno).mockResolvedValue(aluno);
  render(<MainAlunos />);
  await user.click(screen.getByRole('button', { name: 'Cadastrar Aluno' }));
  const form = within(screen.getByRole('dialog'));
  await user.type(form.getByLabelText('Nome do Aluno'), 'Bia Silva');
  await user.selectOptions(form.getByLabelText('Turma', { exact: true }), '1');
  await user.type(form.getByLabelText('Data de nascimento'), '2025-06-01');
  expect((form.getByLabelText('Idade do aluno (0 a 3 anos)') as HTMLInputElement).value).toBe('1 ano');
  await user.type(form.getByLabelText('Nome do Responsável', { exact: true }), 'Ana Silva');
  await user.type(form.getByLabelText('Parentesco do Responsável', { exact: true }), 'Mãe');
  await user.type(form.getByLabelText('Contato do Responsável', { exact: true }), '11987654321');
  expect((form.getByLabelText('Contato do Responsável', { exact: true }) as HTMLInputElement).value).toBe('(11) 9 8765-4321');
  await user.click(form.getByRole('button', { name: 'Salvar aluno' }));
  await waitFor(() => expect(api.criarAluno).toHaveBeenCalledWith(expect.objectContaining({ dataNascimento: '01/06/2025', turmaId: 1, responsavelParentesco: 'Mãe', responsavelTelefone: '11987654321', responsavelSecundarioNome: null })));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('rejeita idade acima de 3 anos e dados secundários incompletos', async () => {
  const user = userEvent.setup();
  const salvar = vi.fn();
  render(<ModalFormAluno turmas={[turma]} aluno={{ ...aluno, dataNascimento: '2022-11-25' }} onClose={vi.fn()} onSalvar={salvar} />);
  await user.click(screen.getByRole('button', { name: 'Salvar aluno' }));
  expect((await screen.findByRole('alert')).textContent).toContain('0 a 3 anos');
  expect(salvar).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Data de nascimento'));
  await user.type(screen.getByLabelText('Data de nascimento'), '2025-06-01');
  await user.clear(screen.getByLabelText('Contato do Responsável Secundário'));
  await user.click(screen.getByRole('button', { name: 'Salvar aluno' }));
  expect((await screen.findByRole('alert')).textContent).toContain('responsável secundário');
  expect(salvar).not.toHaveBeenCalled();
});

it('edita usando PUT e mantém o formulário quando a API falha', async () => {
  const user = userEvent.setup();
  vi.mocked(api.atualizarAluno).mockRejectedValueOnce(new Error('teste')).mockResolvedValue(aluno);
  render(<MainAlunos />);
  await user.click(await screen.findByRole('button', { name: 'Alterar Bia Silva' }));
  const form = within(screen.getByRole('dialog'));
  await user.clear(form.getByLabelText('Nome do Aluno'));
  await user.type(form.getByLabelText('Nome do Aluno'), 'Bia Atualizada');
  await user.click(form.getByRole('button', { name: 'Salvar aluno' }));
  await form.findByRole('alert');
  expect((form.getByLabelText('Nome do Aluno') as HTMLInputElement).value).toBe('Bia Atualizada');
  expect(api.atualizarAluno).toHaveBeenCalledWith(7, expect.objectContaining({ nome: 'Bia Atualizada', responsavelSecundarioParentesco: 'Pai' }));
  expect(api.criarAluno).not.toHaveBeenCalled();
  await user.click(form.getByRole('button', { name: 'Salvar aluno' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('pede confirmação e retira da lista após desativar', async () => {
  const user = userEvent.setup();
  vi.mocked(api.removerAluno).mockImplementation(async () => { vi.mocked(api.listarAlunos).mockResolvedValue([{ ...aluno, ativo: false }]); });
  render(<MainAlunos />);
  await user.click(await screen.findByRole('button', { name: 'Excluir Bia Silva' }));
  expect(api.removerAluno).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Sim' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(api.removerAluno).toHaveBeenCalledWith(7);
  await screen.findByText('Nenhum aluno encontrado.');
});
