import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { compativelComFaixa } from '@creche/shared/idadeAluno';

const url = process.env.SEED_TEST_DATABASE_URL;
test('seed cria dados relacionados, pode ser repetido e preserva alterações existentes', { skip: !url }, async () => {
  if (!url) return;
  if (!new URL(url).pathname.endsWith('_test')) throw new Error('Use um banco descartável terminado em _test.');
  process.env.DATABASE_URL = url;
  process.env.SEED_PASSWORD = 'SeedTeste123!';
  const { executarSeed } = await import('../prisma/seed.js');
  const { prisma } = await import('../src/config/prisma.js');
  async function contagens() {
    return Promise.all([prisma.conta.count(), prisma.admin.count(), prisma.cuidador.count(), prisma.turma.count(), prisma.turmaCuidador.count(), prisma.aluno.count(), prisma.atividade.count(), prisma.presenca.count(), prisma.presencaCuidador.count(), prisma.comportamento.count()]);
  }
  try {
    const resultado = await executarSeed();
    assert.equal(resultado.turmas, 4);
    assert.equal(resultado.alunos, 8);
    assert.equal(resultado.cuidadores.length, 3);
    const antes = await contagens();
    await executarSeed();
    assert.deepEqual(await contagens(), antes);
    const admin = await prisma.admin.findFirstOrThrow({ where: { email: resultado.administrador } });
    assert.notEqual(admin.senhaHash, process.env.SEED_PASSWORD);
    assert.equal(await bcrypt.compare(process.env.SEED_PASSWORD!, admin.senhaHash), true);
    const contas = await prisma.conta.findMany({ where: { email: { in: [resultado.administrador, ...resultado.cuidadores] } } });
    assert.equal(contas.length, 4);
    assert.ok(contas.every(c => c.ativo));
    const alunos = await prisma.aluno.findMany({ where: { observacoes: { startsWith: 'Cadastro fictício do seed:' } }, include: { turma: true } });
    assert.equal(alunos.filter(a => a.turmaId === null).length, 4);
    for (const a of alunos) if (a.turma) assert.ok(compativelComFaixa(a.dataNascimento.toISOString(), a.turma.faixaEtaria));
    const turmas = await prisma.turma.findMany({ where: { nome: { startsWith: '[Demo]' } }, include: { atividades: true, cuidadores: true } });
    for (const t of turmas) {
      assert.equal(t.criadoPorId, admin.id);
      assert.equal(t.cuidadores.length, 1);
      assert.equal(t.atividades.length, 5);
      for (const a of t.atividades) {
        assert.ok(t.cuidadores.some(c => c.cuidadorId === a.cuidadorId));
        assert.ok(t.turno === 'manha' ? a.inicio >= '07:00' && a.fim <= '12:00' : a.inicio >= '13:30' && a.fim <= '18:30');
      }
    }
    const novaSenha = await bcrypt.hash('SenhaAlterada123!', 4);
    await prisma.admin.update({ where: { id: admin.id }, data: { nome: 'Nome alterado pelo usuário', senhaHash: novaSenha } });
    const aluno = alunos.find(a => a.turmaId !== null)!;
    await prisma.aluno.update({ where: { id: aluno.id }, data: { turmaId: null } });
    await executarSeed();
    assert.deepEqual(await contagens(), antes);
    const preservado = await prisma.admin.findUniqueOrThrow({ where: { id: admin.id } });
    assert.equal(preservado.nome, 'Nome alterado pelo usuário');
    assert.equal(preservado.senhaHash, novaSenha);
    assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: aluno.id } })).turmaId, null);
  } finally {
    await prisma.$disconnect();
  }
});
