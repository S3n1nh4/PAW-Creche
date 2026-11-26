import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";

// Nunca utiliza o DATABASE_URL normal por engano.
const url = process.env.EMAILS_TEST_DATABASE_URL;
test("Emails únicos, turmas e desativação de administradores com PostgreSQL real", { skip: !url }, async (t) => {
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
  const at = (await request("/login", "POST", undefined, { email: admin.email, senha })).data.token;
  assert.equal(typeof at, "string");
  const dadosAdmin = { nome: "Administrador novo", email: `  ${marcador.toUpperCase()}-NOVO@example.invalid  `, senha };
  const criadoAdmin = await request("/admins", "POST", at, dadosAdmin);
  assert.equal(criadoAdmin.status, 201);
  admins.push(criadoAdmin.data.id);
  assert.equal(criadoAdmin.data.email, dadosAdmin.email);
  assert.equal(criadoAdmin.data.senhaHash, undefined);
  assert.equal((await request("/admins", "POST", at, { ...dadosAdmin, email: criadoAdmin.data.email })).status, 409);
  assert.equal((await request(`/admins/${criadoAdmin.data.id}`, "PUT", at, { nome: dadosAdmin.nome, email: admin.email })).status, 409);
  assert.equal((await request(`/admins/${criadoAdmin.data.id}`, "PUT", at, { nome: dadosAdmin.nome, email: criadoAdmin.data.email })).status, 200);
  const dadosCuidador = { nome: "Cuidador novo", email: ` ${marcador.toUpperCase()}-NOVOC@example.invalid `,
    telefone: "11999999999", salarioBase: 1000, ativo: true, senha };
  const criadoCuidador = await request("/cuidadores", "POST", at, dadosCuidador);
  assert.equal(criadoCuidador.status, 201);
  cuidadores.push(criadoCuidador.data.id);
  assert.equal(criadoCuidador.data.email, dadosCuidador.email);
  assert.equal((await request("/login", "POST", undefined, { email: criadoCuidador.data.email, senha })).status, 200);
  assert.equal((await request("/cuidadores", "POST", at, { ...dadosCuidador, email: criadoCuidador.data.email })).status, 409);
  assert.equal((await request(`/cuidadores/${criadoCuidador.data.id}`, "PUT", at, { ...dadosCuidador, email: cuidador.email })).status, 409);
  assert.equal((await request(`/cuidadores/${criadoCuidador.data.id}`, "PUT", at, dadosCuidador)).status, 200);
  // O banco protege também INSERT e UPDATE diretos, sem passar pelos services.
  await assert.rejects(prisma.admin.create({ data: { nome: "Duplicado", email: admin.email, senhaHash } }));
  await assert.rejects(prisma.cuidador.update({ where: { id: criadoCuidador.data.id }, data: { email: cuidador.email } }));
  const concorrentes = await Promise.all([1,2].map(() => request("/admins", "POST", at, { ...dadosAdmin, email: `${marcador}-concorrente@example.invalid` })));
  assert.deepEqual(concorrentes.map(r => r.status).sort(), [201,409]);
  admins.push(concorrentes.find(r => r.status === 201)!.data.id);
  for (const rota of ["/admins", "/cuidadores"]) {
    const corpo = rota === "/admins" ? { nome: dadosAdmin.nome, email: "ausente@example.invalid" } : dadosCuidador;
    assert.equal((await request(`${rota}/2147483647`, "GET", at)).status, 404);
    assert.equal((await request(`${rota}/2147483647`, "PUT", at, corpo)).status, 404);
    assert.equal((await request(`${rota}/2147483647`, "DELETE", at)).status, 404);
    assert.equal((await request(`${rota}/email/ausente@example.invalid`, "GET", at)).status, 404);
    assert.equal((await request(`${rota}/abc`, "GET", at)).status, 400);
    assert.equal((await request(`${rota}/email/invalido`, "GET", at)).status, 400);
  }
  assert.equal((await request(`/admins/email/${encodeURIComponent(dadosAdmin.email)}`, "GET", at)).data.id, criadoAdmin.data.id);
  assert.equal((await request(`/cuidadores/email/${encodeURIComponent(dadosCuidador.email)}`, "GET", at)).data.id, criadoCuidador.data.id);

  const dadosTurma = { nome: `${marcador}-repetido`, anoLetivo: 2026, turno: "manha", ativo: true };
  const primeira = await request("/turmas", "POST", at, dadosTurma);
  assert.equal(primeira.status, 201); turmas.push(primeira.data.id);
  const outroAno = await request("/turmas", "POST", at, { ...dadosTurma, anoLetivo: 2027 });
  assert.equal(outroAno.status, 201); turmas.push(outroAno.data.id);
  const outroTurno = await request("/turmas", "POST", at, { ...dadosTurma, turno: "tarde" });
  assert.equal(outroTurno.status, 201); turmas.push(outroTurno.data.id);
  assert.equal((await request("/turmas", "POST", at, dadosTurma)).status, 409);
  assert.equal((await request(`/turmas/${outroAno.data.id}`, "PUT", at, dadosTurma)).status, 409);
  assert.equal((await request(`/turmas/${primeira.data.id}`, "PUT", at, dadosTurma)).status, 200);

  // DELETE preserva o administrador, seus pontos e impede uso de sua sessão.
  const loginNovo = await request("/login", "POST", undefined, { email: criadoAdmin.data.email, senha });
  const ponto = await prisma.presencaCuidador.create({ data: { cuidadorId: cuidador.id, data: new Date("2026-11-25"), status: "presente", registradoPorAdminId: criadoAdmin.data.id } });
  assert.equal((await request(`/admins/${criadoAdmin.data.id}`, "DELETE", at)).status, 204);
  assert.equal((await prisma.admin.findUniqueOrThrow({ where: { id: criadoAdmin.data.id } })).ativo, false);
  assert.equal(await prisma.presencaCuidador.count({ where: { id: ponto.id } }), 1);
  assert.equal((await request("/login", "POST", undefined, { email: criadoAdmin.data.email, senha })).status, 401);
  assert.equal((await request("/admins", "GET", loginNovo.data.token)).status, 401);
});
