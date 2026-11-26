import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import bcrypt from "bcryptjs";

const url = process.env.CONTAS_TEST_DATABASE_URL;
test("build executa como JavaScript, autentica e rejeita configuração inválida", { skip: !url }, async () => {
  if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Use um banco descartável _test");
  process.env.DATABASE_URL = url;
  const { prisma } = await import("../src/config/prisma.js");
  const senha = "SenhaBuild123!";
  const usuario = await prisma.admin.create({ data: { nome: "Teste build", email: `build-${Date.now()}@example.invalid`, senhaHash: await bcrypt.hash(senha, 4) } });
  const reserva = createServer(); reserva.listen(0, "127.0.0.1"); await once(reserva, "listening");
  const endereco = reserva.address(); if (!endereco || typeof endereco === "string") throw new Error("Porta inválida");
  await new Promise<void>(r => reserva.close(() => r()));
  const filho = spawn(process.execPath, ["dist/server.js"], { env: { ...process.env, DATABASE_URL: url, PORT: String(endereco.port) }, stdio: ["ignore", "pipe", "pipe"] });
  try {
    await new Promise<void>((resolve, reject) => {
      const tempo = setTimeout(() => reject(new Error("Build não iniciou em 10s")), 10000);
      filho.stdout.on("data", b => { if (String(b).includes("API subiu")) { clearTimeout(tempo); resolve(); } });
      filho.once("error", e => { clearTimeout(tempo); reject(e); });
      filho.once("exit", code => { clearTimeout(tempo); if (code !== null) reject(new Error(`Build encerrou: ${code}`)); });
    });
    const resposta = await fetch(`http://127.0.0.1:${endereco.port}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: usuario.email, senha }) });
    assert.equal(resposta.status, 200);
    assert.equal((await resposta.json()).tipoUsuario, "ADMIN");
    const invalido = spawn(process.execPath, ["dist/server.js"], { env: { ...process.env, DATABASE_URL: "", PORT: "abc" }, stdio: ["ignore", "ignore", "pipe"] });
    assert.equal((await once(invalido, "exit"))[0], 1);
  } finally {
    if (filho.exitCode === null) { filho.kill(); await once(filho, "exit"); }
    await prisma.admin.delete({ where: { id: usuario.id } });
    await prisma.conta.delete({ where: { id: usuario.contaId! } });
    await prisma.$disconnect();
  }
});
