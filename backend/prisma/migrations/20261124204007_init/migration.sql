-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuidador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" TEXT,
    "data_admissao" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salario_base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuidador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ano_letivo" INTEGER NOT NULL,
    "turno" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_cuidador" (
    "turma_id" INTEGER NOT NULL,
    "cuidador_id" INTEGER NOT NULL,

    CONSTRAINT "turma_cuidador_pkey" PRIMARY KEY ("turma_id","cuidador_id")
);

-- CreateTable
CREATE TABLE "aluno" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "turma_id" INTEGER,
    "responsavel_nome" TEXT NOT NULL,
    "responsavel_telefone" TEXT NOT NULL,
    "responsavel_email" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presenca" (
    "id" SERIAL NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "turma_id" INTEGER NOT NULL,
    "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "observacao" TEXT,
    "registrado_por_cuidador_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presenca_cuidador" (
    "id" SERIAL NOT NULL,
    "cuidador_id" INTEGER NOT NULL,
    "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "entrada" TIMESTAMPTZ,
    "saida" TIMESTAMPTZ,
    "observacao" TEXT,
    "registrado_por_admin_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presenca_cuidador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comportamento" (
    "id" SERIAL NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "cuidador_id" INTEGER NOT NULL,
    "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comportamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "turma_nome_ano_letivo_turno_key" ON "turma"("nome", "ano_letivo", "turno");

-- CreateIndex
CREATE INDEX "turma_cuidador_cuidador_idx" ON "turma_cuidador"("cuidador_id");

-- CreateIndex
CREATE INDEX "aluno_turma_idx" ON "aluno"("turma_id");

-- CreateIndex
CREATE INDEX "presenca_turma_data_idx" ON "presenca"("turma_id", "data");

-- CreateIndex
CREATE INDEX "presenca_autor_idx" ON "presenca"("registrado_por_cuidador_id");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_aluno_id_data_key" ON "presenca"("aluno_id", "data");

-- CreateIndex
CREATE INDEX "presenca_cuidador_admin_idx" ON "presenca_cuidador"("registrado_por_admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_cuidador_cuidador_id_data_key" ON "presenca_cuidador"("cuidador_id", "data");

-- CreateIndex
CREATE INDEX "comportamento_aluno_data_idx" ON "comportamento"("aluno_id", "data");

-- CreateIndex
CREATE INDEX "comportamento_cuidador_idx" ON "comportamento"("cuidador_id");

-- AddForeignKey
ALTER TABLE "turma_cuidador" ADD CONSTRAINT "turma_cuidador_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_cuidador" ADD CONSTRAINT "turma_cuidador_cuidador_id_fkey" FOREIGN KEY ("cuidador_id") REFERENCES "cuidador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_registrado_por_cuidador_id_fkey" FOREIGN KEY ("registrado_por_cuidador_id") REFERENCES "cuidador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_cuidador" ADD CONSTRAINT "presenca_cuidador_cuidador_id_fkey" FOREIGN KEY ("cuidador_id") REFERENCES "cuidador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_cuidador" ADD CONSTRAINT "presenca_cuidador_registrado_por_admin_id_fkey" FOREIGN KEY ("registrado_por_admin_id") REFERENCES "admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comportamento" ADD CONSTRAINT "comportamento_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comportamento" ADD CONSTRAINT "comportamento_cuidador_id_fkey" FOREIGN KEY ("cuidador_id") REFERENCES "cuidador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
