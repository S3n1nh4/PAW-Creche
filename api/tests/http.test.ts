import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { app } from "../src/app.js";
import { validarAmbiente } from "../src/config/ambiente.js";
import { criarLimitadorLogin } from "../src/middlewares/limitarLogin.js";
import { emailSchema } from "@creche/shared/email";

test("configuração rejeita URL ausente e porta inválida sem expor credenciais", () => {
  assert.throws(() => validarAmbiente({}));
  for (const PORT of ["abc", "0", "65536", "1.5"]) assert.throws(() => validarAmbiente({ DATABASE_URL: "postgresql://user:senha@localhost/db", PORT }));
  assert.equal(validarAmbiente({ DATABASE_URL: "postgresql://user:senha@localhost/db" }).PORT, 3000);
});
test("email mantém maiúsculas e espaços externos", () => {
  const valor = " Ana@example.com ";
  assert.equal(emailSchema.parse(valor), valor);
});
test("404 é JSON, excesso de corpo é 413 e login possui limite", async () => {
  const limitador = express();
  limitador.post("/login", criarLimitadorLogin(2), (_req, res) => res.sendStatus(200));
  const servidores = [app.listen(0, "127.0.0.1"), limitador.listen(0, "127.0.0.1")];
  try {
    for (const s of servidores) if (!s.listening) await once(s, "listening");
    const urls = servidores.map(s => { const a = s.address(); if (!a || typeof a === "string") throw new Error("Porta inválida"); return `http://127.0.0.1:${a.port}`; });
    const desconhecida = await fetch(`${urls[0]}/nao-existe`);
    assert.equal(desconhecida.status, 404);
    assert.match(desconhecida.headers.get("content-type")!, /application\/json/);
    const grande = await fetch(`${urls[0]}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: "a".repeat(120000) }) });
    assert.equal(grande.status, 413);
    for (const esperado of [200,200,429]) assert.equal((await fetch(`${urls[1]}/login`, { method: "POST" })).status, esperado);
  } finally {
    await Promise.all(servidores.map(s => { s.closeAllConnections(); return new Promise<void>(r => s.close(() => r())); }));
  }
});
