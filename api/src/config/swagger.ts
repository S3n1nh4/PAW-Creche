
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";

import { z, type ZodType } from "zod";

import { adminSchema, cadastroAdminSchema, atualizarAdminSchema } from "@creche/shared/admin";
import { alunoSchema, cadastroAlunoSchema, atualizarAlunoSchema } from "@creche/shared/aluno";
import { cuidadorSchema, cadastroCuidadorSchema, atualizarCuidadorSchema } from "@creche/shared/cuidador";
import { turmaSchema } from "@creche/shared/turma";
import { atividadeSchema } from '@creche/shared/atividade';
import { comportamentoSchema } from "@creche/shared/comportamento";
import { turmaCuidadorSchema } from "@creche/shared/turmaCuidador";
import { loginSchema } from "@creche/shared/auth";
import { registrarPresencas } from "./presencaSwagger.js";
import { alterarPerfilSchema } from "@creche/shared/conta";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// -------------------------------------------------------------
// 1. Helpers reutilizáveis
// -------------------------------------------------------------

const idParam = z.object({
  id: z.coerce.number().openapi({
    example: 1,
    description: "ID numérico",
  }),
});

const jsonBody = (schema: ZodType) => ({
  content: {
    "application/json": {
      schema,
    },
  },
});

const jsonResponse = (description: string, schema?: ZodType) => ({
  description,
  ...(schema ? jsonBody(schema) : {}),
});

// Registra os endpoints comuns de um CRUD

function registrarCrud({
  tag,
  path,
  nomeModelo,
  schema,
  schemaCadastro = schema,
  schemaAtualizacao = schema,
}: {
  tag: string;
  path: string;
  nomeModelo: string;
  schema: ZodType;
  schemaCadastro?: ZodType;
  schemaAtualizacao?: ZodType;
}) {
  const model = registry.register(
    nomeModelo,
    (schema as any).extend({
      id: z.number().openapi({ example: 1 }),
    })
  );

  // GET - Listar
  registry.registerPath({
    method: "get",
    path,
    summary: `Lista ${tag.toLowerCase()}`,
    tags: [tag],
    security: [{ bearerAuth: [] }],
    responses: {
      200: jsonResponse("Lista retornada com sucesso", z.array(model)),
    },
  });

  // GET - Buscar por ID
  registry.registerPath({
    method: "get",
    path: `${path}/{id}`,
    summary: `Busca ${nomeModelo.toLowerCase()} por ID`,
    tags: [tag],
    security: [{ bearerAuth: [] }],
    request: { params: idParam },
    responses: {
      200: jsonResponse("Registro encontrado", model),
      404: jsonResponse("Registro não encontrado"),
    },
  });

  // POST - Cadastro
  registry.registerPath({
    method: "post",
    path,
    summary: `Cadastra ${nomeModelo.toLowerCase()}`,
    tags: [tag],
    security: [{ bearerAuth: [] }],
    request: {
      body: jsonBody(schemaCadastro),
    },
    responses: {
      201: jsonResponse("Registro cadastrado com sucesso", model),
      400: jsonResponse("Erro de validação"),
    },
  });

  // PUT - Atualização
  registry.registerPath({
    method: "put",
    path: `${path}/{id}`,
    summary: `Atualiza ${nomeModelo.toLowerCase()}`,
    tags: [tag],
    security: [{ bearerAuth: [] }],
    request: {
      params: idParam,
      body: jsonBody(schemaAtualizacao),
    },
    responses: {
      200: jsonResponse("Registro atualizado com sucesso", model),
      400: jsonResponse("Dados inválidos"),
      404: jsonResponse("Registro não encontrado"),
    },
  });

  // DELETE - Remover
  registry.registerPath({
    method: "delete",
    path: `${path}/{id}`,
    summary: ["/admins", "/alunos", "/turmas", "/cuidadores"].includes(path) ? `Desativa ${nomeModelo.toLowerCase()} e preserva o histórico` : `Remove ${nomeModelo.toLowerCase()}`,
    tags: [tag],
    security: [{ bearerAuth: [] }],
    request: { params: idParam },
    responses: {
      204: jsonResponse("Registro removido com sucesso"),
      404: jsonResponse("Registro não encontrado"),
    },
  });

  return model;
}


