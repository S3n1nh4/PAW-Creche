BEGIN;
ALTER TABLE aluno
  ADD COLUMN responsavel_parentesco TEXT,
  ADD COLUMN responsavel_secundario_nome TEXT,
  ADD COLUMN responsavel_secundario_parentesco TEXT,
  ADD COLUMN responsavel_secundario_telefone TEXT;
ALTER TABLE aluno ADD CONSTRAINT aluno_secundario_completo_check CHECK (
  num_nonnulls(responsavel_secundario_nome, responsavel_secundario_parentesco, responsavel_secundario_telefone) IN (0, 3)
);
ALTER TABLE aluno ADD CONSTRAINT aluno_secundario_telefone_check CHECK (
  responsavel_secundario_telefone IS NULL OR responsavel_secundario_telefone ~ '^[0-9]{10,11}$'
);
-- A idade é validada pela aplicação no momento do cadastro/edição;
-- registros antigos continuam preservados conforme as crianças envelhecem.
COMMIT;
