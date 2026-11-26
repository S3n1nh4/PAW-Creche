CREATE TABLE atividade (
  id SERIAL PRIMARY KEY,
  turma_id INTEGER NOT NULL REFERENCES turma(id),
  cuidador_id INTEGER NOT NULL REFERENCES cuidador(id),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 5),
  inicio VARCHAR(5) NOT NULL CHECK (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  fim VARCHAR(5) NOT NULL CHECK (fim ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  descricao VARCHAR(200) NOT NULL CHECK (length(btrim(descricao)) >= 3),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT atividade_ordem_check CHECK (inicio < fim)
);
CREATE INDEX atividade_turma_id_dia_semana_inicio_idx ON atividade(turma_id, dia_semana, inicio);
