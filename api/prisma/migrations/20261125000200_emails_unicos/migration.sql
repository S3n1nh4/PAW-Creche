BEGIN;
-- Evita alterações concorrentes durante a verificação e normalização.
LOCK TABLE admin, cuidador IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin GROUP BY lower(btrim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Existem emails duplicados em admin após normalização. Nenhuma conta foi removida; revise os cadastros.';
  END IF;
  IF EXISTS (SELECT 1 FROM cuidador GROUP BY lower(btrim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Existem emails duplicados em cuidador após normalização. Nenhuma conta foi removida; revise os cadastros.';
  END IF;
END $$;

UPDATE admin SET email = lower(btrim(email)) WHERE email IS DISTINCT FROM lower(btrim(email));
UPDATE cuidador SET email = lower(btrim(email)) WHERE email IS DISTINCT FROM lower(btrim(email));

-- Unicidade por perfil, incluindo gravações diretas e requisições simultâneas.
CREATE UNIQUE INDEX IF NOT EXISTS admin_email_normalizado_key ON admin (lower(btrim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS cuidador_email_normalizado_key ON cuidador (lower(btrim(email)));
COMMIT;
