\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE
    a integer;
    t integer;
    c integer;
    u integer;
    f integer;
    liquido numeric;
BEGIN
    INSERT INTO admin(nome,email,senha_hash) VALUES ('Admin teste','smoke-admin@example.invalid','hash-ficticio') RETURNING id INTO a;
    INSERT INTO titia(nome,email,senha_hash,salario_base) VALUES ('Titia teste','smoke-titia@example.invalid','hash-ficticio',2000) RETURNING id INTO t;
    INSERT INTO turma(nome,ano_letivo,turno) VALUES ('Turma teste',2026,'integral') RETURNING id INTO c;
    INSERT INTO turma_titia VALUES (c,t);
    INSERT INTO aluno(nome,data_nascimento,turma_id,responsavel_nome,responsavel_telefone)
        VALUES ('Aluno teste','2023-01-01',c,'Responsável teste','11999999999') RETURNING id INTO u;
    INSERT INTO presenca(aluno_id,turma_id,status,registrado_por_titia_id) VALUES (u,c,'presente',t);
    BEGIN
        INSERT INTO presenca(aluno_id,turma_id,status,registrado_por_titia_id) VALUES (u,c,'falta',t);
        RAISE EXCEPTION 'Falha: presença duplicada aceita';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    INSERT INTO presenca_titia(titia_id,status,entrada,saida,registrado_por_admin_id)
        VALUES (t,'presente',now(),now() + interval '8 hours',a);
    BEGIN
        INSERT INTO presenca_titia(titia_id,data,status,entrada,saida,registrado_por_admin_id)
            VALUES (t,CURRENT_DATE + 1,'presente',now(),now() - interval '1 hour',a);
        RAISE EXCEPTION 'Falha: saída anterior à entrada aceita';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    INSERT INTO folha_pagamento(titia_id,competencia,salario_base,adicionais,descontos,registrado_por_admin_id)
        VALUES (t,'2026-11-01',2000,100,50,a) RETURNING id,valor_liquido INTO f,liquido;
    IF liquido <> 2050 THEN RAISE EXCEPTION 'Falha no cálculo da folha'; END IF;
    UPDATE folha_pagamento SET status = 'pago', pago_em = CURRENT_DATE WHERE id = f;
    INSERT INTO advertencia(aluno_id,titia_id,descricao) VALUES (u,t,'Advertência teste');
    INSERT INTO comportamento(aluno_id,titia_id,descricao) VALUES (u,t,'Comportamento teste');
    UPDATE comportamento SET descricao = 'Registro alterado' WHERE aluno_id = u;
    DELETE FROM advertencia WHERE aluno_id = u;
    DELETE FROM comportamento WHERE aluno_id = u;
    BEGIN
        DELETE FROM titia WHERE id = t;
        RAISE EXCEPTION 'Falha: exclusão de titia com histórico aceita';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
    RAISE NOTICE 'Teste de integração concluído com sucesso';
END $$;
ROLLBACK;
