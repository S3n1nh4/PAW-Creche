# PAW Creche — Banco de dados

PostgreSQL 18 para desenvolvimento da plataforma de gestão de creche. Este repositório prepara somente o banco; front-end e back-end TypeScript serão desenvolvidos pela equipe. Usamos a imagem oficial diretamente, sem necessidade de Dockerfile.

## Iniciar

Instale e abra o Docker Desktop com containers Linux. Na raiz do projeto, no PowerShell:

```powershell
Copy-Item .env.example .env
# Edite POSTGRES_PASSWORD no arquivo .env antes de iniciar.
docker compose up -d --wait
docker compose ps
```

O volume `postgres_data` mantém os dados entre reinicializações. Os scripts em `database/init` são executados em ordem somente na primeira inicialização de um volume vazio. Alterar esses scripts não atualiza bancos existentes: a partir do uso compartilhado, novas mudanças precisam de migrações SQL versionadas e aplicadas explicitamente.

Se a porta `5432` estiver ocupada ou bloqueada, defina `POSTGRES_PORT=5433` no `.env` e use essa porta no cliente SQL e na URL do back-end. Alterar a senha no `.env` após a inicialização não altera a senha já gravada no banco; essa troca exige `ALTER ROLE` no PostgreSQL e atualização dos clientes.

## Conectar o back-end ou um cliente SQL

| Configuração          | Valor padrão                    |
| --------------------- | ------------------------------- |
| Host na máquina local | `localhost`                     |
| Porta                 | `5432` (configurável no `.env`) |
| Banco                 | `paw_creche`                    |
| Usuário               | `paw`                           |
| Senha                 | valor definido no `.env`        |
| Schema                | `public`                        |

Exemplo de variável para o futuro back-end:

```dotenv
DATABASE_URL=postgresql://paw:SENHA_CODIFICADA@localhost:5432/paw_creche
```

Caracteres especiais do usuário e da senha devem ser codificados para URL. Se o back-end entrar no mesmo Compose, use `db:5432` como endereço e aguarde `db` com `condition: service_healthy`. Containers em outro Compose precisam compartilhar uma rede explicitamente. Nunca exponha credenciais ao front-end.

O usuário criado pela imagem é administrador do PostgreSQL e serve ao desenvolvimento local. Para produção, crie um usuário de aplicação com privilégios mínimos, configure segredos, backups e acesso de rede apropriados.

## Modelo e decisões

Nomes SQL usam minúsculas e não têm acentos. IDs são inteiros gerados pelo banco, compatíveis com `number` no TypeScript. Valores monetários usam `numeric(12,2)`; trate-os como decimais no back-end, evitando arredondamentos de ponto flutuante. Datas civis usam `date`; instantes usam `timestamptz`, com fuso padrão `America/Sao_Paulo`.

| Tabela             | Finalidade                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| `admin`            | Administradores, email único sem diferenciar maiúsculas e hash de senha |
| `titia`            | Educadoras, contato, admissão, salário e conta de acesso                |
| `turma`            | Nome, ano letivo e turno: `manha`, `tarde` ou `integral`                |
| `turma_titia`      | Associação de várias titias a várias turmas                             |
| `aluno`            | Criança, responsável e turma atual opcional                             |
| `presenca`         | Uma chamada por aluno e dia, com turma e titia autora                   |
| `presenca_titia`   | Um ponto por titia e dia, com entrada/saída opcionais e admin autor     |
| `folha_pagamento`  | Uma folha por titia e mês, com líquido calculado pelo banco             |
| `advertencia`      | Ocorrência do aluno e titia autora                                      |
| `comportamento`    | Registro descritivo do aluno e titia autora                             |

```mermaid
erDiagram
    TURMA ||--o{ ALUNO : agrupa
    TURMA ||--o{ TURMA_TITIA : possui
    TITIA ||--o{ TURMA_TITIA : participa
    ALUNO ||--o{ PRESENCA : recebe
    TURMA ||--o{ PRESENCA : contextualiza
    TITIA ||--o{ PRESENCA : registra
    TITIA ||--o{ PRESENCA_TITIA : possui
    ADMIN ||--o{ PRESENCA_TITIA : registra
    TITIA ||--o{ FOLHA_PAGAMENTO : recebe
    ADMIN ||--o{ FOLHA_PAGAMENTO : registra
    ALUNO ||--o{ ADVERTENCIA : recebe
    TITIA ||--o{ ADVERTENCIA : registra
    ALUNO ||--o{ COMPORTAMENTO : possui
    TITIA ||--o{ COMPORTAMENTO : registra
```

Premissas que a equipe pode ajustar:

- Cada aluno possui no máximo uma turma atual. Trocar sua turma não altera a turma das presenças passadas. Não há histórico completo de matrículas nesta primeira versão.
- Ponto contempla uma entrada e uma saída diárias, sem intervalos ou cálculo automático de horas extras.
- `competencia` é sempre o primeiro dia do mês, por exemplo `2026-11-01`. O salário na folha é uma fotografia do valor daquele mês. Alterar o salário da titia não altera folhas anteriores. Não há cálculo automático de encargos ou descontos por faltas.
- Presença aceita `presente`, `falta` e `falta_justificada`. Comportamento é texto livre.
- Remova uma titia de uma turma excluindo a associação em `turma_titia`; remova um aluno de uma turma atribuindo `NULL` a `aluno.turma_id`. Prefira `ativo = false` para desativar contas, turmas e alunos. Chaves estrangeiras impedem excluir cadastros com registros dependentes, preservando o histórico.
- Não são criadas contas ou senhas iniciais. O back-end deve gerar um hash seguro antes de inserir `senha_hash`; nunca grave senhas em texto puro.

## Contrato de autorização para o back-end

`admin` e `titia` são perfis da aplicação, não usuários individuais do PostgreSQL. A existência das tabelas não restringe automaticamente as operações do cliente SQL. O back-end deve autenticar o usuário, verificar o perfil em cada rota e obter o ID do autor pela sessão autenticada, sem confiar no ID enviado pelo navegador.

| Perfil | Operações previstas                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| TITIA  | Adicionar aluno; registrar chamada; adicionar/remover advertência; adicionar/alterar/remover comportamento |
| ADMIN  | Adicionar/desativar titia; criar/alterar/desativar turma; gerenciar associações de alunos e titias; gerenciar folha e ponto |

O back-end deve ainda validar idade/data de nascimento, associação da titia e do aluno à turma ao registrar chamada e o acesso aos alunos da turma. O banco valida relacionamentos, unicidade e consistência básica; não implementa autorização por usuário nem validações históricas de matrícula. Emails são únicos dentro de cada perfil; o login deve distinguir ADMIN de TITIA.

## Comandos úteis

```powershell
docker compose logs -f db
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose stop
docker compose down
```

`down` mantém os dados. **`docker compose down -v` apaga definitivamente o volume e todos os dados deste Compose**. Use apenas para recriar um ambiente descartável; a próxima subida executará novamente o schema.

Teste de integração transacional (não mantém dados fictícios):

```powershell
Get-Content -Raw database/tests/smoke.sql | docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Backup em formato binário dentro do container e cópia para o host (evita redirecionamento binário pelo PowerShell):

```powershell
New-Item -ItemType Directory -Force backups
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/paw_creche.dump'
docker compose cp db:/tmp/paw_creche.dump ./backups/paw_creche.dump
```

Referência de inicialização e persistência: [imagem oficial PostgreSQL](https://hub.docker.com/_/postgres).
