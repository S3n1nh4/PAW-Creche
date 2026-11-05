BEGIN;

CREATE TABLE admin (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    email text NOT NULL CHECK (btrim(email) <> ''),
    senha_hash text NOT NULL CHECK (btrim(senha_hash) <> ''),
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_email_unico ON admin (lower(email));

CREATE TABLE titia (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    email text NOT NULL CHECK (btrim(email) <> ''),
    senha_hash text NOT NULL CHECK (btrim(senha_hash) <> ''),
    telefone text,
    data_admissao date NOT NULL DEFAULT CURRENT_DATE,
    salario_base numeric(12,2) NOT NULL DEFAULT 0 CHECK (salario_base >= 0),
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX titia_email_unico ON titia (lower(email));

CREATE TABLE turma (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    ano_letivo integer NOT NULL CHECK (ano_letivo BETWEEN 2000 AND 9999),
    turno text NOT NULL CHECK (turno IN ('manha', 'tarde', 'integral')),
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now(),
    UNIQUE (nome, ano_letivo, turno)
);

CREATE TABLE turma_titia (
    turma_id integer NOT NULL REFERENCES turma(id),
    titia_id integer NOT NULL REFERENCES titia(id),
    PRIMARY KEY (turma_id, titia_id)
);
CREATE INDEX turma_titia_titia_idx ON turma_titia(titia_id);

CREATE TABLE aluno (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    data_nascimento date NOT NULL,
    turma_id integer REFERENCES turma(id),
    responsavel_nome text NOT NULL CHECK (btrim(responsavel_nome) <> ''),
    responsavel_telefone text NOT NULL CHECK (btrim(responsavel_telefone) <> ''),
    responsavel_email text,
    observacoes text,
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX aluno_turma_idx ON aluno(turma_id);

CREATE TABLE presenca (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id integer NOT NULL REFERENCES aluno(id),
    turma_id integer NOT NULL REFERENCES turma(id),
    data date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL CHECK (status IN ('presente', 'falta', 'falta_justificada')),
    observacao text,
    registrado_por_titia_id integer NOT NULL REFERENCES titia(id),
    criado_em timestamptz NOT NULL DEFAULT now(),
    UNIQUE (aluno_id, data)
);
CREATE INDEX presenca_turma_data_idx ON presenca(turma_id, data);
CREATE INDEX presenca_autor_idx ON presenca(registrado_por_titia_id);

CREATE TABLE presenca_titia (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titia_id integer NOT NULL REFERENCES titia(id),
    data date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL CHECK (status IN ('presente', 'falta', 'falta_justificada')),
    entrada timestamptz,
    saida timestamptz,
    observacao text,
    registrado_por_admin_id integer NOT NULL REFERENCES admin(id),
    criado_em timestamptz NOT NULL DEFAULT now(),
    UNIQUE (titia_id, data),
    CHECK (saida IS NULL OR (entrada IS NOT NULL AND saida >= entrada)),
    CHECK (status = 'presente' OR (entrada IS NULL AND saida IS NULL))
);
CREATE INDEX presenca_titia_admin_idx ON presenca_titia(registrado_por_admin_id);

CREATE TABLE folha_pagamento (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titia_id integer NOT NULL REFERENCES titia(id),
    competencia date NOT NULL CHECK (EXTRACT(DAY FROM competencia) = 1),
    salario_base numeric(12,2) NOT NULL CHECK (salario_base >= 0),
    adicionais numeric(12,2) NOT NULL DEFAULT 0 CHECK (adicionais >= 0),
    descontos numeric(12,2) NOT NULL DEFAULT 0 CHECK (descontos >= 0),
    valor_liquido numeric(12,2) GENERATED ALWAYS AS (salario_base + adicionais - descontos) STORED,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
    pago_em date,
    registrado_por_admin_id integer NOT NULL REFERENCES admin(id),
    criado_em timestamptz NOT NULL DEFAULT now(),
    UNIQUE (titia_id, competencia),
    CHECK (descontos <= salario_base + adicionais),
    CHECK ((status = 'pago' AND pago_em IS NOT NULL) OR (status = 'pendente' AND pago_em IS NULL))
);
CREATE INDEX folha_pagamento_admin_idx ON folha_pagamento(registrado_por_admin_id);

CREATE TABLE advertencia (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id integer NOT NULL REFERENCES aluno(id),
    titia_id integer NOT NULL REFERENCES titia(id),
    data date NOT NULL DEFAULT CURRENT_DATE,
    descricao text NOT NULL CHECK (btrim(descricao) <> ''),
    criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX advertencia_aluno_data_idx ON advertencia(aluno_id, data);
CREATE INDEX advertencia_titia_idx ON advertencia(titia_id);

CREATE TABLE comportamento (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id integer NOT NULL REFERENCES aluno(id),
    titia_id integer NOT NULL REFERENCES titia(id),
    data date NOT NULL DEFAULT CURRENT_DATE,
    descricao text NOT NULL CHECK (btrim(descricao) <> ''),
    criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comportamento_aluno_data_idx ON comportamento(aluno_id, data);
CREATE INDEX comportamento_titia_idx ON comportamento(titia_id);

COMMIT;
