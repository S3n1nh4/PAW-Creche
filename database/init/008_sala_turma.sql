ALTER TABLE turma ADD COLUMN sala TEXT;
ALTER TABLE turma ADD CONSTRAINT turma_sala_check
  CHECK (sala IS NULL OR (length(btrim(sala)) BETWEEN 1 AND 50));
