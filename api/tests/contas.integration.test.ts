import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";

// Nunca utiliza o DATABASE_URL normal por engano.
const url = process.env.CONTAS_TEST_DATABASE_URL;
test("Conta única exata, troca de perfil e invalidação de sessões", { skip: !url }, async (t) => {
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
  const login = (email: string, password = senha) => request("/login", "POST", undefined, { email, senha: password });
  const root = await login(admin.email);
  const at = root.data.token;
  const contaId = (await prisma.cuidador.findUniqueOrThrow({ where: { id: cuidador.id } })).contaId!;
  const antes = await login(cuidador.email);
  assert.equal(antes.data.tipoUsuario, "CUIDADOR");
  assert.equal(antes.data.contaId, contaId);
  assert.equal((await login(cuidador.email.toUpperCase())).status, 401);
  assert.equal((await login(` ${cuidador.email} `)).status, 401);
  // A exclusividade vale entre perfis e em chamadas concorrentes.
  assert.equal((await request("/admins", "POST", at, { nome: marcador, email: cuidador.email, senha })).status, 409);
  const corpoCuidador = { nome: marcador, email: `${marcador}-concorrente@example.invalid`, telefone: "11999999999", salarioBase: 1000, ativo: true, senha };
  const resultados = await Promise.all([
    request("/admins", "POST", at, { nome: marcador, email: corpoCuidador.email, senha }),
    request("/cuidadores", "POST", at, corpoCuidador),
  ]);
  assert.deepEqual(resultados.map(r => r.status).sort(), [201,409]);
  if (resultados[0]!.status === 201) admins.push(resultados[0]!.data.id);
  if (resultados[1]!.status === 201) cuidadores.push(resultados[1]!.data.id);
  await assert.rejects(prisma.cuidador.create({ data: { nome: marcador, email: admin.email, senhaHash } }));
  assert.equal((await request(`/cuidadores/${cuidador.id}`, "PUT", at, { ...corpoCuidador, email: admin.email })).status, 409);
  // Caixa e espaços distinguem contas de fato, não apenas durante a validação.
  for (const email of [cuidador.email.toUpperCase(), ` ${cuidador.email} `]) {
    const nova = await request("/admins", "POST", at, { nome: marcador, email, senha });
    assert.equal(nova.status, 201); admins.push(nova.data.id);
    const autenticada = await login(email);
    assert.equal(autenticada.status, 200);
    assert.equal(autenticada.data.email, email);
    assert.equal(autenticada.data.tipoUsuario, "ADMIN");
  }
  const chamada = await request("/presencas", "POST", antes.data.token, { alunoId: aluno.id, turmaId: turma.id, data: "2026-11-25", status: "presente" });
  assert.equal(chamada.status, 201);
  const novaSenha = "SenhaAtualizada123!";
  assert.equal((await request(`/cuidadores/${cuidador.id}`, "PUT", at, { ...corpoCuidador, email: cuidador.email, senha: novaSenha })).status, 200);
  assert.equal((await request("/presencas", "GET", antes.data.token)).status, 401);
  assert.equal((await login(cuidador.email)).status, 401);
  const atualizado = await login(cuidador.email, novaSenha);
  assert.equal(atualizado.status, 200);
  const rota = `/contas/${contaId}/perfil`;
  assert.equal((await request(rota, "PUT", atualizado.data.token, { perfil: "ADMIN" })).status, 403);
  assert.equal((await request(rota, "PUT", at, { perfil: "OUTRO" })).status, 400);
  const promovido = await request(rota, "PUT", at, { perfil: "ADMIN" });
  assert.equal(promovido.status, 200);
  assert.equal(promovido.data.id, contaId);
  assert.equal(promovido.data.senhaHash, undefined);
  assert.equal((await request("/presencas", "GET", atualizado.data.token)).status, 401);
  const adminNovo = await login(cuidador.email, novaSenha);
  assert.equal(adminNovo.data.tipoUsuario, "ADMIN");
  assert.equal(adminNovo.data.contaId, contaId);
  admins.push(adminNovo.data.id);
  assert.equal((await request("/admins", "GET", adminNovo.data.token)).status, 200);
  assert.equal((await prisma.cuidador.findUniqueOrThrow({ where: { id: cuidador.id } })).ativo, false);
  assert.equal(await prisma.presenca.count({ where: { id: chamada.data.id } }), 1);
  assert.equal((await request(rota, "PUT", at, { perfil: "CUIDADOR" })).status, 200);
  assert.equal((await request("/admins", "GET", adminNovo.data.token)).status, 401);
  const voltou = await login(cuidador.email, novaSenha);
  assert.equal(voltou.data.id, cuidador.id);
  assert.equal(voltou.data.contaId, contaId);
  assert.equal(voltou.data.tipoUsuario, "CUIDADOR");
  assert.equal((await request(`/presencas/${chamada.data.id}`, "GET", voltou.data.token)).status, 200);
  assert.equal((await request("/contas/2147483647/perfil", "PUT", at, { perfil: "ADMIN" })).status, 404);
  assert.equal((await request(`/admins/${admin.id}`, "PUT", at, { nome: admin.nome, email: admin.email, senha: novaSenha })).status, 200);
  assert.equal((await request("/admins", "GET", at)).status, 401);
  assert.equal((await login(admin.email, novaSenha)).status, 200);
});
