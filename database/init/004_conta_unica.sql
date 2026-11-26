BEGIN;
LOCK TABLE admin, cuidador IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT email COLLATE "C" FROM (SELECT email FROM admin UNION ALL SELECT email FROM cuidador) u GROUP BY email COLLATE "C" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Há emails idênticos em contas distintas. Revise os cadastros; nenhuma conta foi removida.';
  END IF;
END $$;

CREATE TABLE conta (
  id SERIAL PRIMARY KEY,
  email TEXT COLLATE "C" NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('ADMIN','CUIDADOR')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  versao_sessao INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE admin ADD COLUMN conta_id INTEGER UNIQUE REFERENCES conta(id);
ALTER TABLE cuidador ADD COLUMN conta_id INTEGER UNIQUE REFERENCES conta(id);
INSERT INTO conta(email,senha_hash,perfil,ativo) SELECT email,senha_hash,'ADMIN',ativo FROM admin;
INSERT INTO conta(email,senha_hash,perfil,ativo) SELECT email,senha_hash,'CUIDADOR',ativo FROM cuidador;
UPDATE admin a SET conta_id=c.id FROM conta c WHERE c.perfil='ADMIN' AND c.email=a.email COLLATE "C";
UPDATE cuidador a SET conta_id=c.id FROM conta c WHERE c.perfil='CUIDADOR' AND c.email=a.email COLLATE "C";

-- Retira a regra anterior: agora maiúsculas e espaços externos fazem diferença.
DROP INDEX IF EXISTS admin_email_normalizado_key;
DROP INDEX IF EXISTS cuidador_email_normalizado_key;
DROP INDEX IF EXISTS admin_email_unico;
DROP INDEX IF EXISTS cuidador_email_unico;
DROP INDEX IF EXISTS titia_email_unico;

-- Compatibilidade com os cadastros existentes: conta é a identidade central.
CREATE FUNCTION vincular_conta() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c conta%ROWTYPE; p TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  p := CASE TG_TABLE_NAME WHEN 'admin' THEN 'ADMIN' ELSE 'CUIDADOR' END;
  IF TG_OP='INSERT' THEN
    IF NEW.conta_id IS NULL THEN
      INSERT INTO conta(email,senha_hash,perfil,ativo) VALUES(NEW.email,NEW.senha_hash,p,NEW.ativo) RETURNING id INTO NEW.conta_id;
    ELSE
      SELECT * INTO STRICT c FROM conta WHERE id=NEW.conta_id FOR UPDATE;
      IF c.perfil<>p THEN RAISE EXCEPTION 'Perfil incompatível com a conta' USING ERRCODE='23514'; END IF;
      NEW.email:=c.email; NEW.senha_hash:=c.senha_hash; NEW.ativo:=c.ativo;
    END IF;
  ELSE
    IF NEW.conta_id IS DISTINCT FROM OLD.conta_id THEN RAISE EXCEPTION 'Não é permitido trocar a identidade da conta' USING ERRCODE='23514'; END IF;
    SELECT * INTO STRICT c FROM conta WHERE id=NEW.conta_id FOR UPDATE;
    IF c.perfil<>p THEN
      RAISE EXCEPTION 'Este cadastro pertence a um perfil anterior' USING ERRCODE='23514';
    END IF;
    UPDATE conta SET email=NEW.email,senha_hash=NEW.senha_hash,ativo=NEW.ativo,
      versao_sessao=versao_sessao + CASE WHEN senha_hash IS DISTINCT FROM NEW.senha_hash OR ativo IS DISTINCT FROM NEW.ativo THEN 1 ELSE 0 END
    WHERE id=NEW.conta_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER admin_conta BEFORE INSERT OR UPDATE ON admin FOR EACH ROW EXECUTE FUNCTION vincular_conta();
CREATE TRIGGER cuidador_conta BEFORE INSERT OR UPDATE ON cuidador FOR EACH ROW EXECUTE FUNCTION vincular_conta();
ALTER TABLE admin ADD CONSTRAINT admin_conta_obrigatoria CHECK(conta_id IS NOT NULL);
ALTER TABLE cuidador ADD CONSTRAINT cuidador_conta_obrigatoria CHECK(conta_id IS NOT NULL);

CREATE FUNCTION sincronizar_conta() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF pg_trigger_depth()>1 THEN RETURN NEW; END IF;
  UPDATE admin SET email=NEW.email,senha_hash=NEW.senha_hash,ativo=(NEW.ativo AND NEW.perfil='ADMIN') WHERE conta_id=NEW.id;
  UPDATE cuidador SET email=NEW.email,senha_hash=NEW.senha_hash,ativo=(NEW.ativo AND NEW.perfil='CUIDADOR') WHERE conta_id=NEW.id;
  RETURN NEW;
END $$;
CREATE TRIGGER conta_cadastros AFTER UPDATE ON conta FOR EACH ROW EXECUTE FUNCTION sincronizar_conta();

CREATE FUNCTION invalidar_sessoes_conta() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.senha_hash IS DISTINCT FROM OLD.senha_hash OR NEW.perfil IS DISTINCT FROM OLD.perfil
    OR NEW.ativo IS DISTINCT FROM OLD.ativo OR NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.versao_sessao := OLD.versao_sessao + 1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER conta_sessoes BEFORE UPDATE ON conta FOR EACH ROW EXECUTE FUNCTION invalidar_sessoes_conta();
COMMIT;
