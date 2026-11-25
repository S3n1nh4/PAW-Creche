import { test } from "node:test";
import assert from "node:assert/strict";
import { presencaSchema, atualizarPresencaSchema, filtroPresencaSchema } from "@creche/shared/presenca";
import { presencaCuidadorSchema, atualizarPresencaCuidadorSchema } from "@creche/shared/presencaCuidador";
import { validarHorarios } from "../src/services/presencaCuidadorService.js";
import { dataCivil, persistir, PresencaError } from "../src/services/presencaErrors.js";
import { buscarSessao, criarSessao, encerrarSessao } from "../src/services/sessaoService.js";

const chamada = { alunoId: 1, turmaId: 2, data: "2026-11-23", status: "presente" };
test("chamada rejeita data impossível, status inválido e autor fornecido pelo cliente", () => {
  assert.ok(presencaSchema.safeParse(chamada).success);
  for (const mudanca of [{ data: "2026-02-30" }, { status: "atrasado" }, { registradoPorCuidadorId: 3 }, { alunoId: -1 }]) {
    assert.equal(presencaSchema.safeParse({ ...chamada, ...mudanca }).success, false);
  }
  assert.equal(atualizarPresencaSchema.safeParse({ status: "falta", alunoId: 2 }).success, false);
  assert.equal(dataCivil(chamada.data).toISOString(), "2026-11-23T00:00:00.000Z");
});
test("filtros validam paginação, IDs e parâmetros desconhecidos", () => {
  assert.equal(filtroPresencaSchema.parse({ turmaId: "2" }).turmaId, 2);
  for (const filtro of [{ pagina: 0 }, { limite: 101 }, { alunoId: "abc" }, { desconhecido: "1" }]) {
    assert.equal(filtroPresencaSchema.safeParse(filtro).success, false);
  }
});
test("ponto valida formatos, ordem dos instantes e ausência de horários em faltas", () => {
  const parse = (dados: object) => atualizarPresencaCuidadorSchema.parse(dados);
  assert.throws(() => validarHorarios(parse({ status: "presente", saida: "2026-11-23T12:00:00-03:00" })), PresencaError);
  assert.throws(() => validarHorarios(parse({ status: "presente", entrada: "2026-11-23T12:00:00Z", saida: "2026-11-23T08:00:00Z" })), PresencaError);
  assert.throws(() => validarHorarios(parse({ status: "falta", entrada: "2026-11-23T08:00:00Z" })), PresencaError);
  assert.equal(presencaCuidadorSchema.safeParse({ cuidadorId: 1, data: "2026-11-23", status: "presente", entrada: "08:00" }).success, false);
  assert.doesNotThrow(() => validarHorarios(parse({ status: "presente", entrada: "2026-11-23T23:00:00-03:00", saida: "2026-11-24T04:00:00Z" })));
  assert.deepEqual(validarHorarios(parse({ status: "falta_justificada" })), { entrada: null, saida: null });
});
test("erros Prisma viram códigos HTTP apropriados sem esconder falhas desconhecidas", async () => {
  for (const [code, status] of [["P2002", 409], ["P2025", 404], ["P2003", 409]] as const) {
    await assert.rejects(persistir(async () => { throw { code }; }), (e: unknown) => e instanceof PresencaError && e.status === status);
  }
  const falha = new Error("Falha inesperada");
  await assert.rejects(persistir(async () => { throw falha; }), (e) => e === falha);
});
test("sessão autentica, rejeita token inventado, expira e pode ser encerrada", (t) => {
  const usuario = { id: 1, tipoUsuario: "ADMIN" as const };
  const sessao = criarSessao(usuario);
  assert.deepEqual(buscarSessao(sessao.token), usuario);
  assert.equal(buscarSessao("inventado"), null);
  encerrarSessao(sessao.token);
  assert.equal(buscarSessao(sessao.token), null);
  const outra = criarSessao(usuario);
  const futuro = Date.now() + 8 * 60 * 60 * 1000 + 1000;
  t.mock.method(Date, "now", () => futuro);
  assert.equal(buscarSessao(outra.token), null);
});
