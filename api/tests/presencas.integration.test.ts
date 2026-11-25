import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";

// Nunca utiliza o DATABASE_URL normal por engano.
const url = process.env.PRESENCAS_TEST_DATABASE_URL;
test("API de presenças com PostgreSQL real", { skip: !url }, async (t) => {
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
  const turma = await prisma.turma.create({ data: { nome: marcador, anoLetivo: 2026, turno: "integral" } });
  turmas.push(turma.id);
  const outraTurma = await prisma.turma.create({ data: { nome: `${marcador}-outra`, anoLetivo: 2026, turno: "integral" } });
  turmas.push(outraTurma.id);
  await prisma.turmaCuidador.create({ data: { turmaId: turma.id, cuidadorId: cuidador.id } });
  const aluno = await prisma.aluno.create({ data: { nome: marcador, dataNascimento: new Date("2023-01-01"), turmaId: turma.id, responsavelNome: "Responsável", responsavelTelefone: "11999999999" } });
  alunos.push(aluno.id);
  async function request(path: string, method = "GET", token?: string, body?: unknown) {
    const response = await fetch(`${base}${path}`, { method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
    const data = response.status === 204 ? null : await response.json();
    return { status: response.status, data };
  }
  assert.equal((await request("/presencas")).status, 401);
  assert.equal((await request("/login", "POST", undefined, { email: admin.email, senha: "Errada123" })).status, 401);
  const loginAdmin = await request("/login", "POST", undefined, { email: admin.email, senha });
  const loginCuidador = await request("/login", "POST", undefined, { email: cuidador.email, senha });
  assert.equal(loginAdmin.status, 200);
  assert.equal(loginCuidador.status, 200);
  assert.equal(loginAdmin.data.senhaHash, undefined);
  const at = loginAdmin.data.token, ct = loginCuidador.data.token;
  assert.equal((await request("/presencas", "GET", at)).status, 403);
  assert.equal((await request("/presencas-cuidadores", "GET", ct)).status, 403);
  const chamada = { alunoId: aluno.id, turmaId: turma.id, data: "2026-11-23", status: "presente" };
  assert.equal((await request("/presencas", "POST", ct, { ...chamada, registradoPorCuidadorId: 999 })).status, 400);
  assert.equal((await request("/presencas", "POST", ct, { ...chamada, data: "2026-02-30" })).status, 400);
  assert.equal((await request("/presencas", "POST", ct, { ...chamada, turmaId: outraTurma.id })).status, 403);
  assert.equal((await request("/presencas", "POST", ct, { ...chamada, alunoId: 2147483647 })).status, 404);
  const criada = await request("/presencas", "POST", ct, chamada);
  assert.equal(criada.status, 201);
  assert.equal(criada.data.registradoPorCuidadorId, cuidador.id);
  assert.equal(criada.data.data, "2026-11-23T00:00:00.000Z");
  const simultaneas = await Promise.all([1, 2].map(() => request("/presencas", "POST", ct, { ...chamada, data: "2026-11-24" })));
  assert.deepEqual(simultaneas.map(r => r.status).sort(), [201, 409]);
  assert.equal((await request(`/presencas/${criada.data.id}`, "PUT", ct, { status: "falta_justificada", observacao: "Atestado" })).status, 200);
  const lista = await request(`/presencas?turmaId=${turma.id}&data=2026-11-23`, "GET", ct);
  assert.equal(lista.data.registros.length, 1);
  assert.equal((await request("/presencas?pagina=0", "GET", ct)).status, 400);
  assert.equal((await request("/presencas/abc", "GET", ct)).status, 400);
  assert.equal((await request("/presencas/2147483647", "GET", ct)).status, 404);
  await prisma.aluno.update({ where: { id: aluno.id }, data: { turmaId: outraTurma.id } });
  assert.equal((await request("/presencas", "POST", ct, { ...chamada, data: "2026-11-25" })).status, 409);
  assert.equal((await request(`/presencas/${criada.data.id}`, "PUT", ct, { status: "presente" })).status, 200);
  await prisma.turmaCuidador.delete({ where: { turmaId_cuidadorId: { turmaId: turma.id, cuidadorId: cuidador.id } } });
  assert.equal((await request(`/presencas/${criada.data.id}`, "GET", ct)).status, 403);
  assert.equal((await request("/presencas", "GET", ct)).data.registros.length, 0);
  const ponto = { cuidadorId: cuidador.id, data: "2026-11-23", status: "presente", entrada: "2026-11-23T08:00:00-03:00", saida: "2026-11-23T17:00:00-03:00" };
  assert.equal((await request("/presencas-cuidadores", "POST", at, { ...ponto, saida: "2026-11-23T07:00:00-03:00" })).status, 400);
  assert.equal((await request("/presencas-cuidadores", "POST", at, { ...ponto, status: "falta" })).status, 400);
  const pontoCriado = await request("/presencas-cuidadores", "POST", at, ponto);
  assert.equal(pontoCriado.status, 201);
  assert.equal(pontoCriado.data.registradoPorAdminId, admin.id);
  assert.equal((await request("/presencas-cuidadores", "POST", at, ponto)).status, 409);
  const corrigido = await request(`/presencas-cuidadores/${pontoCriado.data.id}`, "PUT", at, { status: "falta_justificada" });
  assert.equal(corrigido.status, 200);
  assert.equal(corrigido.data.entrada, null);
  assert.equal(corrigido.data.saida, null);
  assert.equal((await request(`/presencas-cuidadores?cuidadorId=${cuidador.id}`, "GET", at)).data.registros.length, 1);
  assert.equal((await request(`/presencas-cuidadores/${pontoCriado.data.id}`, "GET", at)).status, 200);
  await assert.rejects(prisma.$executeRaw`UPDATE presenca SET status = 'invalido' WHERE id = ${criada.data.id}`);
  await assert.rejects(prisma.$executeRaw`UPDATE presenca_cuidador SET status = 'falta', entrada = NOW() WHERE id = ${pontoCriado.data.id}`);
  await prisma.cuidador.update({ where: { id: cuidador.id }, data: { ativo: false } });
  assert.equal((await request("/presencas", "GET", ct)).status, 401);
  assert.equal((await request("/presencas-cuidadores", "POST", at, { ...ponto, data: "2026-11-24" })).status, 409);
  assert.equal((await request("/login", "POST", undefined, { email: cuidador.email, senha })).status, 401);
  assert.equal((await request("/logout", "POST", at)).status, 204);
  assert.equal((await request("/presencas-cuidadores", "GET", at)).status, 401);
  const docs = await fetch(`${base}/docs/`);
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /swagger/i);
});
