import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prisma } from '../src/config/prisma.js';
import { hojeBrasil } from '@creche/shared/idadeAluno';

// Dados fictícios para desenvolvimento e apresentação. Não apaga nem atualiza cadastros existentes.
export async function executarSeed() {
  if (process.env.NODE_ENV === 'production') throw new Error('O seed de demonstração não deve ser executado em produção.');
  const senha = process.env.SEED_PASSWORD || 'DemoCreche123!';
  if (senha.length < 8 || senha.length > 72 || Buffer.byteLength(senha, 'utf8') > 72) throw new Error('SEED_PASSWORD deve ter de 8 a 72 caracteres e no máximo 72 bytes.');
  const senhaHash = await bcrypt.hash(senha, 10);
  const hoje = hojeBrasil();
  const ano = Number(hoje.slice(0, 4));
  const data = new Date(`${hoje}T00:00:00.000Z`);

  return prisma.$transaction(async tx => {
    // Impede duas execuções simultâneas de criarem os mesmos dados demonstrativos.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(724526110)::text AS seed_lock`;
    async function conta(email: string, perfil: 'ADMIN' | 'CUIDADOR') {
      const existente = await tx.conta.findUnique({ where: { email } });
      if (existente) {
        if (existente.perfil !== perfil) throw new Error(`O email de demonstração ${email} já está em outro perfil. Nenhum dado foi alterado.`);
        return existente;
      }
      return tx.conta.create({ data: { email, perfil, senhaHash } });
    }
    const contaAdmin = await conta('admin.demo@example.com', 'ADMIN');
    const admin = await tx.admin.upsert({ where: { contaId: contaAdmin.id }, update: {}, create: {
      contaId: contaAdmin.id, nome: 'Administrador Demonstração', email: contaAdmin.email, senhaHash: contaAdmin.senhaHash,
    } });
    const cuidadores = [];
    for (const [nome, email] of [['Ana Souza', 'ana.demo@example.com'], ['Bruno Lima', 'bruno.demo@example.com'], ['Carla Santos', 'carla.demo@example.com']] as const) {
      const identidade = await conta(email, 'CUIDADOR');
      cuidadores.push(await tx.cuidador.upsert({ where: { contaId: identidade.id }, update: {}, create: {
        contaId: identidade.id, nome, email, senhaHash: identidade.senhaHash, telefone: '11987654321', salarioBase: 2500, dataAdmissao: data,
      } }));
    }
    const configuracoes = [
      { nome: '[Demo] Berçário I', faixaEtaria: 'bercario_i', turno: 'manha', sala: 'Sala 1', meses: 6 },
      { nome: '[Demo] Berçário II', faixaEtaria: 'bercario_ii', turno: 'tarde', sala: 'Sala 2', meses: 18 },
      { nome: '[Demo] Maternal I', faixaEtaria: 'maternal_i', turno: 'manha', sala: 'Sala 3', meses: 30 },
      { nome: '[Demo] Maternal II', faixaEtaria: 'maternal_ii', turno: 'tarde', sala: 'Sala 4', meses: 42 },
    ];
    const turmas = [];
    const alunos = [];
    const nomes = ['Alice Oliveira', 'Bernardo Costa', 'Clara Almeida', 'Davi Pereira', 'Elisa Martins', 'Felipe Rocha', 'Gabriela Alves', 'Heitor Dias'];
    for (const [indice, config] of configuracoes.entries()) {
      const { meses, ...dadosTurma } = config;
      const chaveTurma = { nome: config.nome, anoLetivo: ano, turno: config.turno };
      const turma = await tx.turma.upsert({ where: { nome_anoLetivo_turno: chaveTurma }, update: {}, create: { ...dadosTurma, anoLetivo: ano, criadoPorId: admin.id } });
      turmas.push(turma);
      const cuidador = cuidadores[indice % cuidadores.length]!;
      const vinculo = await tx.turmaCuidador.findUnique({ where: { turmaId_cuidadorId: { turmaId: turma.id, cuidadorId: cuidador.id } } });
      if (!vinculo && await tx.turmaCuidador.count({ where: { turmaId: turma.id } }) < 3) {
        await tx.turmaCuidador.create({ data: { turmaId: turma.id, cuidadorId: cuidador.id } });
      }
      for (let posicao = 0; posicao < 2; posicao++) {
        const observacoes = `Cadastro fictício do seed: aluno-${indice}-${posicao}-${ano}.`;
        let aluno = await tx.aluno.findFirst({ where: { observacoes } });
        if (!aluno) {
          // Dia 15 evita datas inexistentes ao subtrair meses (por exemplo, fevereiro).
          const nascimento = new Date(Date.UTC(ano, Number(hoje.slice(5, 7)) - 1 - meses, 15));
          aluno = await tx.aluno.create({ data: {
            nome: nomes[indice * 2 + posicao]!, dataNascimento: nascimento,
            turmaId: posicao === 0 ? turma.id : null,
            responsavelNome: `Mariana ${indice + 1}`, responsavelParentesco: 'Mãe', responsavelTelefone: '11999990000',
            responsavelSecundarioNome: `Pedro ${indice + 1}`, responsavelSecundarioParentesco: 'Pai', responsavelSecundarioTelefone: '11999991111', observacoes,
          } });
        }
        alunos.push(aluno);
        // Não cria presença para crianças que foram transferidas ou desativadas depois do seed.
        if (aluno.ativo && turma.ativo && aluno.turmaId === turma.id) {
          await tx.presenca.upsert({ where: { alunoId_data: { alunoId: aluno.id, data } }, update: {}, create: {
            alunoId: aluno.id, turmaId: turma.id, data, status: 'presente', registradoPorCuidadorId: cuidador.id, observacao: 'Presença fictícia para demonstração.',
          } });
          const descricao = 'Registro fictício do seed: participou das atividades em grupo.';
          if (!await tx.comportamento.findFirst({ where: { alunoId: aluno.id, descricao } })) {
            await tx.comportamento.create({ data: { alunoId: aluno.id, cuidadorId: cuidador.id, data, descricao } });
          }
        }
      }
      // Cada turma recebe uma atividade em cada dia útil, respeitando o turno e conflitos existentes.
      for (let diaSemana = 1; diaSemana <= 5; diaSemana++) {
        const inicio = config.turno === 'manha' ? '07:30' : '14:00';
        const fim = config.turno === 'manha' ? '08:00' : '14:30';
        const descricao = `[Demo] ${['Roda de histórias', 'Pintura com as mãos', 'Música e movimento', 'Brincadeiras sensoriais', 'Exploração de brinquedos'][diaSemana - 1]}`;
        if (turma.ativo && turma.turno === config.turno && !await tx.atividade.findFirst({ where: { turmaId: turma.id, diaSemana, OR: [{ descricao }, { inicio: { lt: fim }, fim: { gt: inicio } }] } })) {
          await tx.atividade.create({ data: { turmaId: turma.id, cuidadorId: cuidador.id, diaSemana, inicio, fim, descricao } });
        }
      }
    }
    for (const cuidador of cuidadores) {
      await tx.presencaCuidador.upsert({ where: { cuidadorId_data: { cuidadorId: cuidador.id, data } }, update: {}, create: {
        cuidadorId: cuidador.id, data, status: 'presente', entrada: new Date(`${hoje}T07:00:00-03:00`), saida: new Date(`${hoje}T12:00:00-03:00`), registradoPorAdminId: admin.id, observacao: 'Ponto fictício para demonstração.',
      } });
    }
    return { administrador: admin.email, cuidadores: cuidadores.map(c => c.email), turmas: turmas.length, alunos: alunos.length };
  }, { timeout: 30000 });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  executarSeed().then(resultado => {
    console.log('Seed concluído. Registros existentes foram preservados.');
    console.log(resultado);
    console.log('Senha dos novos usuários: definida por SEED_PASSWORD ou padrão local DemoCreche123! (não altera senhas existentes).');
  }).catch(() => {
    console.error('Falha no seed: confirme as migrações, a conexão e se os emails demonstrativos mantêm os perfis originais. A transação foi revertida.');
    process.exitCode = 1;
  }).finally(() => prisma.$disconnect());
}
