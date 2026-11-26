BEGIN;
ALTER TABLE turma ADD COLUMN faixa_etaria TEXT;
ALTER TABLE turma ADD CONSTRAINT turma_faixa_etaria_check CHECK (
  faixa_etaria IS NULL OR faixa_etaria IN ('bercario_i', 'bercario_ii', 'maternal_i', 'maternal_ii')
);
COMMIT;
