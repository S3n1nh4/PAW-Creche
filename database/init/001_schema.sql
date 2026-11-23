-- Bootstrap para um banco NOVO, correspondente a backend/prisma/schema.prisma.
-- Não execute sobre um banco já preenchido; não é migração do modelo antigo de titias.
BEGIN;
CREATE TABLE admin (
  id SERIAL PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL,
  senha_hash TEXT NOT NULL, ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cuidador (
  id SERIAL PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL,
  senha_hash TEXT NOT NULL, telefone TEXT,
  data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
  salario_base DECIMAL(12,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE turma (
  id SERIAL PRIMARY KEY, nome TEXT NOT NULL, ano_letivo INTEGER NOT NULL,
  turno TEXT NOT NULL, ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT turma_nome_ano_letivo_turno_key UNIQUE (nome, ano_letivo, turno)
);
CREATE TABLE turma_cuidador (
  turma_id INTEGER NOT NULL REFERENCES turma(id) ON UPDATE CASCADE,
  cuidador_id INTEGER NOT NULL REFERENCES cuidador(id) ON UPDATE CASCADE,
  PRIMARY KEY (turma_id, cuidador_id)
);
CREATE INDEX turma_cuidador_cuidador_idx ON turma_cuidador(cuidador_id);
CREATE TABLE aluno (
  id SERIAL PRIMARY KEY, nome TEXT NOT NULL, data_nascimento DATE NOT NULL,
  turma_id INTEGER REFERENCES turma(id) ON DELETE SET NULL ON UPDATE CASCADE,
  responsavel_nome TEXT NOT NULL, responsavel_telefone TEXT NOT NULL,
  responsavel_email TEXT, observacoes TEXT, ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX aluno_turma_idx ON aluno(turma_id);
CREATE TABLE presenca (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES aluno(id) ON UPDATE CASCADE,
  turma_id INTEGER NOT NULL REFERENCES turma(id) ON UPDATE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE, status TEXT NOT NULL, observacao TEXT,
  registrado_por_cuidador_id INTEGER NOT NULL REFERENCES cuidador(id) ON UPDATE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT presenca_aluno_id_data_key UNIQUE (aluno_id, data)
);
CREATE INDEX presenca_turma_data_idx ON presenca(turma_id, data);
CREATE INDEX presenca_autor_idx ON presenca(registrado_por_cuidador_id);
CREATE TABLE presenca_cuidador (
  id SERIAL PRIMARY KEY,
  cuidador_id INTEGER NOT NULL REFERENCES cuidador(id) ON UPDATE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE, status TEXT NOT NULL,
  entrada TIMESTAMPTZ, saida TIMESTAMPTZ, observacao TEXT,
  registrado_por_admin_id INTEGER NOT NULL REFERENCES admin(id) ON UPDATE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT presenca_cuidador_cuidador_id_data_key UNIQUE (cuidador_id, data)
);
CREATE INDEX presenca_cuidador_admin_idx ON presenca_cuidador(registrado_por_admin_id);
CREATE TABLE comportamento (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES aluno(id) ON UPDATE CASCADE,
  cuidador_id INTEGER NOT NULL REFERENCES cuidador(id) ON UPDATE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE, descricao TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX comportamento_aluno_data_idx ON comportamento(aluno_id, data);
CREATE INDEX comportamento_cuidador_idx ON comportamento(cuidador_id);
COMMIT;
