import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cadastroAlunoSchema } from '@creche/shared/aluno';
import { hojeBrasil, idadeAlunoPermitida, compativelComFaixa } from '@creche/shared/idadeAluno';

test('idade permitida vai do nascimento até o dia anterior ao quarto aniversário', () => {
  const hoje = '2026-11-25';
  assert.equal(idadeAlunoPermitida('2026-11-25', hoje), true);
  assert.equal(idadeAlunoPermitida('2026-11-26', hoje), false);
  assert.equal(idadeAlunoPermitida('2022-11-26', hoje), true);
  assert.equal(idadeAlunoPermitida('2022-11-25', hoje), false);
});
test('faixas etárias não se sobrepõem no aniversário', () => {
  assert.equal(compativelComFaixa('2025-11-26', 'bercario_i', '2026-11-25'), true);
  assert.equal(compativelComFaixa('2025-11-26', 'bercario_i', '2026-11-26'), false);
  assert.equal(compativelComFaixa('2025-11-26', 'bercario_ii', '2026-11-26'), true);
  assert.equal(compativelComFaixa('2024-11-26', 'maternal_i', '2026-11-26'), true);
  assert.equal(compativelComFaixa('2023-11-26', 'maternal_ii', '2026-11-26'), true);
  assert.equal(compativelComFaixa('2022-11-26', 'maternal_ii', '2026-11-26'), false);
  assert.equal(compativelComFaixa('2025-11-26', null, '2026-11-26'), false);
});

test('responsável secundário precisa de nome, parentesco e telefone quando informado', () => {
  const dados = { nome: 'Aluno teste', dataNascimento: hojeBrasil().split('-').reverse().join('/'), responsavelNome: 'Ana Silva', responsavelParentesco: 'Mãe', responsavelTelefone: '11999999999' };
  assert.equal(cadastroAlunoSchema.safeParse(dados).success, true);
  assert.equal(cadastroAlunoSchema.safeParse({ ...dados, responsavelSecundarioNome: 'João Silva' }).success, false);
  assert.equal(cadastroAlunoSchema.safeParse({ ...dados, responsavelSecundarioNome: 'João Silva', responsavelSecundarioParentesco: 'Pai', responsavelSecundarioTelefone: '11988888888' }).success, true);
  assert.equal(cadastroAlunoSchema.safeParse({ ...dados, dataNascimento: '31/02/2026' }).success, false);
});
