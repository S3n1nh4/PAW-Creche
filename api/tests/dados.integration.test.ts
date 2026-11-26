import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";

// Nunca utiliza o DATABASE_URL normal por engano.
const url = process.env.DADOS_TEST_DATABASE_URL;
test("Correções de dados com PostgreSQL real", { skip: !url }, async (t) => {
  if (!url) return;
  if (!new URL(url).pathname.endsWith("_test")) throw new Error("Use um banco descartável com nome terminado em _test.");
  process.env.DATABASE_URL = url;
  const { app } = await import("../src/app.js");
  const { prisma } = await import("../src/config/prisma.js");
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const endereco = server.address();
  if (!endereco || typeof endereco === "string") throw new Error("Endereço inválido");
  const base = `http://127.0.0.1:${endereco.port}`;
  const marcador = `presencas-${Date.now()}`;
  const senha = "TestePresenca123!";
  const senhaHash = await bcrypt.hash(senha, 4);
  const admins: number[] = [], cuidadores: number[] = [], turmas: number[] = [], alunos: number[] = [];
  t.after(async () => {
    try {
      await prisma.comportamento.deleteMany({ where: { alunoId: { in: alunos } } });
      await prisma.presenca.deleteMany({ where: { alunoId: { in: alunos } } });
      await prisma.presencaCuidador.deleteMany({ where: { cuidadorId: { in: cuidadores } } });
      await prisma.aluno.deleteMany({ where: { id: { in: alunos } } });
      await prisma.turmaCuidador.deleteMany({ where: { cuidadorId: { in: cuidadores } } });
      await prisma.turma.deleteMany({ where: { id: { in: turmas } } });
      await prisma.cuidador.deleteMany({ where: { id: { in: cuidadores } } });
      await prisma.admin.deleteMany({ where: { id: { in: admins } } });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await prisma.$disconnect();
    }
  });
  const admin = await prisma.admin.create({ data: { nome: marcador, email: `${marcador}-admin@example.invalid`, senhaHash } });
  admins.push(admin.id);
  const cuidador = await prisma.cuidador.create({ data: { nome: marcador, email: `${marcador}-cuidador@example.invalid`, senhaHash } });
  cuidadores.push(cuidador.id);
  const turma = await prisma.turma.create({ data: { nome: marcador, anoLetivo: 2026, turno: "manha", faixaEtaria: 'maternal_i' } });
  turmas.push(turma.id);
  const outraTurma = await prisma.turma.create({ data: { nome: `${marcador}-outra`, anoLetivo: 2026, turno: "integral", faixaEtaria: 'maternal_i' } });
  turmas.push(outraTurma.id);
  await prisma.turmaCuidador.create({ data: { turmaId: turma.id, cuidadorId: cuidador.id } });
  const aluno = await prisma.aluno.create({ data: { nome: marcador, dataNascimento: new Date("2023-01-01"), turmaId: turma.id, responsavelNome: "Responsável", responsavelParentesco: "Mãe", responsavelTelefone: "11999999999" } });
  alunos.push(aluno.id);
  async function request(path: string, method = "GET", token?: string, body?: unknown) {
    const response = await fetch(`${base}${path}`, { method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
    const data = response.status === 204 ? null : await response.json();
    return { status: response.status, data };
  }
  const at = (await request("/login", "POST", undefined, { email: admin.email, senha })).data.token;
  const ct = (await request("/login", "POST", undefined, { email: cuidador.email, senha })).data.token;
  const rotaPlanner = `/planner/turmas/${turma.id}/atividades`;
  const dadosAtividade = { diaSemana: 1, inicio: '07:00', fim: '07:30', descricao: 'Roda de histórias' };
  assert.equal((await request(rotaPlanner)).status, 401);
  assert.equal((await request(rotaPlanner, 'POST', at, dadosAtividade)).status, 403);
  assert.equal((await request(`/planner/turmas/${outraTurma.id}/atividades`, 'POST', ct, dadosAtividade)).status, 403);
  for (const invalido of [{ diaSemana: 6 }, { inicio: '06:59' }, { fim: '12:01' }, { fim: '07:00' }, { cuidadorId: admin.id }]) {
    assert.equal((await request(rotaPlanner, 'POST', ct, { ...dadosAtividade, ...invalido })).status, 400);
  }
  const criadas = await Promise.all([request(rotaPlanner, 'POST', ct, dadosAtividade), request(rotaPlanner, 'POST', ct, dadosAtividade)]);
  assert.deepEqual(criadas.map(r => r.status).sort(), [201, 409]);
  const atividade = criadas.find(r => r.status === 201)!.data;
  assert.equal(atividade.cuidadorId, cuidador.id);
  assert.equal(atividade.cuidador.nome, cuidador.nome);
  assert.equal(atividade.cuidador.senhaHash, undefined);
  assert.equal((await request(rotaPlanner, 'GET', at)).data.length, 1);
  assert.ok((await request('/planner/turmas', 'GET', ct)).data.every((t: { id: number }) => t.id === turma.id));
  assert.equal((await request(`/turmas/${turma.id}`, 'PUT', at, { nome: marcador, anoLetivo: 2026, turno: 'tarde', ativo: true })).status, 409);
  assert.equal((await request(`${rotaPlanner}/${atividade.id}`, 'DELETE', at)).status, 403);
  assert.equal((await request(`${rotaPlanner}/${atividade.id}`, 'DELETE', ct)).status, 204);
  assert.equal((await request(rotaPlanner, 'GET', at)).data.length, 0);
  const dadosTurmaFaixa = { nome: `${marcador}-faixa`, sala: 'Sala 2', anoLetivo: 2026, turno: 'manha', faixaEtaria: 'maternal_i', ativo: true };
  const turmaFaixa = await request('/turmas', 'POST', at, dadosTurmaFaixa);
  assert.equal(turmaFaixa.status, 201);
  turmas.push(turmaFaixa.data.id);
  assert.equal(turmaFaixa.data.faixaEtaria, 'maternal_i');
  assert.equal(turmaFaixa.data.sala, 'Sala 2');
  assert.equal(turmaFaixa.data.criadoPorId, admin.id);
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'GET', at)).data.criadoPor.nome, admin.nome);
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'GET', at)).data.criadoPor.senhaHash, undefined);
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'GET', at)).data.faixaEtaria, 'maternal_i');
  assert.equal((await request('/turmas', 'POST', at, { ...dadosTurmaFaixa, faixaEtaria: 'invalida' })).status, 400);
  // Clientes antigos que não enviam a faixa não apagam a informação já cadastrada.
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'PUT', at, {
    nome: dadosTurmaFaixa.nome, anoLetivo: 2026, turno: 'tarde', ativo: true,
  })).data.faixaEtaria, 'maternal_i');
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'GET', at)).data.sala, 'Sala 2');
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'PUT', at, { ...dadosTurmaFaixa, sala: 'Sala 3' })).data.sala, 'Sala 3');
  assert.equal((await request(`/turmas/${turmaFaixa.data.id}`, 'PUT', at, { ...dadosTurmaFaixa, sala: null })).data.sala, null);
  assert.equal((await request('/turmas', 'POST', at, { ...dadosTurmaFaixa, sala: ' '.repeat(3) })).status, 400);
  for (const rota of ["/alunos", "/turmas", "/comportamentos", "/turmaCuidador"]) {
    assert.equal((await request(rota)).status, 401);
  }
  assert.equal((await request("/turmas", "GET", ct)).status, 403);
  // Criação/edição e inclusões concorrentes respeitam o mesmo limite de três.
  const extras: number[] = [];
  for (let i = 0; i < 4; i++) {
    const c = await prisma.cuidador.create({ data: { nome: `${marcador}-${i}`, email: `${marcador}-${i}@example.invalid`, senhaHash } });
    cuidadores.push(c.id); extras.push(c.id);
  }
  const turmaComCuidadores = await request('/turmas', 'POST', at, { ...dadosTurmaFaixa, nome: `${marcador}-equipe`, cuidadorIds: extras.slice(0, 2) });
  assert.equal(turmaComCuidadores.status, 201);
  const equipeId = turmaComCuidadores.data.id;
  turmas.push(equipeId);
  const inclusoes = await Promise.all(extras.slice(2).map(cuidadorId => request(`/turmaCuidador/${equipeId}/${cuidadorId}`, 'POST', at, { turmaId: equipeId, cuidadorId })));
  assert.deepEqual(inclusoes.map(r => r.status).sort(), [201, 409]);
  assert.equal(await prisma.turmaCuidador.count({ where: { turmaId: equipeId } }), 3);
  assert.equal((await request(`/turmas/${equipeId}`, 'PUT', at, { ...dadosTurmaFaixa, nome: `${marcador}-equipe`, cuidadorIds: extras })).status, 400);
  assert.equal((await request(`/turmas/${equipeId}`, 'PUT', at, { ...dadosTurmaFaixa, nome: `${marcador}-substituida`, cuidadorIds: [extras[3]] })).status, 200);
  assert.deepEqual((await prisma.turmaCuidador.findMany({ where: { turmaId: equipeId } })).map(v => v.cuidadorId), [extras[3]]);
  assert.equal((await request(`/turmas/${equipeId}`, 'PUT', at, { ...dadosTurmaFaixa, nome: `${marcador}-nao-gravar`, cuidadorIds: [2147483647] })).status, 400);
  assert.equal((await prisma.turma.findUniqueOrThrow({ where: { id: equipeId } })).nome, `${marcador}-substituida`);
  assert.equal((await request(`/turmas/${equipeId}`, 'PUT', at, { ...dadosTurmaFaixa, nome: `${marcador}-substituida`, cuidadorIds: [] })).status, 200);
  assert.equal(await prisma.turmaCuidador.count({ where: { turmaId: equipeId } }), 0);
  const dadosAluno = { nome: `${marcador}-novo`, dataNascimento: "29/02/2024", turmaId: turma.id,
    responsavelNome: "Responsável", responsavelParentesco: "Mãe", responsavelTelefone: "11999999999", responsavelEmail: null, observacoes: null, ativo: true };
  assert.equal((await request("/alunos", "POST", at, { ...dadosAluno, dataNascimento: "31/02/2024" })).status, 400);
  const novo = await request("/alunos", "POST", ct, dadosAluno);
  assert.equal(novo.status, 201);
  alunos.push(novo.data.id);
  const semTurma = await request('/alunos', 'POST', at, { ...dadosAluno, nome: `${marcador}-sem-turma`, turmaId: null });
  assert.equal(semTurma.status, 201);
  alunos.push(semTurma.data.id);
  const rotaAdicionar = `/turmas/${turma.id}/alunos/${semTurma.data.id}`;
  assert.equal((await request(rotaAdicionar, 'PUT', ct)).status, 403);
  await prisma.turma.update({ where: { id: turma.id }, data: { faixaEtaria: 'bercario_i' } });
  assert.equal((await request(rotaAdicionar, 'PUT', at)).status, 409);
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: semTurma.data.id } })).turmaId, null);
  await prisma.turma.update({ where: { id: turma.id }, data: { faixaEtaria: 'maternal_i' } });
  assert.equal((await request(rotaAdicionar, 'PUT', at)).status, 204);
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: semTurma.data.id } })).turmaId, turma.id);
  assert.equal((await request(`/turmas/${outraTurma.id}/alunos/${semTurma.data.id}`, 'PUT', at)).status, 409);
  assert.equal((await request(`/turmas/2147483647/alunos/${semTurma.data.id}`, 'PUT', at)).status, 404);
  assert.equal(novo.data.dataNascimento, "2024-02-29T00:00:00.000Z");
  assert.equal(novo.data.responsavelParentesco, "Mãe");
  assert.equal((await request('/alunos', 'POST', at, { ...dadosAluno, dataNascimento: '01/01/2020' })).status, 400);
  assert.equal((await request('/alunos', 'POST', at, { ...dadosAluno, responsavelSecundarioNome: 'João Silva' })).status, 400);
  const secundarios = { responsavelSecundarioNome: 'João Silva', responsavelSecundarioParentesco: 'Pai', responsavelSecundarioTelefone: '11988888888' };
  assert.equal((await request(`/alunos/${novo.data.id}`, 'PUT', at, { ...dadosAluno, ...secundarios })).status, 200);
  assert.equal((await request(`/alunos/${novo.data.id}`, 'GET', at)).data.responsavelSecundarioTelefone, secundarios.responsavelSecundarioTelefone);
  const fora = await request("/alunos", "POST", at, { ...dadosAluno, nome: `${marcador}-fora`, turmaId: outraTurma.id });
  assert.equal(fora.status, 201);
  alunos.push(fora.data.id);
  assert.equal((await request(`/alunos/${fora.data.id}`, "GET", ct)).status, 403);
  assert.equal((await request("/alunos", "POST", ct, { ...dadosAluno, turmaId: outraTurma.id })).status, 403);
  const visiveis = await request("/alunos", "GET", ct);
  assert.equal(visiveis.status, 200);
  assert.ok(visiveis.data.every((a: { turmaId: number }) => a.turmaId === turma.id));
  assert.equal((await request(`/alunos/nome/${encodeURIComponent(dadosAluno.nome)}`, "GET", at)).data[0].id, novo.data.id);
  assert.ok((await request(`/alunos/turma/${turma.id}`, "GET", at)).data.some((a: { id: number }) => a.id === novo.data.id));
  assert.equal((await request("/alunos/abc", "GET", at)).status, 400);
  assert.equal((await request(`/alunos/${novo.data.id}`, "PUT", at, { ...dadosAluno, dataNascimento: "01/03/2024" })).status, 200);
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: novo.data.id } })).dataNascimento.toISOString(), "2024-03-01T00:00:00.000Z");
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: novo.data.id } })).responsavelSecundarioNome, secundarios.responsavelSecundarioNome);
  const limparSecundario = await request(`/alunos/${novo.data.id}`, 'PUT', at, { ...dadosAluno, responsavelSecundarioNome: null, responsavelSecundarioParentesco: null, responsavelSecundarioTelefone: null });
  assert.equal(limparSecundario.status, 200);
  assert.equal(limparSecundario.data.responsavelSecundarioNome, null);

  const dadosComportamento = { alunoId: novo.data.id, cuidadorId: admin.id + 999, data: "25/11/2026", descricao: "Participou de todas as atividades." };
  const comportamento = await request("/comportamentos", "POST", ct, dadosComportamento);
  assert.equal(comportamento.status, 201);
  assert.equal(comportamento.data.cuidadorId, cuidador.id);
  assert.equal(comportamento.data.data, "2026-11-25T00:00:00.000Z");
  assert.equal((await request("/comportamentos", "POST", ct, { ...dadosComportamento, alunoId: fora.data.id })).status, 403);
  assert.equal((await request(`/comportamentos/aluno/${novo.data.id}`, "GET", at)).data[0].id, comportamento.data.id);
  assert.equal((await request(`/comportamentos/cuidador/${cuidador.id}`, "GET", at)).data[0].id, comportamento.data.id);
  assert.equal((await request("/comportamentos/aluno/2147483647", "GET", at)).status, 404);
  assert.equal((await request("/comportamentos/cuidador/2147483647", "GET", at)).status, 404);
  assert.equal((await request(`/comportamentos/${comportamento.data.id}`, "PUT", ct, { ...dadosComportamento, data: "26/11/2026" })).status, 200);
  assert.equal((await request(`/comportamentos/${comportamento.data.id}`, "DELETE", ct)).status, 204);

  const ids = { turmaId: outraTurma.id !== cuidador.id ? outraTurma.id : turmaFaixa.data.id, cuidadorId: cuidador.id };
  assert.notEqual(ids.turmaId, ids.cuidadorId); // Garante que inverter IDs seria detectado.
  const rotaVinculo = `/turmaCuidador/${ids.turmaId}/${ids.cuidadorId}`;
  assert.equal((await request(rotaVinculo, "POST", at, { ...ids, turmaId: turma.id })).status, 400);
  assert.equal((await request(rotaVinculo, "POST", at, ids)).status, 201);
  assert.equal((await request(`/turmaCuidador/turma/${ids.turmaId}`, "GET", at)).data[0].cuidadorId, cuidador.id);
  assert.equal((await request(`/turmaCuidador/cuidador/${cuidador.id}`, "GET", at)).data.length, 2);
  assert.equal((await request(rotaVinculo, "DELETE", at)).status, 204);
  assert.equal((await request(rotaVinculo, "DELETE", at)).status, 404);
  assert.equal(await prisma.turmaCuidador.count({ where: { turmaId: turma.id, cuidadorId: cuidador.id } }), 1);

  const chamada = await request("/presencas", "POST", ct, { alunoId: novo.data.id, turmaId: turma.id, data: "2026-11-25", status: "presente" });
  assert.equal(chamada.status, 201);
  const rotaAlunoTurma = `/turmas/${turma.id}/alunos/${novo.data.id}`;
  assert.equal((await request(`${rotaAlunoTurma}/transferir`, 'POST', ct, { destinoId: outraTurma.id })).status, 403);
  assert.equal((await request(rotaAlunoTurma, 'DELETE', ct)).status, 403);
  assert.equal((await request(`${rotaAlunoTurma}/transferir`, 'POST', at, { destinoId: turma.id })).status, 400);
  assert.equal((await request(`${rotaAlunoTurma}/transferir`, 'POST', at, { destinoId: 2147483647 })).status, 404);
  await prisma.turma.update({ where: { id: outraTurma.id }, data: { faixaEtaria: 'bercario_i' } });
  assert.equal((await request(`${rotaAlunoTurma}/transferir`, 'POST', at, { destinoId: outraTurma.id })).status, 409);
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: novo.data.id } })).turmaId, turma.id);
  await prisma.turma.update({ where: { id: outraTurma.id }, data: { faixaEtaria: 'maternal_i' } });
  assert.equal((await request(`${rotaAlunoTurma}/transferir`, 'POST', at, { destinoId: outraTurma.id })).status, 204);
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: novo.data.id } })).turmaId, outraTurma.id);
  assert.equal((await prisma.presenca.findUniqueOrThrow({ where: { id: chamada.data.id } })).turmaId, turma.id);
  assert.equal((await request(rotaAlunoTurma, 'DELETE', at)).status, 409);
  assert.equal((await request(`/turmas/${outraTurma.id}/alunos/${novo.data.id}`, 'DELETE', at)).status, 204);
  const aposRemover = await prisma.aluno.findUniqueOrThrow({ where: { id: novo.data.id } });
  assert.equal(aposRemover.turmaId, null);
  assert.equal(aposRemover.ativo, true);
  assert.equal(await prisma.presenca.count({ where: { id: chamada.data.id } }), 1);
  assert.equal((await request(rotaAlunoTurma, 'PUT', at)).status, 204);
  assert.equal((await request(`/alunos/${novo.data.id}`, "DELETE", ct)).status, 403);
  assert.equal((await request(`/alunos/${novo.data.id}`, "DELETE", at)).status, 204);
  assert.equal((await prisma.aluno.findUniqueOrThrow({ where: { id: novo.data.id } })).ativo, false);
  assert.equal(await prisma.presenca.count({ where: { id: chamada.data.id } }), 1);
  assert.equal((await request("/alunos/2147483647", "DELETE", at)).status, 404);
  const ponto = await request("/presencas-cuidadores", "POST", at, { cuidadorId: cuidador.id, data: "2026-11-25", status: "presente" });
  assert.equal(ponto.status, 201);
  assert.equal((await request(`/presencas-cuidadores/${ponto.data.id}`, "DELETE", ct)).status, 403);
  assert.equal((await request(`/presencas-cuidadores/${ponto.data.id}`, "DELETE", at)).status, 204);
  assert.equal((await request(`/presencas-cuidadores/${ponto.data.id}`, "DELETE", at)).status, 404);
  assert.equal((await request(`/cuidadores/${cuidador.id}`, "DELETE", at)).status, 204);
  assert.equal((await prisma.cuidador.findUniqueOrThrow({ where: { id: cuidador.id } })).ativo, false);
  assert.equal((await request(`/turmas/${turma.id}`, "DELETE", at)).status, 204);
  assert.equal((await prisma.turma.findUniqueOrThrow({ where: { id: turma.id } })).ativo, false);
  assert.equal(await prisma.presenca.count({ where: { id: chamada.data.id } }), 1);
  assert.equal((await request("/turmas/2147483647", "DELETE", at)).status, 404);
});
