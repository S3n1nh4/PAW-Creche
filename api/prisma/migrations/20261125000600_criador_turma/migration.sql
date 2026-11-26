ALTER TABLE turma ADD COLUMN criado_por_id INTEGER;
ALTER TABLE turma ADD CONSTRAINT turma_criado_por_id_fkey
  FOREIGN KEY (criado_por_id) REFERENCES admin(id) ON DELETE SET NULL ON UPDATE CASCADE;
