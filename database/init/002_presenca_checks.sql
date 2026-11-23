-- Também pode ser aplicado explicitamente em um banco existente com os modelos atuais.
-- Não renomeia tabelas antigas (titia); não remove nem corrige dados inválidos.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presenca_status_check' AND conrelid = 'presenca'::regclass) THEN
    ALTER TABLE presenca ADD CONSTRAINT presenca_status_check
      CHECK (status IN ('presente', 'falta', 'falta_justificada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presenca_cuidador_status_check' AND conrelid = 'presenca_cuidador'::regclass) THEN
    ALTER TABLE presenca_cuidador ADD CONSTRAINT presenca_cuidador_status_check
      CHECK (status IN ('presente', 'falta', 'falta_justificada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presenca_cuidador_horarios_check' AND conrelid = 'presenca_cuidador'::regclass) THEN
    ALTER TABLE presenca_cuidador ADD CONSTRAINT presenca_cuidador_horarios_check CHECK (
      (saida IS NULL OR (entrada IS NOT NULL AND saida >= entrada))
      AND (status = 'presente' OR (entrada IS NULL AND saida IS NULL))
    );
  END IF;
END $$;
COMMIT;