// -------------------------------------------------------------
// 2. Registro dos CRUDs
// -------------------------------------------------------------

const adminModel = registrarCrud({
  tag: "Administradores",
  path: "/admins",
  nomeModelo: "Admin",
  schema: adminSchema,
  schemaCadastro: cadastroAdminSchema,
  schemaAtualizacao: atualizarAdminSchema,
});

const alunoModel = registrarCrud({
  tag: "Alunos",
  path: "/alunos",
  nomeModelo: "Aluno",
  schema: alunoSchema,
  schemaCadastro: cadastroAlunoSchema,
  schemaAtualizacao: atualizarAlunoSchema,
});

const cuidadorModel = registrarCrud({
  tag: "Cuidadores",
  path: "/cuidadores",
  nomeModelo: "Cuidador",
  schema: cuidadorSchema,
  schemaCadastro: cadastroCuidadorSchema,
  schemaAtualizacao: atualizarCuidadorSchema,
});

const turmaModel = registrarCrud({
  tag: "Turmas",
  path: "/turmas",
  nomeModelo: "Turma",
  schema: turmaSchema,
});

const comportamentoModel = registrarCrud({
  tag: "Comportamentos",
  path: "/comportamentos",
  nomeModelo: "Comportamento",
  schema: comportamentoSchema,
  schemaCadastro: comportamentoSchema.omit({ cuidadorId: true }),
  schemaAtualizacao: comportamentoSchema.omit({ cuidadorId: true }),
});

// -------------------------------------------------------------
// 3. Rotas específicas de Administradores
// -------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/admins/email/{email}",
  summary: "Busca administrador por e-mail",
  tags: ["Administradores"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      email: z.string().email(),
    }),
  },
  responses: {
    200: jsonResponse("Administrador encontrado", adminModel),
    404: jsonResponse("Administrador não encontrado"),
  },
});

registry.registerPath({
  method: "put",
  path: "/admins/desativar/{id}",
  summary: "Desativa um administrador",
  tags: ["Administradores"],
    security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
  },
  responses: {
    200: jsonResponse("Administrador desativado"),
    404: jsonResponse("Administrador não encontrado"),
  },
});

// -------------------------------------------------------------
// 4. Rotas específicas de Cuidadores
// -------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/cuidadores/email/{email}",
  summary: "Busca cuidador por e-mail",
  tags: ["Cuidadores"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      email: z.string().email(),
    }),
  },
  responses: {
    200: jsonResponse("Cuidador encontrado", cuidadorModel),
    404: jsonResponse("Cuidador não encontrado"),
  },
});

// -------------------------------------------------------------
// 5. Rotas específicas de Alunos
// -------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/alunos/turma/{turmaId}",
  summary: "Lista alunos de uma turma",
  tags: ["Alunos"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      turmaId: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    200: jsonResponse("Alunos encontrados", z.array(alunoModel)),
  },
});

registry.registerPath({
  method: "get",
  path: "/alunos/nome/{nome}",
  summary: "Busca alunos pelo nome",
  tags: ["Alunos"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      nome: z.string(),
    }),
  },
  responses: {
    200: jsonResponse("Busca realizada", z.array(alunoModel)),
  },
});

// -------------------------------------------------------------
// 6. Rotas específicas de Turmas
// -------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/turmas/nome/{nome}",
  summary: "Busca turma pelo nome",
  tags: ["Turmas"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      nome: z.string(),
    }),
  },
  responses: {
    200: jsonResponse("Turma encontrada", z.array(turmaModel)),
    404: jsonResponse("Turma não encontrada"),
  },
});

