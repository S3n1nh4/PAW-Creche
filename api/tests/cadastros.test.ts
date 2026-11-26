import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import * as admins from "../src/services/adminService.js";
import * as cuidadores from "../src/services/cuidadorService.js";
import { app } from "../src/app.js";
import { criarSessao, encerrarSessao } from "../src/services/sessaoService.js";
import { Prisma } from "../src/generated/prisma/client.js";

test("cadastros ocultam hashes, atualizam senhas e exigem administrador; buscas de turma funcionam", async (t) => {
  function stub(target: object, nome: string, implementacao: (...args: any[]) => any) {
    const original = Reflect.get(target, nome);
    Reflect.set(target, nome, implementacao);
    t.after(() => { Reflect.set(target, nome, original); });
  }
  const senhaHash = await bcrypt.hash("Anterior123", 4);
  const admin = { id: 1, nome: "Admin teste", email: "admin@example.invalid", senhaHash, ativo: true, criadoEm: new Date() };
  const cuidador = { ...admin, id: 2, email: "cuidador@example.invalid", telefone: "11999999999", dataAdmissao: new Date(), salarioBase: new Prisma.Decimal(1000) };
  // Repositórios reais e serviços reais, com as consultas Prisma substituídas.
  for (const [delegate, registro] of [[prisma.admin, admin], [prisma.cuidador, cuidador]] as const) {
    stub(delegate, "findMany", async () => [registro]);
    stub(delegate, "findUnique", async () => registro);
    stub(delegate, "findFirst", async () => registro);
    stub(delegate, "update", async ({ data }: { data: Record<string, unknown> }) => {
      assert.equal("senha" in data, false);
      Object.assign(registro, data);
      return registro;
    });
    stub(delegate, "create", async ({ data }: { data: Record<string, unknown> }) => ({ ...registro, ...data }));
    stub(delegate, "delete", async () => registro);
  }
  function semHash(valor: object) { assert.equal("senhaHash" in valor, false); }
  for (const service of [
    { listar: admins.buscarAdmins, buscar: admins.buscarAdminPorId, email: admins.buscarPorEmail },
    { listar: cuidadores.buscarCuidadores, buscar: cuidadores.buscarCuidadorPorId, email: cuidadores.buscarCuidadorPorEmail },
  ]) {
    (await service.listar()).forEach(semHash);
    semHash((await service.buscar(1))!);
    semHash((await service.email("teste@example.invalid"))!);
  }
  semHash(await admins.atualizarAdmin(1, { nome: admin.nome, email: admin.email, senha: "NovaSenha123" }));
  semHash(await cuidadores.atualizarCuidador(2, { nome: cuidador.nome, email: cuidador.email, telefone: cuidador.telefone, salarioBase: 1000, ativo: true, senha: "NovaSenha123" }));
  assert.ok(await bcrypt.compare("NovaSenha123", admin.senhaHash));
  assert.ok(await bcrypt.compare("NovaSenha123", cuidador.senhaHash));
  const hashAtual = cuidador.senhaHash;
  await cuidadores.atualizarCuidador(2, { nome: cuidador.nome, email: cuidador.email, telefone: cuidador.telefone, salarioBase: 1200, ativo: true });
  assert.equal(cuidador.senhaHash, hashAtual);
  semHash(await admins.desativarAdmin(1));
  admin.ativo = true;
  // Criação sem email duplicado.
  stub(prisma.admin, "findFirst", async () => null);
  stub(prisma.cuidador, "findFirst", async () => null);
  semHash(await admins.criarAdmin({ nome: "Novo Admin", email: "novo@example.invalid", senha: "NovaSenha123" }));
  semHash(await cuidadores.criarCuidador({ nome: "Novo Cuidador", email: "novo-cuidador@example.invalid", telefone: "11999999999", salarioBase: 1000, ativo: true, senha: "NovaSenha123" }));
  semHash(await admins.deletarAdmin(1));
  semHash(await cuidadores.deletarCuidador(2));

  stub(prisma.turma, "findUnique", async () => null);
  stub(prisma.turma, "findFirst", async ({ where }: { where: { nome: string } }) =>
    where.nome === "Maternal" ? { id: 1, nome: "Maternal", anoLetivo: 2026, turno: "integral", ativo: true, criadoEm: new Date() } : null);
  admin.ativo = true;
  cuidador.ativo = true;
  stub(prisma.conta, "findUnique", async ({ where }: { where: { id: number } }) => ({
    id: where.id, perfil: where.id === 1 ? "ADMIN" : "CUIDADOR", ativo: true, versaoSessao: 1,
    admin: where.id === 1 ? admin : null, cuidador: where.id === 2 ? cuidador : null,
  }));
  const sessaoAdmin = criarSessao({ id: 1, tipoUsuario: "ADMIN", contaId: 1, versaoSessao: 1 });
  const sessaoCuidador = criarSessao({ id: 2, tipoUsuario: "CUIDADOR", contaId: 2, versaoSessao: 1 });
  const server = app.listen(0, "127.0.0.1");
  t.after(async () => {
    encerrarSessao(sessaoAdmin.token);
    encerrarSessao(sessaoCuidador.token);
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  });
  await once(server, "listening");
  const endereco = server.address();
  if (!endereco || typeof endereco === "string") throw new Error("Endereço inválido");
  const porta = endereco.port;
  async function request(path: string, token?: string, method = "GET") {
    return fetch(`http://127.0.0.1:${porta}${path}`, {
      method, headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(5000),
    });
  }
  for (const rota of ["/admins", "/cuidadores"]) {
    for (const metodo of ["GET", "POST", "PUT", "DELETE"]) {
      const path = metodo === "PUT" || metodo === "DELETE" ? `${rota}/1` : rota;
      assert.equal((await request(path, undefined, metodo)).status, 401);
      assert.equal((await request(path, sessaoCuidador.token, metodo)).status, 403);
    }
    const resposta = await request(rota, sessaoAdmin.token);
    assert.equal(resposta.status, 200);
    (await resposta.json()).forEach(semHash);
  }
  const turma = await request("/turmas/nome/Maternal", sessaoAdmin.token);
  assert.equal(turma.status, 200);
  assert.equal((await turma.json()).nome, "Maternal");
  assert.equal((await request("/turmas/nome/Inexistente", sessaoAdmin.token)).status, 404);
  assert.equal((await request("/turmas/999", sessaoAdmin.token)).status, 404);
});

