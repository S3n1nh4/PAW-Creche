import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { presencaSchema, atualizarPresencaSchema, filtroPresencaSchema, idPresencaSchema } from "@creche/shared/presenca";
import { presencaCuidadorSchema, atualizarPresencaCuidadorSchema, filtroPresencaCuidadorSchema } from "@creche/shared/presencaCuidador";

export function registrarPresencas(registry: OpenAPIRegistry) {
  registry.registerComponent("securitySchemes", "bearerAuth", { type: "http", scheme: "bearer" });
  const json = (schema: z.ZodType) => ({ content: { "application/json": { schema } } });
  for (const config of [
    { path: "/presencas", tag: "Presenças dos alunos (CUIDADOR)", input: presencaSchema,
      update: atualizarPresencaSchema, query: filtroPresencaSchema,
      response: presencaSchema.extend({ id: z.number(), data: z.iso.datetime(), registradoPorCuidadorId: z.number(), criadoEm: z.iso.datetime() }) },
    { path: "/presencas-cuidadores", tag: "Ponto dos cuidadores (ADMIN)", input: presencaCuidadorSchema,
      update: atualizarPresencaCuidadorSchema, query: filtroPresencaCuidadorSchema,
      response: presencaCuidadorSchema.extend({ id: z.number(), data: z.iso.datetime(), registradoPorAdminId: z.number(), criadoEm: z.iso.datetime() }) },
  ]) {
    const base = { tags: [config.tag], security: [{ bearerAuth: [] }] };
    const erros = {
      400: { description: "Dados, filtros ou horários inválidos" },
      401: { description: "Token ausente, expirado ou conta desativada" },
      403: { description: "Perfil ou vínculo com turma sem permissão" },
      404: { description: "Registro ou cadastro não encontrado" },
      409: { description: "Duplicidade ou cadastro incompatível/desativado" },
      500: { description: "Falha interna" },
    };
    registry.registerPath({ ...base, method: "get", path: config.path,
      summary: "Lista registros com filtros e paginação", request: { query: config.query },
      responses: { ...erros, 200: { description: "Página retornada", ...json(z.object({ registros: z.array(config.response), pagina: z.number(), limite: z.number() })) } } });
    registry.registerPath({ ...base, method: "get", path: `${config.path}/{id}`,
      summary: "Consulta registro por ID", request: { params: z.object({ id: idPresencaSchema }) },
      responses: { ...erros, 200: { description: "Registro encontrado", ...json(config.response) } } });
    registry.registerPath({ ...base, method: "post", path: config.path,
      summary: "Cria registro; autor obtido da sessão", request: { body: json(config.input) },
      responses: { ...erros, 201: { description: "Registro criado", ...json(config.response) } } });
    registry.registerPath({ ...base, method: "put", path: `${config.path}/{id}`,
      summary: "Corrige situação e observação; no ponto, substitui também os horários",
      request: { params: z.object({ id: idPresencaSchema }), body: json(config.update) },
      responses: { ...erros, 200: { description: "Registro corrigido", ...json(config.response) } } });
  }
  registry.registerPath({ method: "delete", path: "/presencas-cuidadores/{id}",
    tags: ["Ponto dos cuidadores (ADMIN)"], security: [{ bearerAuth: [] }],
    summary: "Exclui definitivamente um ponto incorreto (somente ADMIN)",
    request: { params: z.object({ id: idPresencaSchema }) },
    responses: { 204: { description: "Ponto excluído" }, 401: { description: "Não autenticado" },
      403: { description: "Perfil indevido" }, 404: { description: "Ponto inexistente" } } });
  registry.registerPath({ method: "post", path: "/logout", tags: ["Autenticação"],
    summary: "Encerra a sessão Bearer atual", security: [{ bearerAuth: [] }],
    responses: { 204: { description: "Sessão encerrada (operação idempotente)" } } });
}