// -------------------------------------------------------------
// 7. Rotas específicas de Comportamentos
// -------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/comportamentos/cuidador/{cuidadorId}",
  summary: "Lista comportamentos registrados por um cuidador",
  tags: ["Comportamentos"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cuidadorId: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    200: jsonResponse("Comportamentos encontrados", z.array(comportamentoModel)),
  },
});

registry.registerPath({
  method: "get",
  path: "/comportamentos/aluno/{alunoId}",
  summary: "Lista comportamentos de um aluno",
  tags: ["Comportamentos"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      alunoId: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    200: jsonResponse("Comportamentos encontrados", z.array(comportamentoModel)),
  },
});

// -------------------------------------------------------------
// 8. Rotas de relacionamento TurmaCuidador
// -------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/turmaCuidador",
  summary: "Lista todos os vínculos entre turmas e cuidadores",
  tags: ["Turma e Cuidador"],
    security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse(
      "Vínculos encontrados",
      z.array(turmaCuidadorSchema)
    ),
  },
});

registry.registerPath({
  method: "get",
  path: "/turmaCuidador/turma/{turmaId}",
  summary: "Lista cuidadores vinculados a uma turma",
  tags: ["Turma e Cuidador"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      turmaId: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    200: jsonResponse("Vínculos encontrados", z.array(turmaCuidadorSchema)),
  },
});

registry.registerPath({
  method: "get",
  path: "/turmaCuidador/cuidador/{cuidadorId}",
  summary: "Lista turmas vinculadas a um cuidador",
  tags: ["Turma e Cuidador"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cuidadorId: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    200: jsonResponse("Vínculos encontrados", z.array(turmaCuidadorSchema)),
  },
});

registry.registerPath({
  method: "post",
  path: "/turmaCuidador/{turmaId}/{cuidadorId}",
  summary: "Vincula um cuidador a uma turma",
  tags: ["Turma e Cuidador"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      turmaId: z.coerce.number().int().positive(),
      cuidadorId: z.coerce.number().int().positive(),
    }),
    body: jsonBody(turmaCuidadorSchema),
  },
  responses: {
    201: jsonResponse("Cuidador vinculado à turma"),
    400: jsonResponse("Dados inválidos"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/turmaCuidador/{turmaId}/{cuidadorId}",
  summary: "Desvincula um cuidador de uma turma",
  tags: ["Turma e Cuidador"],
    security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      turmaId: z.coerce.number().int().positive(),
      cuidadorId: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    204: jsonResponse("Vínculo removido"),
    404: jsonResponse("Vínculo não encontrado"),
  },
});

// -------------------------------------------------------------
// 9. Autenticação
// -------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/login",
  summary: "Realiza login na API",
  tags: ["Autenticação"],
  request: {
    body: jsonBody(loginSchema),
  },
  responses: {
    200: jsonResponse("Login realizado: dados do usuário (sem senha), token, tokenType=Bearer e expiresIn=28800"),
    400: jsonResponse("Erro de validação"),
    401: jsonResponse("E-mail ou senha inválidos"),
  },
});

// -------------------------------------------------------------
// 10. Geração do documento OpenAPI
// -------------------------------------------------------------

registrarPresencas(registry);
registry.registerPath({ method: 'get', path: '/planner/turmas', tags: ['Planner'], security: [{ bearerAuth: [] }],
  summary: 'Lista turmas ativas; cuidador consulta apenas suas turmas', responses: { 200: jsonResponse('Turmas disponíveis') } });
registry.registerPath({ method: 'get', path: '/planner/turmas/{id}/atividades', tags: ['Planner'], security: [{ bearerAuth: [] }],
  summary: 'Consulta a programação semanal da turma', request: { params: idParam },
  responses: { 200: jsonResponse('Atividades com dia útil, início, término e autor'), 403: jsonResponse('Sem vínculo com a turma'), 404: jsonResponse('Turma não encontrada') } });
