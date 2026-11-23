-- Compatibilidade com o banco original de 05/11. Preserva dados e vínculos.
-- Pode ser reaplicado; se os dois modelos coexistirem, aborta para evitar ambiguidade.
BEGIN;
DO $$
DECLARE par TEXT[];
BEGIN
  FOREACH par SLICE 1 IN ARRAY ARRAY[
    ['titia','cuidador'], ['turma_titia','turma_cuidador'], ['presenca_titia','presenca_cuidador']
  ] LOOP
    IF to_regclass('public.' || par[1]) IS NOT NULL THEN
      IF to_regclass('public.' || par[2]) IS NOT NULL THEN
        RAISE EXCEPTION 'As tabelas % e % coexistem; revise a migração manualmente.', par[1], par[2];
      END IF;
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', par[1], par[2]);
    END IF;
  END LOOP;
  FOREACH par SLICE 1 IN ARRAY ARRAY[
    ['turma_cuidador','titia_id','cuidador_id'],
    ['presenca_cuidador','titia_id','cuidador_id'],
    ['presenca','registrado_por_titia_id','registrado_por_cuidador_id'],
    ['comportamento','titia_id','cuidador_id']
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = par[1] AND column_name = par[2]) THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = par[1] AND column_name = par[3]) THEN
        RAISE EXCEPTION 'Colunas antigas e novas coexistem em %.', par[1];
      END IF;
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', par[1], par[2], par[3]);
    END IF;
  END LOOP;
END $$;
COMMIT;
