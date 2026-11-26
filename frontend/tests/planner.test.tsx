import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlannerTurma from '../src/components/PlannerTurma';
import * as api from '../src/services/api';

vi.mock('../src/services/api', async importOriginal => ({
  ...await importOriginal<typeof import('../src/services/api')>(),
  listarAtividades: vi.fn(), criarAtividade: vi.fn(), excluirAtividade: vi.fn(),
}));
const turma = { id: 1, nome: 'Berçário', turno: 'manha', anoLetivo: 2026, ativo: true };
const atividade = { id: 1, turmaId: 1, cuidadorId: 2, diaSemana: 1, inicio: '07:00', fim: '07:30', descricao: 'Roda de histórias', cuidador: { id: 2, nome: 'Maria' } };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listarAtividades).mockResolvedValue([]);
});
it.each([['manha', '07:00–07:30', '11:30–12:00'], ['tarde', '13:30–14:00', '18:00–18:30']])('mostra dias úteis e limites do turno %s para o administrador', async (turno, primeiro, ultimo) => {
  render(<PlannerTurma turma={{ ...turma, turno }} />);
  await waitFor(() => expect(screen.queryByText('Carregando atividades...')).toBeNull());
  expect(screen.getByRole('rowheader', { name: primeiro })).toBeTruthy();
  expect(screen.getByRole('rowheader', { name: ultimo })).toBeTruthy();
  expect(screen.getAllByRole('columnheader').map(c => c.textContent)).toEqual(['Horário', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  expect(screen.queryByRole('button', { name: 'Adicionar atividade' })).toBeNull();
});
it('cuidador cadastra atividade, mantém formulário em conflito e exclui com confirmação', async () => {
  const user = userEvent.setup();
  vi.mocked(api.criarAtividade).mockRejectedValueOnce({ isAxiosError: true, response: { status: 409, data: { mensagem: 'Horário ocupado' } } }).mockImplementation(async () => { vi.mocked(api.listarAtividades).mockResolvedValue([atividade]); return atividade; });
  vi.mocked(api.excluirAtividade).mockImplementation(async () => { vi.mocked(api.listarAtividades).mockResolvedValue([]); });
  render(<PlannerTurma turma={turma} cuidadorId={2} />);
  await user.click(screen.getByRole('button', { name: 'Adicionar atividade' }));
  const dialog = within(screen.getByRole('dialog'));
  expect((dialog.getByLabelText('Início') as HTMLInputElement).value).toBe('07:00');
  expect((dialog.getByLabelText('Término') as HTMLInputElement).value).toBe('07:30');
  await user.type(dialog.getByLabelText('Atividade', { exact: true }), 'Roda de histórias');
  await user.click(dialog.getByRole('button', { name: 'Salvar atividade' }));
  expect((await dialog.findByRole('alert')).textContent).toContain('Horário ocupado');
  expect((dialog.getByLabelText('Atividade', { exact: true }) as HTMLTextAreaElement).value).toBe('Roda de histórias');
  await user.click(dialog.getByRole('button', { name: 'Salvar atividade' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(api.criarAtividade).toHaveBeenCalledWith(1, { diaSemana: 1, inicio: '07:00', fim: '07:30', descricao: 'Roda de histórias' });
  await screen.findByText('Maria');
  await user.click(screen.getByRole('button', { name: 'Excluir atividade Roda de histórias' }));
  expect(api.excluirAtividade).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Sim' }));
  await waitFor(() => expect(screen.queryByText('Roda de histórias')).toBeNull());
  expect(api.excluirAtividade).toHaveBeenCalledWith(1, 1);
});
it('não oferece excluir atividade de outro cuidador', async () => {
  vi.mocked(api.listarAtividades).mockResolvedValue([atividade]);
  render(<PlannerTurma turma={turma} cuidadorId={3} />);
  await screen.findByText('Roda de histórias');
  expect(screen.queryByRole('button', { name: 'Excluir atividade Roda de histórias' })).toBeNull();
});