registry.registerPath({ method: 'post', path: '/planner/turmas/{id}/atividades', tags: ['Planner'], security: [{ bearerAuth: [] }],
  summary: 'Cuidador vinculado registra atividade semanal; autor vem do login', request: { params: idParam, body: jsonBody(atividadeSchema) },
  responses: { 201: jsonResponse('Atividade registrada'), 400: jsonResponse('Dia ou horário inválido para o turno'), 403: jsonResponse('Exige cuidador vinculado'), 409: jsonResponse('Conflito de horário') } });
registry.registerPath({ method: 'delete', path: '/planner/turmas/{id}/atividades/{atividadeId}', tags: ['Planner'], security: [{ bearerAuth: [] }],
  summary: 'Cuidador vinculado exclui uma atividade de sua autoria',
  request: { params: z.object({ id: z.coerce.number().int().positive(), atividadeId: z.coerce.number().int().positive() }) },
  responses: { 204: { description: 'Atividade excluída' }, 403: jsonResponse('Exige cuidador vinculado'), 404: jsonResponse('Atividade não encontrada ou de outro autor') } });
registry.registerPath({ method: "post", path: "/turmas/{id}/alunos/{alunoId}/transferir", tags: ["Turmas"], security: [{ bearerAuth: [] }],
  summary: "Transfere um aluno para outra turma ativa, preservando seu histórico (ADMIN)",
  request: { params: z.object({ id: z.coerce.number().int().positive(), alunoId: z.coerce.number().int().positive() }),
    body: jsonBody(z.object({ destinoId: z.number().int().positive() }).strict()) },
  responses: { 204: { description: "Aluno transferido" }, 400: jsonResponse("Destino inválido"), 403: jsonResponse("Exige administrador"),
    404: jsonResponse("Cadastro não encontrado"), 409: jsonResponse("Aluno fora da turma ou destino inativo") } });
registry.registerPath({ method: "delete", path: "/turmas/{id}/alunos/{alunoId}", tags: ["Turmas"], security: [{ bearerAuth: [] }],
  summary: "Remove apenas o vínculo do aluno com a turma, preservando cadastro e histórico (ADMIN)",
  request: { params: z.object({ id: z.coerce.number().int().positive(), alunoId: z.coerce.number().int().positive() }) },
  responses: { 204: { description: "Aluno sem turma" }, 403: jsonResponse("Exige administrador"),
    404: jsonResponse("Cadastro não encontrado"), 409: jsonResponse("Aluno não está ativo nesta turma") } });
registry.registerPath({ method: "put", path: "/turmas/{id}/alunos/{alunoId}", tags: ["Turmas"], security: [{ bearerAuth: [] }],
  summary: "Adiciona um aluno ativo sem turma a uma turma ativa (ADMIN)",
  request: { params: z.object({ id: z.coerce.number().int().positive(), alunoId: z.coerce.number().int().positive() }) },
  responses: { 204: { description: "Aluno adicionado" }, 400: jsonResponse("IDs inválidos"), 401: jsonResponse("Faça login"),
    403: jsonResponse("Exige administrador"), 404: jsonResponse("Turma ou aluno não encontrado"), 409: jsonResponse("Cadastro inativo ou aluno já associado a outra turma") } });
registry.registerPath({ method: "get", path: "/contas/{id}", tags: ["Contas"], security: [{ bearerAuth: [] }],
  summary: "Consulta a identidade central (ADMIN)", request: { params: idParam },
  responses: { 200: jsonResponse("Conta sem credenciais"), 404: jsonResponse("Conta não encontrada") } });
registry.registerPath({ method: "put", path: "/contas/{id}/perfil", tags: ["Contas"], security: [{ bearerAuth: [] }],
  summary: "Troca o perfil da conta e encerra suas sessões (ADMIN)", request: { params: idParam, body: jsonBody(alterarPerfilSchema) },
  responses: { 200: jsonResponse("Perfil atualizado; o titular precisa fazer login novamente"),
    400: jsonResponse("Perfil inválido"), 403: jsonResponse("Exige administrador"), 404: jsonResponse("Conta não encontrada") } });
const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API PAW-Creche",
    version: "1.0.0",
    description: "Documentação da API de gerenciamento de creche, gerada a partir dos schemas Zod.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
});
