-- Executar SOMENTE no banco descartável de testes já inicializado.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() NOT LIKE '%\_test' ESCAPE '\' THEN
    RAISE EXCEPTION 'Este teste exige banco com nome terminado em _test';
  END IF;
END $$;
-- Simula os nomes originais, depois aplica a migração duas vezes.
ALTER TABLE cuidador RENAME TO titia;
ALTER TABLE turma_cuidador RENAME TO turma_titia;
ALTER TABLE presenca_cuidador RENAME TO presenca_titia;
ALTER TABLE turma_titia RENAME COLUMN cuidador_id TO titia_id;
ALTER TABLE presenca_titia RENAME COLUMN cuidador_id TO titia_id;
ALTER TABLE presenca RENAME COLUMN registrado_por_cuidador_id TO registrado_por_titia_id;
ALTER TABLE comportamento RENAME COLUMN cuidador_id TO titia_id;
\i /tmp/001_titia_para_cuidador.sql
\i /tmp/001_titia_para_cuidador.sql
\i /docker-entrypoint-initdb.d/002_presenca_checks.sql
DO $$ BEGIN
  IF to_regclass('public.cuidador') IS NULL OR to_regclass('public.presenca_cuidador') IS NULL OR to_regclass('public.turma_cuidador') IS NULL THEN
    RAISE EXCEPTION 'Migração não criou os nomes esperados';
  END IF;
END $$;
